const acToHa = 0.404686;
const mphToKph = 1.60934;
const gpaToLph = 9.354;
const galToL = 3.78541;
const ftToM = 0.3048;

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
  if (document.getElementById("toggleMetric").checked) {
    return fmt(n, d) + " Cur";
  } else {
    return "$" + fmt(n, d);
  }

}

function maxAcMin(boom, mph) {
  return ((boom * mph) / 8.25) / 60;
}
function acresPerLoad(tank, gpa) {
  return tank / gpa;
}
function cycleHours(acresPerLoad, ferryTime, maxAcMin, loadMin) {
  const minSpraying = acresPerLoad / maxAcMin;
  return (minSpraying + ferryTime + loadMin) / 60;
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
    yearsLife,
    annualAcres,
    speedMph,
    gpa,
    sprayHours,
    currentMin,
    mixmateMin,
    ferryTime,
    revPerAcre,
    chemCost,
    measError,
  } = X;
  const { boom, tank, dep } = cfg;
  const lifeBase = annualAcres * yearsLife;
  const maxAcMinVal = maxAcMin(boom, speedMph);
  const apl = acresPerLoad(tank, gpa);

  function block(loadMin) {
    const cyc = cycleHours(apl, ferryTime, maxAcMinVal, loadMin);
    const loads = loadsPerDay(sprayHours, cyc);
    const acDay = acresPerDay(loads, apl);
    const effHr = effAcPerHr(acDay, sprayHours);
    return { loadMin, cyc, loads, acDay, effHr };
  }
  // Calculate base data
  const base = block(currentMin);
  const MM = block(mixmateMin);

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

  const chemSavingsDay = base.acDay * (((measError - 0.5) / 100) * chemCost);
  const chemSavingsYear = annualAcres * (((measError - 0.5) / 100) * chemCost);
  const chemSavingsLife = lifeBase * (((measError - 0.5) / 100) * chemCost);

  return {
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
    chemSavingsDay,
    chemSavingsYear,
    chemSavingsLife,
  };
}

function convertUnits() {
  if (document.getElementById("toggleMetric").checked) {
    document.getElementById("annualAreaLabel").innerText = "Annual Sprayed Hectares";
    document.getElementById("revPerAreaLabel").innerText = "Revenue (Cur/ha)";
    document.getElementById("chemCostLabel").innerText = "Chemical Cost (Cur/ha/year)";
    document.getElementById("boomLabel").innerText = "Boom (m)";
    document.getElementById("tankLabel").innerText = "Tank (l)";
    document.getElementById("speedLabel").innerText = "Speed (kph)";
    document.getElementById("appRateLabel").innerText = "Application Rate (l/ha)";
    document.getElementById("depLabel").innerText = "Depreciation (Cur/Eng Hr)";
    // Convert input values to metric
    // document.getElementById("annualAcres").value = (parseFloat(document.getElementById("annualAcres").value) * acToHa).toFixed(0);
    document.getElementById("revPerAcre").value = (parseFloat(document.getElementById("revPerAcre").value) * 5).toFixed(0);
    document.getElementById("chemCost").value = (parseFloat(document.getElementById("chemCost").value) * 5).toFixed(0);
    document.getElementById("boom1").value = (parseFloat(document.getElementById("boom1").value) * ftToM).toFixed(0);
    document.getElementById("tank1").value = (parseFloat(document.getElementById("tank1").value) * galToL).toFixed(0);
    document.getElementById("speedMph").value = (parseFloat(document.getElementById("speedMph").value) * mphToKph).toFixed(0);
    document.getElementById("gpa").value = (parseFloat(document.getElementById("gpa").value) * gpaToLph).toFixed(0);
    document.getElementById("dep1").value = (parseFloat(document.getElementById("dep1").value) * 5).toFixed(0);
  } else {
    document.getElementById("annualAreaLabel").innerText = "Annual Sprayed Acres";
    document.getElementById("revPerAreaLabel").innerText = "Revenue ($/acre)";
    document.getElementById("chemCostLabel").innerText = "Chemical Cost ($/acre/year)";
    document.getElementById("boomLabel").innerText = "Boom (ft)";
    document.getElementById("tankLabel").innerText = "Tank (gal)";
    document.getElementById("speedLabel").innerText = "Speed (mph)";
    document.getElementById("appRateLabel").innerText = "Application Rate (gal/acre)";
    document.getElementById("depLabel").innerText = "Depreciation ($/Eng Hr)";
    // Convert input values to imperial
    // document.getElementById("annualAcres").value = (parseFloat(document.getElementById("annualAcres").value) / acToHa).toFixed(0);
    document.getElementById("revPerAcre").value = (parseFloat(document.getElementById("revPerAcre").value) / 5).toFixed(0);
    document.getElementById("chemCost").value = (parseFloat(document.getElementById("chemCost").value) / 5).toFixed(0);
    document.getElementById("boom1").value = (parseFloat(document.getElementById("boom1").value) / ftToM).toFixed(0);
    document.getElementById("tank1").value = (parseFloat(document.getElementById("tank1").value) / galToL).toFixed(0);
    document.getElementById("speedMph").value = (parseFloat(document.getElementById("speedMph").value) / mphToKph).toFixed(0);
    document.getElementById("gpa").value = (parseFloat(document.getElementById("gpa").value) / gpaToLph).toFixed(0);
    document.getElementById("dep1").value = (parseFloat(document.getElementById("dep1").value) / 5).toFixed(0);
  }
  renderTables();
}

