// Renders the IKH MORIG carbon credit dashboard from window.IKH_DATA using window.IKH_CALC.
(function () {
  const D = window.IKH_DATA;
  const K = window.IKH_CALC;
  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  const fInt = d3.format(',.0f');
  const fmts = {
    int: (v) => fInt(v),
    dec2: (v) => d3.format('.2f')(v),
    pct: (v) => d3.format('.0%')(v),
    pct1: (v) => d3.format('.1%')(v),
    usdc: (v) => '$' + Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(v),
  };
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  const base = K.baseCase(D.pdd_inputs, D.prices);
  const stats = K.benchStats(D.benchmarks);
  const calcs = { base, bench_stats: stats };
  const defaults = K.scenarioDefaults(D.pdd_inputs, D.prices);
  const state = Object.assign({}, defaults);

  const presets = {
    base: {},
    conservative: { corg: 70, pf: 0.8, pe: 25, leak: 3, buffer: 5 },
    methane: { pe: 30 },
    allsoil: { soil: base.biochar_total },
    optimistic: { soil: base.biochar_total, corg: 85, pe: 10 },
  };

  /* ---------- number tweening ---------- */
  function tween(el, to, fmt, dur = 900, from) {
    const start = from != null ? from : (el._v != null ? el._v : to);
    el._v = to;
    cancelAnimationFrame(el._raf);
    if (reduced() || start === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(start + (to - start) * e);
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }
  const valueOf = (path) => { const [src, f] = path.split('.'); return calcs[src] && calcs[src][f]; };

  document.querySelectorAll('[data-bind]').forEach((el) => {
    const v = valueOf(el.dataset.bind);
    if (v != null) el.textContent = fmts[el.dataset.fmt](Number(v));
  });
  const counters = document.querySelectorAll('[data-count]');
  counters.forEach((el) => {
    const v = valueOf(el.dataset.count);
    if (v != null) { el.textContent = fmts[el.dataset.fmt](Number(v)); el._v = Number(v); }
  });

  /* ---------- theme ---------- */
  const themeBtn = document.querySelector('.theme-toggle');
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let themePref = null;
  try { themePref = localStorage.getItem('ikh-theme'); } catch (e) { /* storage blocked */ }
  const effectiveTheme = () => themePref || (darkQuery.matches ? 'dark' : 'light');
  function applyTheme() {
    if (themePref) root.dataset.theme = themePref; else delete root.dataset.theme;
    const dark = effectiveTheme() === 'dark';
    root.classList.toggle('is-dark', dark);
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  applyTheme();
  themeBtn.addEventListener('click', () => {
    themePref = effectiveTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ikh-theme', themePref); } catch (e) { /* storage blocked */ }
    applyTheme();
    redrawAll(false);
  });
  darkQuery.addEventListener('change', () => { applyTheme(); redrawAll(false); });

  /* ---------- tooltip ---------- */
  const tip = document.querySelector('.tip');
  function showTip(event, lines) {
    tip.replaceChildren(...lines.map(([cls, txt]) => { const d = document.createElement('div'); d.className = cls; d.textContent = txt; return d; }));
    tip.hidden = false;
    const w = tip.offsetWidth / 2 + 8;
    tip.style.left = Math.min(window.innerWidth - w, Math.max(w, event.clientX)) + 'px';
    tip.style.top = Math.max(tip.offsetHeight + 20, event.clientY) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };
  window.addEventListener('scroll', hideTip, { passive: true });

  const measure = (svg, texts, cls) => {
    const t = svg.append('text').attr('class', cls || null).attr('visibility', 'hidden');
    const w = d3.max(texts, (s) => { t.text(s); return t.node().getComputedTextLength(); }) || 0;
    t.remove();
    return w;
  };
  const dur = (ms) => (reduced() ? 0 : ms);

  const charts = {};
  document.querySelectorAll('[data-chart]').forEach((el) => { charts[el.dataset.chart] = el; });

  /* ---------- gauge ---------- */
  function drawGauge(el, s, animate) {
    const R = 100, A0 = -0.75 * Math.PI, A1 = 0.75 * Math.PI;
    if (!el._g) {
      const svg = d3.select(el).insert('svg', ':first-child').attr('viewBox', '-110 -110 220 220');
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', 'gauge-grad').attr('x1', 0).attr('x2', 1).attr('y1', 1).attr('y2', 0);
      grad.append('stop').attr('class', 'g0').attr('offset', 0);
      grad.append('stop').attr('class', 'g1').attr('offset', 1);
      const arc = d3.arc().innerRadius(R - 16).outerRadius(R).cornerRadius(8);
      const track = svg.append('path').attr('class', 'track');
      const ded = svg.append('path').attr('class', 'ded');
      const net = svg.append('path').attr('class', 'net');
      const ticks = svg.append('g').attr('class', 'ticks');
      el._g = { svg, arc, track, ded, net, ticks, grad, a: A0 };
    }
    const g = el._g;
    g.grad.select('.g0').attr('stop-color', css('--carbon'));
    g.grad.select('.g1').attr('stop-color', css('--hero-accent'));
    g.track.attr('d', g.arc({ startAngle: A0, endAngle: A1 })).attr('fill', css('--grid'));
    g.ded.attr('d', g.arc({ startAngle: A0, endAngle: A1 })).attr('fill', css('--ember-soft'));
    g.ticks.selectAll('line').data(d3.range(0, 1.0001, 0.25)).join('line')
      .attr('x1', (d) => Math.sin(A0 + d * (A1 - A0)) * (R + 5)).attr('y1', (d) => -Math.cos(A0 + d * (A1 - A0)) * (R + 5))
      .attr('x2', (d) => Math.sin(A0 + d * (A1 - A0)) * (R + 10)).attr('y2', (d) => -Math.cos(A0 + d * (A1 - A0)) * (R + 10))
      .attr('stroke', css('--bar-muted')).attr('stroke-width', 1.5).attr('stroke-linecap', 'round');
    const share = s.gross > 0 ? s.net / s.gross : 0;
    const target = A0 + share * (A1 - A0);
    const from = animate ? A0 : g.a;
    g.a = target;
    g.net.attr('fill', 'url(#gauge-grad)')
      .transition().duration(dur(animate ? 1400 : 450)).ease(d3.easeCubicOut)
      .attrTween('d', () => { const i = d3.interpolate(from, target); return (t) => g.arc({ startAngle: A0, endAngle: Math.max(A0 + 0.001, i(t)) }); });
  }

  /* ---------- waterfall ---------- */
  function drawWaterfall(el, s, animate) {
    const W = el.clientWidth || 400, H = 250, m = { t: 26, r: 6, b: 44, l: 6 };
    if (!el._wf || el._wf.W !== W) {
      el.replaceChildren();
      const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
      el._wf = { W, svg, axis: svg.append('line'), bars: svg.append('g'), conn: svg.append('g'), vals: svg.append('g'), labs: svg.append('g') };
      animate = true;
    }
    const w = el._wf;
    const steps = [
      { k: 'Gross removal', s: 'Gross', v: s.gross, y0: 0, y1: s.gross, type: 'carbon' },
      { k: 'Project emissions', s: 'Emissions', v: -s.pe_t, y0: s.gross - s.pe_t, y1: s.gross, type: 'ember' },
      { k: 'Leakage', s: 'Leakage', v: -s.leak_t, y0: s.gross - s.pe_t - s.leak_t, y1: s.gross - s.pe_t, type: 'ember' },
      { k: 'Buffer', s: 'Buffer', v: -s.buffer_t, y0: s.net, y1: s.gross - s.pe_t - s.leak_t, type: 'ember' },
      { k: 'Net credits', s: 'Net', v: s.net, y0: 0, y1: s.net, type: 'carbon' },
    ];
    const x = d3.scaleBand(steps.map((d) => d.k), [m.l, W - m.r]).padding(0.32);
    const y = d3.scaleLinear([0, Math.max(base.gross, s.gross) * 1.12], [H - m.b, m.t]);
    const T = d3.transition().duration(dur(animate ? 900 : 380)).ease(d3.easeCubicOut);
    w.axis.attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', css('--bar-muted'));
    const color = (d) => css(d.type === 'carbon' ? '--carbon' : '--ember');
    w.bars.selectAll('rect').data(steps, (d) => d.k).join(
      (enter) => enter.append('rect').attr('class', 'hit').attr('x', (d) => x(d.k)).attr('width', x.bandwidth()).attr('y', y(0)).attr('height', 0).attr('rx', 5),
    )
      .attr('fill', color)
      .on('pointermove', (e, d) => showTip(e, [['t', d.k], ['n', (d.v < 0 ? '−' : '') + fInt(Math.abs(d.v)) + ' tCO₂e / yr']]))
      .on('pointerleave', hideTip)
      .transition(T).delay((d, i) => (animate ? i * 120 : 0))
      .attr('x', (d) => x(d.k)).attr('width', x.bandwidth())
      .attr('y', (d) => y(d.y1)).attr('height', (d) => Math.max(d.y1 > d.y0 ? 2 : 0, y(d.y0) - y(d.y1)));
    // dashed connectors between bar tops
    const links = steps.slice(0, -1).map((d, i) => ({ k: d.k, x1: x(d.k) + x.bandwidth(), x2: x(steps[i + 1].k), y: y(d.type === 'carbon' ? d.y1 : d.y0) }));
    w.conn.selectAll('line').data(links, (d) => d.k).join('line')
      .attr('stroke', css('--bar-muted')).attr('stroke-dasharray', '3 3')
      .transition(T).attr('x1', (d) => d.x1).attr('x2', (d) => d.x2).attr('y1', (d) => d.y).attr('y2', (d) => d.y);
    w.vals.selectAll('text').data(steps, (d) => d.k).join((enter) => enter.append('text').attr('class', 'val').attr('text-anchor', 'middle').attr('y', y(0) - 6))
      .text((d) => (d.v < 0 ? '−' : '') + fInt(Math.abs(d.v)))
      .transition(T).delay((d, i) => (animate ? i * 120 : 0))
      .attr('x', (d) => x(d.k) + x.bandwidth() / 2).attr('y', (d) => y(d.y1) - 8);
    w.labs.selectAll('text').data(steps, (d) => d.k).join('text').attr('text-anchor', 'middle')
      .attr('x', (d) => x(d.k) + x.bandwidth() / 2).attr('y', H - m.b + 20)
      .text((d) => (W < 520 ? d.s : d.k));
  }

  /* ---------- projection ---------- */
  function drawProjection(el, rows, animate) {
    const W = el.clientWidth || 600, H = 240, m = { t: 26, r: 6, b: 32, l: 8 };
    if (!el._pj || el._pj.W !== W) {
      el.replaceChildren();
      const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', 'proj-grad').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
      grad.append('stop').attr('class', 'p0').attr('offset', 0);
      grad.append('stop').attr('class', 'p1').attr('offset', 1);
      el._pj = { W, svg, grad, grid: svg.append('g'), ticks: svg.append('g'), area: svg.append('path'), line: svg.append('path'), bars: svg.append('g'), labs: svg.append('g'), vals: svg.append('g') };
      animate = true;
    }
    const p = el._pj;
    const yMax = Math.max(base.net * 1.6, d3.max(rows, (d) => d.v)) * 1.08;
    const y = d3.scaleLinear([0, yMax], [H - m.b, m.t]);
    const ticks = y.ticks(4);
    m.l = measure(p.svg, ticks.map(fInt)) + 12;
    const x = d3.scaleBand(rows.map((d) => d.year), [m.l, W - m.r]).padding(0.34);
    const bw = Math.min(40, x.bandwidth());
    const T = d3.transition().duration(dur(animate ? 900 : 380)).ease(d3.easeCubicOut);
    p.grad.select('.p0').attr('stop-color', css('--carbon')).attr('stop-opacity', 0.22);
    p.grad.select('.p1').attr('stop-color', css('--carbon')).attr('stop-opacity', 0);
    p.grid.selectAll('line').data(ticks).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y).attr('stroke', css('--grid'));
    p.ticks.selectAll('text').data(ticks).join('text').attr('x', m.l - 8).attr('y', (d) => y(d) + 4).attr('text-anchor', 'end').text(fInt);
    // soft area showing the cumulative shape of the ramp
    const cx = (d) => x(d.year) + x.bandwidth() / 2;
    const area = d3.area().x(cx).y0(y(0)).y1((d) => y(d.v)).curve(d3.curveMonotoneX);
    p.area.attr('fill', 'url(#proj-grad)').transition(T).attr('d', area(rows));
    p.line.attr('fill', 'none');
    p.bars.selectAll('rect').data(rows, (d) => d.year).join(
      (enter) => enter.append('rect').attr('class', 'hit').attr('rx', 5).attr('y', y(0)).attr('height', 0),
    )
      .attr('x', (d) => cx(d) - bw / 2).attr('width', bw)
      .attr('fill', (d) => (d.u < 1 ? css('--soil') : css('--carbon')))
      .on('pointermove', (e, d) => showTip(e, [['t', `Year ${d.year} · ${d3.format('.0%')(d.u)} of capacity`], ['n', fInt(d.v) + ' credits'], ['t', 'Cumulative ' + fInt(d.cum)]].concat(d.note ? [['t', d.note]] : [])))
      .on('pointerleave', hideTip)
      .transition(T).delay((d, i) => (animate ? i * 70 : 0))
      .attr('y', (d) => y(d.v)).attr('height', (d) => y(0) - y(d.v));
    p.labs.selectAll('text').data(rows, (d) => d.year).join('text').attr('text-anchor', 'middle').attr('x', cx).attr('y', H - m.b + 20).text((d) => 'Y' + d.year);
    const ends = [rows[0], rows[rows.length - 1]];
    p.vals.selectAll('text').data(ends, (d) => d.year).join((enter) => enter.append('text').attr('class', 'val').attr('text-anchor', 'middle').attr('y', y(0)))
      .text((d) => fInt(d.v))
      .transition(T).delay(animate ? 500 : 0).attr('x', cx).attr('y', (d) => y(d.v) - 8);
  }

  /* ---------- tornado ---------- */
  function drawTornado(el, rows, animate) {
    el.replaceChildren();
    const b = rows[0].base;
    const W = el.clientWidth || 400, rowH = 52, m = { t: 14, r: 8, b: 28, l: 0 };
    const H = m.t + m.b + rows.length * rowH;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
    m.l = Math.min(W * 0.42, Math.max(measure(svg, rows.map((r) => r.factor), 'lab'), measure(svg, rows.map((r) => r.range))) + 14);
    const lo = d3.min(rows, (r) => Math.min(r.low, r.high)), hi = d3.max(rows, (r) => Math.max(r.low, r.high));
    const x = d3.scaleLinear([lo * 0.95, hi * 1.02], [m.l, W - m.r]).nice();
    const ticks = x.ticks(W < 480 ? 3 : 5);
    svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', x).attr('x2', x).attr('y1', m.t).attr('y2', H - m.b).attr('stroke', css('--grid'));
    svg.append('g').selectAll('text').data(ticks).join('text').attr('x', x).attr('y', H - m.b + 18).attr('text-anchor', 'middle').text(fInt);
    rows.forEach((r, i) => {
      const yc = m.t + i * rowH + rowH / 2;
      svg.append('text').attr('class', 'lab').attr('x', 0).attr('y', yc - 3).text(r.factor);
      svg.append('text').attr('x', 0).attr('y', yc + 13).text(r.range);
      [['low', '--ember'], ['high', '--carbon']].forEach(([k, c]) => {
        const v = r[k];
        const rect = svg.append('rect').attr('class', 'hit').attr('y', yc - 11).attr('height', 22).attr('rx', 5).attr('fill', css(c))
          .attr('x', x(b)).attr('width', 0)
          .on('pointermove', (e) => showTip(e, [['t', `${r.factor}, ${k === 'low' ? 'lower' : 'upper'} end`], ['n', fInt(v) + ' credits / yr'], ['t', (v >= b ? '+' : '−') + fInt(Math.abs(v - b)) + ' vs base']]))
          .on('pointerleave', hideTip);
        rect.transition().duration(dur(animate ? 900 : 0)).delay(animate ? 200 + i * 120 : 0).ease(d3.easeCubicOut)
          .attr('x', Math.min(x(v), x(b))).attr('width', Math.max(1, Math.abs(x(v) - x(b))));
      });
    });
    svg.append('line').attr('x1', x(b)).attr('x2', x(b)).attr('y1', m.t - 6).attr('y2', H - m.b).attr('stroke', css('--ref')).attr('stroke-dasharray', '4 3').attr('stroke-width', 1.5);
  }

  /* ---------- donut ---------- */
  const catColors = () => ['--cat-1', '--cat-2', '--cat-3', '--cat-4'].map(css);
  const feedRows = D.feedstock.map((r) => ({ name: r.feedstock, t: Number(r.tonnes), share: Number(r.share) })).sort((a, b) => b.t - a.t);
  const legend = document.querySelector('[data-legend="feedstock"]');
  function buildLegend() {
    legend.replaceChildren();
    feedRows.forEach((r, i) => {
      const li = document.createElement('li');
      li.dataset.i = i;
      const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = catColors()[i];
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = r.name;
      const vl = document.createElement('span'); vl.className = 'vl'; vl.textContent = `${fInt(r.t)} t · ${d3.format('.0%')(r.share)}`;
      li.append(sw, nm, vl);
      li.addEventListener('pointerenter', () => highlightSlice(i));
      li.addEventListener('pointerleave', () => highlightSlice(null));
      legend.appendChild(li);
    });
  }
  function highlightSlice(i) {
    const el = charts.donut;
    if (!el) return;
    el.classList.toggle('dim', i != null);
    d3.select(el).selectAll('path.hit').classed('hover', (d, j) => j === i)
      .transition().duration(dur(200)).attr('transform', (d, j) => {
        if (j !== i) return 'translate(0,0)';
        const a = (d.startAngle + d.endAngle) / 2;
        return `translate(${Math.sin(a) * 6},${-Math.cos(a) * 6})`;
      });
    legend.querySelectorAll('li').forEach((li) => li.classList.toggle('hover', Number(li.dataset.i) === i));
  }
  function drawDonut(el, animate) {
    el.querySelectorAll('svg').forEach((n) => n.remove());
    const svg = d3.select(el).insert('svg', ':first-child').attr('viewBox', '-110 -110 220 220').attr('width', '100%').attr('height', '100%');
    const pie = d3.pie().value((d) => d.t).sort(null).padAngle(0.025);
    const arc = d3.arc().innerRadius(66).outerRadius(100).cornerRadius(6);
    const cols = catColors();
    svg.selectAll('path').data(pie(feedRows)).join('path').attr('class', 'hit').attr('fill', (d, i) => cols[i])
      .on('pointermove', (e, d) => { highlightSlice(d.index); showTip(e, [['t', d.data.name], ['n', fInt(d.data.t) + ' t dry / yr'], ['t', d3.format('.0%')(d.data.share) + ' of feedstock']]); })
      .on('pointerleave', () => { highlightSlice(null); hideTip(); })
      .transition().duration(dur(animate ? 1100 : 0)).delay((d, i) => (animate ? i * 140 : 0)).ease(d3.easeCubicOut)
      .attrTween('d', (d) => { const i = d3.interpolate(d.startAngle, d.endAngle); return (t) => arc({ ...d, endAngle: i(t) }); });
  }

  /* ---------- benchmark bars ---------- */
  function drawBench(el, rows, med, animate) {
    el.replaceChildren();
    const W = el.clientWidth || 400, rowH = 32, m = { t: 22, r: 8, b: 26, l: 0 };
    const H = m.t + m.b + rows.length * rowH;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
    m.l = Math.min(W * 0.5, measure(svg, rows.map((r) => r.producer), 'lab') + 14);
    const vw = measure(svg, ['0.00'], 'val') + 10;
    const x = d3.scaleLinear([0, Math.max(3, d3.max(rows, (r) => r.factor))], [m.l, W - m.r - vw]);
    const ticks = x.ticks(W < 480 ? 3 : 6);
    svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', x).attr('x2', x).attr('y1', m.t).attr('y2', H - m.b).attr('stroke', css('--grid'));
    svg.append('g').selectAll('text').data(ticks).join('text').attr('x', x).attr('y', H - m.b + 18).attr('text-anchor', 'middle').text(d3.format('.1f'));
    rows.forEach((r, i) => {
      const yc = m.t + i * rowH + rowH / 2;
      svg.append('text').attr('class', r.project ? 'lab hl' : 'lab').attr('x', 0).attr('y', yc + 4).text(r.producer);
      const bar = svg.append('rect').attr('class', 'hit').attr('x', m.l).attr('y', yc - 9).attr('height', 18).attr('rx', 5).attr('width', 0)
        .attr('fill', r.project ? css('--carbon') : css('--bar-muted'))
        .on('pointermove', (e) => showTip(e, [['t', `${r.producer} · ${r.country}`], ['n', d3.format('.2f')(r.factor) + ' tCO₂e per t biochar'], ['t', (r.factor >= med ? '+' : '−') + d3.format('.2f')(Math.abs(r.factor - med)) + ' vs median']]))
        .on('pointerleave', hideTip);
      const label = svg.append('text').attr('class', r.project ? 'val hl' : 'val').attr('x', m.l + 6).attr('y', yc + 4).attr('opacity', animate ? 0 : 1).text(d3.format('.2f')(r.factor));
      const d0 = animate ? 150 + i * 80 : 0;
      bar.transition().duration(dur(animate ? 900 : 0)).delay(d0).ease(d3.easeCubicOut).attr('width', Math.max(2, x(r.factor) - m.l));
      label.transition().duration(dur(animate ? 900 : 0)).delay(d0).ease(d3.easeCubicOut).attr('x', x(r.factor) + 6).attr('opacity', 1);
    });
    svg.append('line').attr('x1', x(med)).attr('x2', x(med)).attr('y1', m.t - 6).attr('y2', H - m.b).attr('stroke', css('--ref')).attr('stroke-dasharray', '4 3').attr('stroke-width', 1.5);
    svg.append('text').attr('x', x(med)).attr('y', m.t - 10).attr('text-anchor', 'middle').text('median ' + d3.format('.2f')(med));
  }

  /* ---------- tables and price bars ---------- */
  const fillBody = (el, rows, cols) => {
    el.replaceChildren();
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      cols.forEach(([k, f, right]) => {
        const td = document.createElement('td');
        if (right) td.className = 'r';
        td.textContent = r[k] == null || r[k] === '' ? '—' : f ? f(r[k]) : String(r[k]);
        tr.appendChild(td);
      });
      el.appendChild(tr);
    });
  };
  fillBody(document.getElementById('deals-body'), K.dealsPerYear(D.deals), [['deal'], ['supplier_country'], ['volume_t', fInt, 1], ['per_year', fInt, 1], ['announced']]);

  const priceWrap = document.getElementById('price-bars');
  const P_MAX = 250;
  function buildPrices() {
    priceWrap.replaceChildren();
    D.prices.forEach((r) => {
      const lo = Number(r.low), hi = r.high == null ? null : Number(r.high);
      const row = document.createElement('div'); row.className = 'pb';
      const nm = document.createElement('span'); nm.className = 'pb-name'; nm.textContent = r.benchmark + ' (' + r.as_of + ')';
      const vl = document.createElement('span'); vl.className = 'pb-val';
      vl.textContent = (r.currency === 'EUR' ? '€' : '$') + d3.format(',.2~f')(lo) + (hi != null ? '–' + d3.format(',.0f')(hi) : '');
      const track = document.createElement('span'); track.className = 'pb-track';
      const fill = document.createElement('span'); fill.className = 'pb-fill' + (r.currency === 'EUR' ? ' eur' : '');
      fill.style.left = '0%'; fill.style.width = '0%';
      fill.dataset.left = hi != null ? (lo / P_MAX) * 100 : 0;
      fill.dataset.width = hi != null ? ((hi - lo) / P_MAX) * 100 : (lo / P_MAX) * 100;
      track.appendChild(fill);
      row.append(nm, vl, track);
      priceWrap.appendChild(row);
    });
    const lg = document.createElement('ul'); lg.className = 'legend';
    [['sw sw-carbon', 'USD'], ['sw sw-soil', 'EUR'], ['', 'Scale $0 – $' + P_MAX]].forEach(([c, t]) => {
      const li = document.createElement('li');
      if (c) { const s = document.createElement('span'); s.className = c; li.appendChild(s); }
      li.appendChild(document.createTextNode(t));
      lg.appendChild(li);
    });
    priceWrap.appendChild(lg);
  }
  buildPrices();
  const growPrices = () => priceWrap.querySelectorAll('.pb-fill').forEach((f, i) => {
    setTimeout(() => { f.style.left = f.dataset.left + '%'; f.style.width = f.dataset.width + '%'; }, reduced() ? 0 : i * 90);
  });

  /* ---------- sliders, presets, scenario ---------- */
  const svLabel = {
    soil: (v) => fInt(v) + ' t/yr',
    corg: (v) => fInt(v) + '%',
    pf: (v) => d3.format('.2f')(v),
    pe: (v) => fInt(v) + '%',
    leak: (v) => fInt(v) + '%',
    buffer: (v) => fInt(v) + '%',
    price: (v) => '$' + fInt(v) + '/t',
  };
  const sliders = document.querySelectorAll('.slider');
  const paintSlider = (el) => {
    const p = ((Number(el.value) - Number(el.min)) / (Number(el.max) - Number(el.min))) * 100;
    el.style.setProperty('--p', p + '%');
  };
  const syncSliders = () => sliders.forEach((el) => { el.value = state[el.dataset.param]; paintSlider(el); });
  syncSliders();

  const chips = document.querySelectorAll('[data-preset]');
  const matchPreset = () => {
    const hit = Object.keys(presets).find((k) => Object.entries(Object.assign({}, defaults, presets[k])).every(([p, v]) => Math.abs(state[p] - v) < 1e-9));
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.preset === hit)));
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    Object.assign(state, defaults, presets[c.dataset.preset]);
    syncSliders();
    renderScenario(false, true);
  }));
  sliders.forEach((el) => el.addEventListener('input', () => {
    state[el.dataset.param] = Number(el.value);
    paintSlider(el);
    renderScenario(false, false);
  }));
  document.querySelector('.reset').addEventListener('click', () => {
    Object.assign(state, defaults);
    syncSliders();
    renderScenario(false, true);
  });

  const scEls = document.querySelectorAll('[data-sc]');
  const svEls = document.querySelectorAll('[data-sv]');
  function renderScenario(animate, smooth) {
    const s = K.scenario(state);
    const proj = K.projection(s.net, D.ramp);
    svEls.forEach((el) => {
      const txt = svLabel[el.dataset.sv](state[el.dataset.sv]);
      if (el.textContent !== txt) {
        el.textContent = txt;
        el.classList.add('bump');
        clearTimeout(el._bt);
        el._bt = setTimeout(() => el.classList.remove('bump'), 140);
      }
    });
    const delta = s.net - base.net;
    const values = {
      net: [s.net, fInt],
      total10: [d3.sum(proj, (d) => d.v), fInt],
      revenue: [s.revenue, fmts.usdc],
      delta: [delta, (v) => (Math.round(v) >= 0 ? '+' : '−') + fInt(Math.abs(v))],
      share: [s.gross > 0 ? s.net / s.gross : 0, (v) => d3.format('.0%')(v) + ' of gross'],
    };
    scEls.forEach((el) => {
      const [v, f] = values[el.dataset.sc];
      tween(el, v, f, smooth ? 700 : 260);
      if (el.dataset.sc === 'delta') { el.classList.toggle('up', delta > 0.5); el.classList.toggle('down', delta < -0.5); }
    });
    matchPreset();
    if (charts.gauge) drawGauge(charts.gauge, s, animate);
    if (charts.waterfall) drawWaterfall(charts.waterfall, s, animate);
    if (charts.projection) drawProjection(charts.projection, proj, animate);
  }

  function drawStatic(name, animate) {
    const el = charts[name];
    if (!el) return;
    if (name === 'tornado') drawTornado(el, K.sensitivity(D.pdd_inputs), animate);
    if (name === 'donut') drawDonut(el, animate);
    if (name === 'bench') drawBench(el, K.benchCompare(D.benchmarks, base), stats.median, animate);
  }

  function redrawAll(animate) {
    if (charts.waterfall) delete charts.waterfall._wf;
    if (charts.projection) delete charts.projection._pj;
    renderScenario(animate, false);
    ['tornado', 'donut', 'bench'].forEach((n) => drawStatic(n, animate));
    buildLegend();
  }

  buildLegend();
  renderScenario(false, false);
  ['tornado', 'donut', 'bench'].forEach((n) => drawStatic(n, false));

  /* ---------- scroll reveal, entrance animations, nav ---------- */
  const io = 'IntersectionObserver' in window;
  const reveals = document.querySelectorAll('.reveal');
  if (io && !reduced()) {
    reveals.forEach((el) => { if (el.getBoundingClientRect().top > window.innerHeight * 0.92) el.classList.add('pre'); else el.classList.add('in'); });
    const ro = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.remove('pre');
      e.target.classList.add('in');
      ro.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => { if (el.classList.contains('pre')) ro.observe(el); });

    // count up numbers the first time they show
    const co = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const v = Number(valueOf(el.dataset.count));
      tween(el, v, fmts[el.dataset.fmt], el.classList.contains('hero-num') ? 1800 : 1200, 0);
      co.unobserve(el);
    }), { threshold: 0.4 });
    counters.forEach((el) => co.observe(el));

    // replay chart entrances when each scrolls into view
    const seen = new Set();
    const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const name = e.target.dataset.chart;
      if (seen.has(name)) return;
      seen.add(name);
      cio.unobserve(e.target);
      if (name === 'gauge' || name === 'waterfall' || name === 'projection') {
        if (name === 'waterfall') delete charts.waterfall._wf;
        if (name === 'projection') delete charts.projection._pj;
        const s = K.scenario(state);
        if (name === 'gauge') drawGauge(charts.gauge, s, true);
        if (name === 'waterfall') drawWaterfall(charts.waterfall, s, true);
        if (name === 'projection') drawProjection(charts.projection, K.projection(s.net, D.ramp), true);
      } else drawStatic(name, true);
    }), { threshold: 0.25 });
    Object.values(charts).forEach((el) => cio.observe(el));

    const pio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { growPrices(); pio.disconnect(); }
    }), { threshold: 0.2 });
    pio.observe(priceWrap);
  } else {
    growPrices();
  }

  const navLinks = document.querySelectorAll('[data-nav]');
  if (io) {
    const nio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.dataset.nav === e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('#overview, .section').forEach((s) => nio.observe(s));
  }

  /* ---------- resize ---------- */
  let lastW = document.querySelector('.wrap').clientWidth;
  let raf = 0;
  new ResizeObserver(() => {
    const w = document.querySelector('.wrap').clientWidth;
    if (w === lastW) return;
    lastW = w;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => redrawAll(false));
  }).observe(document.querySelector('.wrap'));
  if (document.fonts) document.fonts.ready.then(() => redrawAll(false));

  /* ---------- hero embers ---------- */
  const canvas = document.querySelector('.hero-canvas');
  const hero = document.querySelector('.hero');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, parts = [], running = true, last = 0;
    const spawn = (anywhere) => ({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: 0.6 + Math.random() * 2.2,
      vy: 0.18 + Math.random() * 0.55,
      sway: Math.random() * Math.PI * 2,
      hot: Math.random() < 0.55,
      life: 0.4 + Math.random() * 0.6,
    });
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(140, W / 9));
      parts = Array.from({ length: n }, () => spawn(true));
    }
    function frame(t) {
      const dt = Math.min(3, (t - last) / 16.7 || 1);
      last = t;
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p, i) => {
        p.y -= p.vy * dt;
        p.sway += 0.012 * dt;
        const x = p.x + Math.sin(p.sway) * 14;
        const k = Math.max(0, Math.min(1, p.y / H));
        const a = p.life * (0.15 + 0.85 * k);
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hot ? `rgba(255, ${120 + Math.round(60 * k)}, 60, ${a})` : `rgba(111, 211, 165, ${a * 0.7})`;
        ctx.shadowBlur = p.hot ? 8 : 0;
        ctx.shadowColor = 'rgba(255, 120, 50, .8)';
        ctx.fill();
        if (p.y < -10) parts[i] = spawn(false);
      });
      ctx.shadowBlur = 0;
      if (running && !reduced()) requestAnimationFrame(frame);
    }
    size();
    frame(0);
    window.addEventListener('resize', () => { size(); if (reduced()) frame(0); });
    if (io) new IntersectionObserver((entries) => {
      const vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
      running = vis;
    }).observe(hero);
  }
})();
