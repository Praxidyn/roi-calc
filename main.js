function fmt(n, d = 0) {
  if (isNaN(n) || !isFinite(n)) return "–";
  const o = Number(n);
  return o.toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}
function dollars(n, d = 0) {
  if (isNaN(n) || !isFinite(n)) return "–";
  return "$" + fmt(n, d);
}

function readInputs() {
  const gi = (id) => parseFloat(document.getElementById(id).value);
  return {
    sprayHours: gi("sprayHours"),
    loadBase: gi("loadBase"),
    loadMM: gi("loadMM"),
    speed: gi("speedMph"),
    boom1: gi("boom1"),
    tank1: gi("tank1"),
    dep1: gi("dep1"),
    boom2: gi("boom2"),
    tank2: gi("tank2"),
    dep2: gi("dep2"),
    gpa: gi("gpa"),
    fe: gi("fieldEff"),
    annualAcres: gi("annualAcres"),
    yearsLife: gi("yearsLife"),
    revPerAcre: gi("revPerAcre"),
  };
}

function efc(boom, mph, fe) {
  return (boom * mph * (fe/100.0)) / 8.25;
} // ac/hr
function acresPerLoad(tank, gpa) {
  return tank / gpa;
}
function cycleHours(acresPerLoad, efc, loadMin) {
  return (acresPerLoad / efc) + (loadMin / 60);
}
function loadsPerDay(sprayHours, cycleH) {
  return sprayHours / cycleH;
}
function acresPerDay(loads, acresPerLoad) {
  return loads * acresPerLoad;
}
function effAcPerHr(acresDay, sprayHours) {
  return acresDay / sprayHours;
}

// Lifetime extra acres based on productivity gain
function lifetimeExtra(lifeAcres, extraDay, baseDay) {
  return baseDay > 0 ? lifeAcres * (extraDay / baseDay) : NaN;
}

function calcForConfig(cfg, X) {
  const {
    sprayHours,
    loadBase,
    loadMM,
    speed,
    fe,
    gpa,
    annualAcres,
    yearsLife,
    mixmatePrice,
    revPerAcre,
  } = X;
  const { boom, tank, price, dep } = cfg;
  const lifeBase = annualAcres * yearsLife;

  const efcVal = efc(boom, speed, fe);
  const apl = acresPerLoad(tank, gpa);

  function block(loadMin) {
    const cyc = cycleHours(apl, efcVal, loadMin);
    const loads = loadsPerDay(sprayHours, cyc);
    const acDay = acresPerDay(loads, apl);
    const effHr = effAcPerHr(acDay, sprayHours);
    return { loadMin, cyc, loads, acDay, effHr };
  }
  // Calculate base data
  const base = block(loadBase);
  const MM = block(loadMM);
  
  // Extra Acres covered day, year, lifetime
  const extraAcresDay = MM.acDay - base.acDay;
  const extraAcresLife = lifetimeExtra(lifeBase, extraAcresDay, base.acDay);
  const extraAcresYear = extraAcresLife / yearsLife;

  // Total acres for Mixmate day, year, lifetime
  const totalMixmateAcresDay = MM.acDay;
  const totalMixmateAcresLife = lifetimeExtra(lifeBase, extraAcresDay, base.acDay) + lifeBase;
  const totalMixmateAcresYear = totalMixmateAcresLife / yearsLife;

  // Saved Hours in days, years, and lifetime
  const savedHoursDay = (base.acDay / base.effHr) - (base.acDay / MM.effHr);
  const savedHoursYear = (annualAcres / base.effHr) - (annualAcres / MM.effHr);
  const savedHoursLife = (lifeBase / base.effHr) - (lifeBase / MM.effHr);

  // Depreciation Saved in days, years and lifetime
  const saveDepDolDay = (savedHoursDay * cfg.dep);
  const saveDepDolYear = (savedHoursYear * cfg.dep);
  const saveDepDolLife = (savedHoursLife * cfg.dep);

  // Revenue Gained in days, years, and lifetime
  const revenueGainedDay = (extraAcresDay * revPerAcre);
  const revenueGainedYear = (extraAcresYear * revPerAcre);
  const revenueGainedLife = (extraAcresLife * revPerAcre);

  // Mixmate ROI
  const mixmateDepDaysRoi = mixmatePrice / saveDepDolDay;
  const mixmateDepAcresRoi = mixmateDepDaysRoi * base.acDay;
  const mixmateRevDaysRoi = mixmatePrice / revenueGainedDay;
  const mixmateRevAcresRoi = mixmateRevDaysRoi * MM.acDay;

  return {
    efc: efcVal,
    apl,
    base,
    MM,
    annualAcres,
    lifeBase,
    extraAcresDay,
    extraAcresYear,
    extraAcresLife,
    totalMixmateAcresDay,
    totalMixmateAcresYear,
    totalMixmateAcresLife,
    savedHoursDay,
    savedHoursYear,
    savedHoursLife,
    saveDepDolDay,
    saveDepDolYear,
    saveDepDolLife,
    revenueGainedDay,
    revenueGainedYear,
    revenueGainedLife,
    mixmateDepDaysRoi,
    mixmateDepAcresRoi,
    mixmateRevAcresRoi,
    mixmateRevDaysRoi,
  };
}