function renderTables() {
  const X = readInputs();
  if (X.isMetric) {
    X.annualAcres = X.annualAcres / acToHa;
    X.boom1 = X.boom1 / ftToM;
    X.tank1 = X.tank1 / galToL;
    X.speedMph = X.speedMph / mphToKph;
    X.gpa = X.gpa / gpaToLph;
  }

  const configs = [
    {
      label: "",
      boom: X.boom1,
      tank: X.tank1,
      dep: X.dep1,
    },
  ];
  const results = configs.map((c) => ({ cfg: c, res: calcForConfig(c, X) }));

  // Chemical Savings
  let chem = `<div style="overflow:auto"><table><thead><tr>
    <th>Mixing Method</th>
    <th>Potential Daily Chemical Savings</th>
    <th>Potential Annual Chemical Savings</th>
    <th>Potential Lifetime Chemical Savings</th>
  </tr></thead><tbody>`;
  results.forEach(({ cfg, res }) => {
    const rows = [
      {
        title: `current mixing method`,
        chemSavingsDay: "–",
        chemSavingsYear: "–",
        chemSavingsLife: "–",
      },
      {
        title: `with Mixmate`,
        chemSavingsDay: res.chemSavingsDay,
        chemSavingsYear: res.chemSavingsYear,
        chemSavingsLife: res.chemSavingsLife,
      },
    ];
    rows.forEach((r) => {
      chem += `<tr>
        <td>${cfg.label} <span class="badge">${r.title}</span></td>
        <td>${typeof r.chemSavingsDay === "string" ? dollars(0, 2) : dollars(r.chemSavingsDay, 2)}</td>
        <td>${typeof r.chemSavingsYear === "string" ? dollars(0, 2) : dollars(r.chemSavingsYear, 2)}</td>
        <td>${typeof r.chemSavingsLife === "string" ? dollars(0, 2) : dollars(r.chemSavingsLife, 2)}</td>
      </tr>`;
    });
    chem += `<tr><td colspan="9" style="border-bottom:2px solid #d1d5db"></td></tr>`;
  });
  chem += "</tbody></table></div>";
  document.getElementById("chemTable").innerHTML = chem;

  // Decreased Mix Time
  if (X.isMetric) {
    let dmt = `<div style="overflow:auto"><table><thead><tr>
    <th>Sprayer</th><th>Mix Time</th><th>Hectars/Day</th>
    <th>Hours Saved/Day</th><th>Cur Saved/Day</th>
    <th>Hours Saved/Year</th><th>Cur Saved/Year</th>
    <th>Hours Saved/Lifetime</th><th>Cur Saved/Lifetime</th>
  </tr></thead><tbody>`;
    results.forEach(({ cfg, res }) => {
      const rows = [
        {
          title: `with Mixmate`,
          time: `${X.mixmateMin} min`,
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
        <td>${fmt(r.acDay * acToHa, 0)}</td>
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
  } else {
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
          time: `${X.mixmateMin} min`,
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
  }

  // Lifetime
  if (X.isMetric) {
    let life = `<div style="overflow:auto"><table><thead><tr>
    <th>Sprayer</th><th>Mix Time</th>
    <th>Potential Daily Hectares</th><th>Potential Daily Revenue Gain</th>
    <th>Potential Annual Hectares</th><th>Potential Annual Revenue Gain</th>
    <th>Potential Lifetime Hectares</th><th>Potential Lifetime Revenue Gain</th>
  </tr></thead><tbody>`;
    results.forEach(({ cfg, res }) => {
      const rows = [
        {
          title: `current mix time`,
          label: `${X.currentMin} min`,
          lifeAcres: res.lifeBase,
          lifeRevGain: "–",
          annualAcres: res.annualAcres,
          annualRevGain: "–",
          dayAcres: res.base.acDay,
          dayRevGain: "–",
        },
        {
          title: `with Mixmate`,
          label: `${X.mixmateMin} min`,
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
        <td>${fmt(r.dayAcres * acToHa, 0)}</td>
        <td>${typeof r.dayRevGain === "string" ? dollars(0, 2) : dollars(r.dayRevGain, 2)}</td>
        <td>${fmt(r.annualAcres * acToHa, 0)}</td>
        <td>${typeof r.annualRevGain === "string" ? dollars(0, 2) : dollars(r.annualRevGain, 2)}</td>
        <td>${fmt(r.lifeAcres * acToHa, 0)}</td>
        <td>${typeof r.lifeRevGain === "string" ? dollars(0, 2) : dollars(r.lifeRevGain, 2)}</td>
      </tr>`;
      });
      life += `<tr><td colspan="9" style="border-bottom:2px solid #d1d5db"></td></tr>`;
    });
    life += "</tbody></table></div>";
    document.getElementById("lifeTable").innerHTML = life;
  } else {
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
          label: `${X.currentMin} min`,
          lifeAcres: res.lifeBase,
          lifeRevGain: "–",
          annualAcres: res.annualAcres,
          annualRevGain: "–",
          dayAcres: res.base.acDay,
          dayRevGain: "–",
        },
        {
          title: `with Mixmate`,
          label: `${X.mixmateMin} min`,
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
}

function readInputs() {
  const gi = (id) => parseFloat(document.getElementById(id).value);
  return {
    isMetric: document.getElementById("toggleMetric").checked,
    yearsLife: gi("yearsLife"),
    annualAcres: gi("annualAcres"),
    speedMph: gi("speedMph"),
    gpa: gi("gpa"),
    sprayHours: gi("sprayHours"),
    currentMin: gi("currentMin"),
    mixmateMin: gi("mixmateMin"),
    ferryTime: gi("ferryTime"),
    revPerAcre: gi("revPerAcre"),
    chemCost: gi("chemCost"),
    measError: gi("measError"),
    boom1: gi("boom1"),
    tank1: gi("tank1"),
    dep1: gi("dep1"),
  };
}

function attach() {
  const ids = [
    "toggleMetric",
    "yearsLife",
    "annualAcres",
    "speedMph",
    "gpa",
    "sprayHours",
    "currentMin",
    "mixmateMin",
    "ferryTime",
    "revPerAcre",
    "chemCost",
    "measError",
    "boom1",
    "tank1",
    "dep1",
  ];
  ids.forEach((id) =>
    document.getElementById(id).addEventListener("input", renderTables)
  );
  document.getElementById("reset").addEventListener("click", () => {
    if (document.getElementById("toggleMetric").checked) {
      document
        .querySelectorAll("#inputs input")
        .forEach((inp) => (inp.value = inp.defaultValue));
        convertUnits();
    } else {
      document
        .querySelectorAll("#inputs input")
        .forEach((inp) => (inp.value = inp.defaultValue));
      renderTables();
    }

  });
  document.getElementById("toggleMetric").addEventListener("change", convertUnits);
  renderTables();
}

attach();
