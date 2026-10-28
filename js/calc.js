// Carbon credit calculations for the IKH MORIG biochar plant (VM0044 v1.2 approach).
// Net credits = M_soil × Corg × PF × 44/12 × (1 − project emissions) − leakage − buffer
(function () {
  const C_TO_CO2 = 44 / 12;

  const inputsMap = (rows) => Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));

  const priceOf = (prices, key) => Number((prices.find((r) => r.key === key) || {}).low);

  // PDD base case at full operation
  function baseCase(pddInputs, prices) {
    const v = inputsMap(pddInputs);
    const price = priceOf(prices, 'cdrfyi_avg');
    const corg_t = v.biochar_soil * v.corg;
    const durable_c = corg_t * v.pf;
    const gross = durable_c * C_TO_CO2;
    const pe = gross * v.pe_share;
    const net = gross - pe;
    return {
      dry_feedstock: v.dry_feedstock, biochar_total: v.biochar_total, biochar_soil: v.biochar_soil, biochar_fuel: v.biochar_fuel,
      yield: v.biochar_total / v.dry_feedstock, corg: v.corg, pf: v.pf, pe_share: v.pe_share,
      corg_t, durable_c, gross, pe, net, pfs_net: v.pfs_net,
      net_per_t_soil: net / v.biochar_soil, price, value: net * price,
    };
  }

  // Slider starting values, in the units the sliders use
  function scenarioDefaults(pddInputs, prices) {
    const v = inputsMap(pddInputs);
    return { soil: v.biochar_soil, corg: v.corg * 100, pf: v.pf, pe: v.pe_share * 100, leak: 0, buffer: 0, price: priceOf(prices, 'cdrfyi_avg') };
  }

  // s: {soil t, corg %, pf, pe %, leak %, buffer %, price USD}
  function scenario(s) {
    const gross = s.soil * (s.corg / 100) * s.pf * C_TO_CO2;
    const pe_t = gross * s.pe / 100;
    const leak_t = gross * s.leak / 100;
    const buffer_t = (gross - pe_t - leak_t) * s.buffer / 100;
    const net = Math.max(0, gross - pe_t - leak_t - buffer_t);
    return { gross, pe_t, leak_t, buffer_t, net, revenue: net * s.price };
  }

  function projection(net, ramp) {
    let cum = 0;
    return ramp.map((r) => {
      const v = Number(r.utilisation) * net;
      cum += v;
      return { year: Number(r.year), u: Number(r.utilisation), note: r.note || '', v, cum };
    });
  }

  // One-at-a-time sensitivity of net credits per year
  function sensitivity(pddInputs) {
    const v = inputsMap(pddInputs);
    const net = (o) => {
      const p = Object.assign({ s: v.biochar_soil, c: v.corg, f: v.pf, e: v.pe_share }, o);
      return p.s * p.c * p.f * C_TO_CO2 * (1 - p.e);
    };
    const base = net({});
    return [
      { factor: 'Soil-applied biochar', range: '3,600 – 6,000 t', low: net({ s: 3600 }), high: net({ s: v.biochar_total }) },
      { factor: 'Permanence factor', range: '0.74 – 0.89', low: net({ f: 0.74 }), high: net({ f: 0.89 }) },
      { factor: 'Corg', range: '65% – 85%', low: net({ c: 0.65 }), high: net({ c: 0.85 }) },
      { factor: 'Project emissions', range: '30% – 10%', low: net({ e: 0.30 }), high: net({ e: 0.10 }) },
    ].map((r) => Object.assign(r, { base, swing: r.high - r.low })).sort((a, b) => b.swing - a.swing);
  }

  function benchCompare(benchmarks, base) {
    return benchmarks
      .map((r) => ({ producer: r.producer, country: r.country, factor: Number(r.factor), project: false }))
      .concat([{ producer: 'IKH MORIG (PFS base)', country: 'Mongolia', factor: base.net_per_t_soil, project: true }])
      .sort((a, b) => b.factor - a.factor);
  }

  function benchStats(benchmarks) {
    const f = benchmarks.map((r) => Number(r.factor)).sort((a, b) => a - b);
    const median = f.length % 2 ? f[(f.length - 1) / 2] : (f[f.length / 2 - 1] + f[f.length / 2]) / 2;
    return { median, min: f[0], max: f[f.length - 1] };
  }

  const dealsPerYear = (deals) => deals.map((r) => Object.assign({}, r, { per_year: r.years ? Number(r.volume_t) / Number(r.years) : null }));

  window.IKH_CALC = { C_TO_CO2, baseCase, scenarioDefaults, scenario, projection, sensitivity, benchCompare, benchStats, dealsPerYear };
})();
