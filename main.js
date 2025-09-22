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
    loadA: gi("loadA"),
    loadB: gi("loadB"),
    speed: gi("speedMph"),
    fe: gi("fieldEff") / 100,
    boom1: gi("boom1"),
    tank1: gi("tank1"),
    price1: gi("price1"),
    dep1: gi("dep1"),
    boom2: gi("boom2"),
    tank2: gi("tank2"),
    price2: gi("price2"),
    dep2: gi("dep2"),
    boom3: gi("boom3"),
    tank3: gi("tank3"),
    price3: gi("price3"),
    dep3: gi("dep3"),
    gpa: gi("gpa"),
    annualAcres: gi("annualAcres"),
    yearsLife: gi("yearsLife"),
    mixmatePrice: gi("mixmatePrice"),
  };
}

function efc(boom, mph, fe) {
  return (boom * mph * fe) / 8.25;
} // ac/hr
function acresPerLoad(tank, gpa) {
  return tank / gpa;
}
function cycleHours(acresPerLoad, efc, loadMin) {
  return acresPerLoad / efc + loadMin / 60;
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
    loadA,
    loadB,
    speed,
    fe,
    gpa,
    annualAcres,
    yearsLife,
    mixmatePrice,
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

  const base = block(loadBase);
  const A = block(loadA);
  const B = block(loadB);

  const extraA = A.acDay - base.acDay;
  const extraB = B.acDay - base.acDay;

  // Lifetime extra acres for improved scenarios
  const lifeExtraA = lifetimeExtra(lifeBase, extraA, base.acDay) + lifeBase;
  const lifeExtraB = lifetimeExtra(lifeBase, extraB, base.acDay) + lifeBase;

  // Machine Extended Acres
  const machineExtA = lifetimeExtra(lifeBase, extraA, base.acDay);
  const machineExtB = lifetimeExtra(lifeBase, extraB, base.acDay);

  // Lifetime‑adjusted sprayer cost $/acre per scenario
  const capPerAcre_base = (price + (lifeBase / base.effHr) * dep) / lifeBase;
  const capPerAcre_A = (price + (lifeBase / base.effHr) * dep) / lifeExtraA;
  const capPerAcre_B = (price + (lifeBase / base.effHr) * dep) / lifeExtraB;

  // Value/day uses sprayer cost $/acre
  const valDay_A = extraA * capPerAcre_A;
  const valDay_B = extraB * capPerAcre_B;

  // Days to ROI and Operational BE acres
  const opBeAcresA = lifeBase - machineExtA;
  const opBeAcresB = lifeBase - machineExtB;

  // Total break‑even acres (scenario‑specific now)
  const daysA = valDay_A > 0 ? mixmatePrice / (valDay_A + base.acDay) : NaN;
  const daysB = valDay_B > 0 ? mixmatePrice / (valDay_B + base.acDay) : NaN;
  const beAcresTotal_A = isFinite(daysA) ? daysA * A.acDay : NaN;
  const beAcresTotal_B = isFinite(daysB) ? daysB * B.acDay : NaN;

  return {
    efc: efcVal,
    apl,
    base,
    A,
    B,
    extraA,
    extraB,
    lifeBase,
    lifeExtraA,
    lifeExtraB,
    machineExtA,
    machineExtB,
    capPerAcre_base,
    capPerAcre_A,
    capPerAcre_B,
    valDay_A,
    valDay_B,
    daysA,
    daysB,
    opBeAcresA,
    opBeAcresB,
    beAcresTotal_A,
    beAcresTotal_B,
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
    {
      label: "Sprayer 3",
      boom: X.boom3,
      tank: X.tank3,
      price: X.price3,
      dep: X.dep3,
    },
  ];
  const results = configs.map((c) => ({ cfg: c, res: calcForConfig(c, X) }));

  // Side‑by‑Side table
  let sbs = `<div style="overflow:auto"><table><thead><tr>
    <th>Sprayer</th><th>Mix Time</th><th>Acres/Day</th><th>Extra vs current</th>
    <th>Lifetime Acres</th>
    <th>Sprayer Cost $/acre</th>
    <th>Value/Day ($)</th>
  </tr></thead><tbody>`;
  results.forEach(({ cfg, res }) => {
    const rows = [
      {
        label: "20 min",
        acDay: res.base.acDay,
        extra: "–",
        lifeExtra: "–",
        capBase: res.capPerAcre_base,
        capScen: res.capPerAcre_base,
        val: "–",
      },
      {
        label: `${X.loadA} min`,
        acDay: res.A.acDay,
        extra: res.extraA,
        lifeExtra: res.lifeExtraA,
        capBase: res.capPerAcre_base,
        capScen: res.capPerAcre_A,
        val: res.valDay_A,
      },
      {
        label: `${X.loadB} min`,
        acDay: res.B.acDay,
        extra: res.extraB,
        lifeExtra: res.lifeExtraB,
        capBase: res.capPerAcre_base,
        capScen: res.capPerAcre_B,
        val: res.valDay_B,
      },
    ];
    rows.forEach((r) => {
      sbs += `<tr>
        <td>${cfg.label} <span class="badge">boom ${cfg.boom}′ / tank ${
        cfg.tank
      } / price ${dollars(cfg.price)}</span></td>
        <td>${r.label}</td>
        <td>${fmt(r.acDay, 0)}</td>
        <td>${typeof r.extra === "string" ? "–" : fmt(r.extra, 0)}</td>
        <td>${
          typeof r.lifeExtra === "string"
            ? fmt(res.lifeBase, 0)
            : fmt(r.lifeExtra, 0)
        }</td>
        <td>${dollars(r.capScen, 2)}</td>
        <td>${typeof r.val === "string" ? "–" : dollars(r.val, 0)}</td>
      </tr>`;
    });
    sbs += `<tr><td colspan="9" style="border-bottom:2px solid #d1d5db"></td></tr>`;
  });
  sbs += "</tbody></table></div>";
  document.getElementById("sbsTable").innerHTML = sbs;

  // ROI table
  let roi = `<div style="overflow:auto"><table><thead><tr>
    <th>Sprayer</th><th>Mix Time</th><th>Acres/Day</th><th>Sprayer Break Even Acres</th><th>Extra vs current</th>
    <th>Sprayer Cost $/acre</th><th>Value/Day</th>
    <th>Days to Mixmate ROI</th><th>Mixmate Break Even Acres</th>
  </tr></thead><tbody>`;
  results.forEach(({ cfg, res }) => {
    const rows = [
      {
        label: "20 min",
        acDay: res.base.acDay,
        extra: "–",
        cap: res.capPerAcre_base,
        val: "–",
        days: "–",
        opBe: "–",
        tot: "–",
      },
      {
        label: `${X.loadA} min`,
        acDay: res.A.acDay,
        extra: res.extraA,
        cap: res.capPerAcre_A,
        val: res.valDay_A,
        days: res.daysA,
        opBe: res.opBeAcresA,
        tot: res.beAcresTotal_A,
      },
      {
        label: `${X.loadB} min`,
        acDay: res.B.acDay,
        extra: res.extraB,
        cap: res.capPerAcre_B,
        val: res.valDay_B,
        days: res.daysB,
        opBe: res.opBeAcresB,
        tot: res.beAcresTotal_B,
      },
    ];
    rows.forEach((r) => {
      roi += `<tr>
        <td>${cfg.label} <span class="badge">boom ${cfg.boom}′ / tank ${
        cfg.tank
      } / price ${dollars(cfg.price)}</span></td>
        <td>${r.label}</td>
        <td>${fmt(r.acDay, 0)}</td>
        <td>${
          typeof r.opBe === "string" ? fmt(res.lifeBase, 0) : fmt(r.opBe, 0)
        }</td>
        <td>${typeof r.extra === "string" ? "–" : fmt(r.extra, 0)}</td>
        <td>${dollars(r.cap, 2)}</td>
        <td>${typeof r.val === "string" ? "–" : dollars(r.val, 0)}</td>
        <td>${typeof r.days === "string" ? "–" : fmt(r.days, 0)}</td>
        <td>${typeof r.tot === "string" ? "–" : fmt(r.tot, 0)}</td>
      </tr>`;
    });
    roi += `<tr><td colspan="9" style="border-bottom:2px solid #d1d5db"></td></tr>`;
  });
  roi += "</tbody></table></div>";
  document.getElementById("roiTable").innerHTML = roi;

  // Lifetime extras table
  let life = `<div style="overflow:auto"><table><thead><tr>
    <th>Sprayer</th><th>Lifetime Acres</th><th>Extra with ${fmt(
      X.loadA
    )} min Mix</th><th>Extra with ${fmt(X.loadB)} min Mix</th>
    <th>Sprayer Cost $/acre (${fmt(
      X.loadA
    )} min)</th><th>Sprayer Cost $/acre (${fmt(X.loadB)} min)</th>
  </tr></thead><tbody>`;
  results.forEach(({ cfg, res }) => {
    life += `<tr>
      <td>${cfg.label} <span class="badge">boom ${cfg.boom}′ / tank ${
      cfg.tank
    } / price ${dollars(cfg.price)}</span></td>
      <td>${fmt(res.lifeBase, 0)}</td>
      <td>${fmt(res.machineExtA, 0)}</td>
      <td>${fmt(res.machineExtB, 0)}</td>
      <td>${dollars(res.capPerAcre_A, 2)}</td>
      <td>${dollars(res.capPerAcre_B, 2)}</td>
    </tr>`;
    life += `<tr><td colspan="6" style="border-bottom:2px solid #d1d5db"></td></tr>`;
  });
  life += "</tbody></table></div>";
  document.getElementById("lifeTable").innerHTML = life;
}

function attach() {
  const ids = [
    "sprayHours",
    "loadBase",
    "loadA",
    "loadB",
    "speedMph",
    "fieldEff",
    "boom1",
    "tank1",
    "price1",
    "dep1",
    "boom2",
    "tank2",
    "price2",
    "dep2",
    "boom3",
    "tank3",
    "price3",
    "dep3",
    "gpa",
    "annualAcres",
    "yearsLife",
    "mixmatePrice",
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
