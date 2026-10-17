const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const N = +(process.env.N || 400);
  const T = (ci, cf, pe, di) => ({ cotaInicio: ci, cotaFin: cf, pendiente: pe, distancia: di, id: Math.random() });
  const tramos = [T("1000", "", "1", String(N * 5))];
  const lect = []; for (let a = 0; a <= N * 5; a += 5) lect.push({ abs: a, sub: 0, estacionId: a === 0 ? 1 : null, der: a < N * 2.5 ? "0.5" : "", eje: a < N * 2.5 ? "0.4" : "", izq: "", fecha: "2026-10-13" });
  const lat = { modo: "transversal", ancho: "3.5", modoT: "pendiente", diferencia: "", pendienteT: "-2", tramos: [T("", "", "", "")], absInicio: "" };
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos, intermedias: [], capas: [{ nombre: "Base", espesor: "0.2", id: 1 }], sobreancho: { izq: "", der: "" }, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    nivelaciones: [{ id: 21, tipo: "tn", nombre: "TN", estaciones: [{ id: 1, nombre: "E1", cotaBM: "1001", vistaMas: "1.5" }], lecturas: lect }], volumenes: [] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'O' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header');
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  let t0 = Date.now(); await p.click('.tv-tabs button[data-tab=nivel]'); await p.waitForSelector('tr[data-i]'); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
  console.log(N + 1, 'lecturas · abrir Nivelaciones:', Date.now() - t0, 'ms · filas en pantalla:', await p.$$eval('tr[data-i]', t => t.length));
  await p.waitForTimeout(1500);
  // escribir "1.234" en la fila 250 (lectura vacía) y medir cuánto tarda cada tecla
  if (process.env.NOSTICKY) await p.addStyleTag({ content: 'td, th { position: static !important; }' });
  if (process.env.SINCOTAS) await p.addStyleTag({ content: 'table:not([id]) { display: none !important; }' });
  const sel = 'tr[data-i="' + Math.round(N * 0.6) + '"] input >> nth=1';
  await p.click(sel);
  if (process.env.TRAZA) await b.startTracing(p, { path: '../traza.json', categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'blink.user_timing'] });
  await cdp.send('Performance.enable'); const met = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value])); const m0 = await met();
  if (process.env.PERFIL) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
  const tiempos = [];
  for (const ch of '1.234') { const t = Date.now(); await p.keyboard.type(ch); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)))); tiempos.push(Date.now() - t); }
  if (process.env.TRAZA) await b.stopTracing();
  const m1 = await met(); console.log('por tecla (ms): script', ((m1.ScriptDuration - m0.ScriptDuration) * 200).toFixed(0), '| estilos', ((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 200).toFixed(0), '| layout', ((m1.LayoutDuration - m0.LayoutDuration) * 200).toFixed(0), '| total tarea', ((m1.TaskDuration - m0.TaskDuration) * 200).toFixed(0), '| nodos', m1.Nodes);
  const { profile } = process.env.PERFIL ? await cdp.send('Profiler.stop') : { profile: { nodes: [], samples: [], timeDeltas: [] } };
  const self = {}; const dt = profile.timeDeltas || []; const idx = {}; profile.nodes.forEach(n => idx[n.id] = n);
  profile.samples.forEach((id, k) => { const n = idx[id]; const nm = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.lineNumber; self[nm] = (self[nm] || 0) + (dt[k] || 0); });
  const tot = Object.values(self).reduce((a, b) => a + b, 0);
  console.log('perfil (self time):'); Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 22).forEach(([n, t]) => console.log('  ', (t / 1000).toFixed(0).padStart(6), 'ms', (100 * t / tot).toFixed(1).padStart(5) + '%', n));
  console.log('escribir una lectura (5 teclas), ms por tecla:', tiempos.join(', '), '| valor:', await p.inputValue(sel));
  console.log('guardarDato (x5):', await p.evaluate(async () => { const v = DATOS.valores[TV_KEY]; let t = performance.now(); for (let k = 0; k < 5; k++) guardarDato(TV_KEY, v); const sync = (performance.now() - t) / 5;
    t = performance.now(); for (let k = 0; k < 5; k++) JSON.stringify(v); const js = (performance.now() - t) / 5;
    t = performance.now(); for (let k = 0; k < 5; k++) localStorage.setItem('x', JSON.stringify(v)); const ls = (performance.now() - t) / 5;
    t = performance.now(); for (let k = 0; k < 5; k++) structuredClone(v); const sc = (performance.now() - t) / 5;
    return 'sincrono ' + sync.toFixed(0) + ' ms | JSON ' + js.toFixed(0) + ' | localStorage ' + ls.toFixed(0) + ' | copia IDB ' + sc.toFixed(0) + ' | tamaño ' + (JSON.stringify(v).length / 1024).toFixed(0) + ' KB'; }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