function renderTables() {
  const X = readInputs();
  const configs = [
    {
      label: "Sprayer 1",
      boom: X.boom1,
      tank: X.tank1,
      price: X.price1,
      dep: X.dep1,
    },
    {
      label: "Sprayer 2",
      boom: X.boom2,
      tank: X.tank2,
      price: X.price2,
      dep: X.dep2,
    },
  ];
  const results = configs.map((c) => ({ cfg: c, res: calcForConfig(c, X) }));

  // Decreased Mix Time
  let dmt = `<div style="overflow:auto"><table><thead><tr>
    <th>Sprayer</th><th>Mix Time</th><th>Acres/Day</th>
    <th>Hours Saved/Day</th><th>$ Saved/Day</th>
    <th>Hours Saved/Year</th><th>$ Saved/Year</th>
    <th>Hours Saved/Lifetime</th><th>$ Saved/Lifetime</th>
  </tr></thead><tbody>`;
  results.forEach(({ cfg, res }) => {
    const rows = [
      {
        title: `with Mixmate`,
        time: `${X.loadMM} min`,
        acDay: res.base.acDay,
        savedHoursDay: res.savedHoursDay,
        savedDollarsDay: res.saveDepDolDay,
        savedHoursYear: res.savedHoursYear,
        savedDollarsYear: res.saveDepDolYear,
        savedHoursLife: res.savedHoursLife,
        savedDollarsLife: res.saveDepDolLife,
      },
    ];
    rows.forEach((r) => {
      dmt += `<tr>
        <td>${cfg.label} <span class="badge">${r.title}</span></td>
        <td>${r.time}</td>
        <td>${fmt(r.acDay, 0)}</td>
        <td>${typeof r.savedHoursDay === "string" ? "–" : fmt(r.savedHoursDay, 2)}</td>
        <td>${typeof r.savedDollarsDay === "string" ? "–" : dollars(r.savedDollarsDay, 2)}</td>
        <td>${typeof r.savedHoursYear === "string" ? "–" : fmt(r.savedHoursYear, 2)}</td>
        <td>${typeof r.savedDollarsYear === "string" ? "–" : dollars(r.savedDollarsYear, 2)}</td>
        <td>${typeof r.savedHoursLife === "string" ? "–" : fmt(r.savedHoursLife, 2)}</td>
        <td>${typeof r.savedDollarsLife === "string" ? "–" : dollars(r.savedDollarsLife, 2)}</td>
      </tr>`;
    });
    dmt += `<tr><td colspan="9" style="border-bottom:2px solid #d1d5db"></td></tr>`;
  });
  dmt += "</tbody></table></div>";
  document.getElementById("dmtTable").innerHTML = dmt;

  // Lifetime
  let life = `<div style="overflow:auto"><table><thead><tr>
    <th>Sprayer</th><th>Mix Time</th>
    <th>Potential Daily Acres</th><th>Potential Daily Revenue Gain</th>
    <th>Potential Annual Acres</th><th>Potential Annual Revenue Gain</th>
    <th>Potential Lifetime Acres</th><th>Potential Lifetime Revenue Gain</th>
  </tr></thead><tbody>`;
    results.forEach(({ cfg, res }) => {
    const rows = [
      {
        title: `current mix time`,
        label: `${X.loadBase} min`,
        lifeAcres: res.lifeBase,
        lifeRevGain: "–",
        annualAcres: res.annualAcres,
        annualRevGain: "–",
        dayAcres: res.base.acDay,
        dayRevGain: "–",
      },
      {
        title: `with Mixmate`,
        label: `${X.loadMM} min`,
        lifeAcres: res.totalMixmateAcresLife,
        lifeRevGain: res.revenueGainedLife,
        annualAcres: res.totalMixmateAcresYear,
        annualRevGain: res.revenueGainedYear,
        dayAcres: res.totalMixmateAcresDay,
        dayRevGain: res.revenueGainedDay,
      },
    ];
    rows.forEach((r) => {
      life += `<tr>
        <td>${cfg.label} <span class="badge">${r.title}</span></td>
        <td>${r.label}</td>
        <td>${fmt(r.dayAcres, 0)}</td>
        <td>${typeof r.dayRevGain === "string" ? dollars(0, 2) : dollars(r.dayRevGain, 2)}</td>
        <td>${fmt(r.annualAcres, 0)}</td>
        <td>${typeof r.annualRevGain === "string" ? dollars(0, 2) : dollars(r.annualRevGain, 2)}</td>
        <td>${fmt(r.lifeAcres, 0)}</td>
        <td>${typeof r.lifeRevGain === "string" ? dollars(0, 2) : dollars(r.lifeRevGain, 2)}</td>
      </tr>`;
    });
    life += `<tr><td colspan="9" style="border-bottom:2px solid #d1d5db"></td></tr>`;
  });
  life += "</tbody></table></div>";
  document.getElementById("lifeTable").innerHTML = life;
}

function attach() {
  const ids = [
    "sprayHours",
    "loadBase",
    "loadMM",
    "speedMph",
    "fieldEff",
    "gpa",
    "annualAcres",
    "yearsLife",
    "boom1",
    "tank1",
    "dep1",
    "boom2",
    "tank2",
    "dep2",
    "revPerAcre",
  ];
  ids.forEach((id) =>
    document.getElementById(id).addEventListener("input", renderTables)
  );
  document.getElementById("reset").addEventListener("click", () => {
    document
      .querySelectorAll("#inputs input")
      .forEach((inp) => (inp.value = inp.defaultValue));
    renderTables();
  });
  renderTables();
}

attach();
