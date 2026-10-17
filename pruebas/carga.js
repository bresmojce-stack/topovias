const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });   // celular lento
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  // dibujo con 1000 objetos: 600 líneas, 200 puntos, 100 polilíneas, 50 círculos, 50 cotas
  const objs = []; let id = 1; const R = n => 1000 + Math.random() * n;
  for (let i = 0; i < 200; i++) objs.push({ id: id++, t: "p", x: R(300), y: R(300), nom: "P" + i });
  for (let i = 0; i < 600; i++) { const x = R(300), y = R(300); objs.push({ id: id++, t: "l", a: { x, y }, b: { x: x + Math.random() * 20, y: y + Math.random() * 20 } }); }
  for (let i = 0; i < 100; i++) { const x = R(300), y = R(300); objs.push({ id: id++, t: "pl", c: i % 2 === 0, v: [{ x, y }, { x: x + 5, y }, { x: x + 5, y: y + 4 }, { x, y: y + 4 }] }); }
  for (let i = 0; i < 50; i++) objs.push({ id: id++, t: "ci", c: { x: R(300), y: R(300) }, r: 2 + Math.random() * 4 });
  for (let i = 0; i < 50; i++) { const x = R(300), y = R(300); objs.push({ id: id++, t: "cota", a: { x, y }, b: { x: x + 8, y }, d: 1 }); }
  // vía de 2 km
  const T = (ci, cf, pe, di) => ({ cotaInicio: ci, cotaFin: cf, pendiente: pe, distancia: di, id: Math.random() });
  const tramos = []; for (let i = 0; i < 20; i++) tramos.push(T(i === 0 ? "1000" : "", "", String(((i % 5) - 2) * 0.8), "100"));
  const lect = []; for (let a = 0; a <= 2000; a += 5) lect.push({ abs: a, sub: 0, estacionId: a === 0 ? 1 : null, der: "0.5", eje: "0.4", izq: "0.6", fecha: "2026-10-13" });
  const pr = { id: 1, obraId: 5, nombre: "VIA LARGA", absInicio: "0", tramos, intermedias: [], capas: [{ nombre: "Asfalto", espesor: "0.05", id: 1 }, { nombre: "Base", espesor: "0.20", id: 2 }, { nombre: "Subbase", espesor: "0.30", id: 3 }],
    sobreancho: { izq: "0.5", der: "0.5" }, lateralIzq: { modo: "transversal", ancho: "3.5", modoT: "pendiente", diferencia: "", pendienteT: "-2", tramos: [T("", "", "", "")], absInicio: "" },
    lateralDer: { modo: "transversal", ancho: "3.5", modoT: "pendiente", diferencia: "", pendienteT: "-2", tramos: [T("", "", "", "")], absInicio: "" }, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    nivelaciones: [{ id: 21, tipo: "tn", nombre: "TN", estaciones: [{ id: 1, nombre: "E1", cotaBM: "1001", vistaMas: "1.5", fecha: "2026-10-13" }], lecturas: lect }],
    volumenes: [{ id: 31, tipo: "excavacion", nombre: "Excavación", fuenteSup: "nivel__21", fuenteTeorica: "tabla__Excavación", fuenteInf: "tabla__Excavación" }],
    dibujos: [{ id: 9, nombre: "Pesado", sig: 201, objs }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'O' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); }, pr);
  let t0 = Date.now(); await p.reload(); await p.waitForSelector('header.tv-header'); console.log('abrir la app con una vía de 2 km y un dibujo de 1000 objetos:', Date.now() - t0, 'ms');
  t0 = Date.now(); await p.click('button:has-text("CALCULAR")'); await p.waitForSelector('main table'); console.log('calcular la vía (401 abscisas):', Date.now() - t0, 'ms');
  for (const t of ['vol', 'cant', 'plano', 'nivel']) { t0 = Date.now(); await p.click(`.tv-tabs button[data-tab=${t}]`); await p.waitForTimeout(30); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => r()))); console.log('  pestaña ' + t + ':', Date.now() - t0, 'ms'); }
  t0 = Date.now();
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 120000 }), p.click('.tv-acciones > button >> nth=1').then(() => p.click('text=💾 Guardar en el dispositivo', { timeout: 120000 }))]);
  console.log('Excel de la vía de 2 km:', Date.now() - t0, 'ms', dl.suggestedFilename()); await dl.saveAs(process.argv[3] + '.xlsx');
  await p.click('text=Cerrar').catch(() => {});
  t0 = Date.now(); await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForSelector('.tv-dib-svg'); await p.waitForTimeout(150); console.log('abrir el dibujo de 1000 objetos:', Date.now() - t0, 'ms', '| elementos SVG:', await p.$$eval('.tv-dib-svg *', e => e.length));
  // pellizco: 20 movimientos
  const c = await p.$eval('.tv-dib-svg', s => { const r = s.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const toque = (type, d) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: c.x - d, y: c.y, id: 1 }, { x: c.x + d, y: c.y, id: 2 }] });
  await cdp.send('Performance.enable'); const met = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value])); const m0 = await met();
  t0 = Date.now(); await toque('touchStart', 30); for (let d = 34; d <= 110; d += 4) await toque('touchMove', d); await toque('touchEnd', 0); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
  const m1 = await met(); console.log('  pellizco por paso (ms): script', ((m1.ScriptDuration - m0.ScriptDuration) * 50).toFixed(1), '| layout', ((m1.LayoutDuration - m0.LayoutDuration) * 50).toFixed(1), '| estilos', ((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 50).toFixed(1), '| tarea total', ((m1.TaskDuration - m0.TaskDuration) * 50).toFixed(1));
  console.log('pellizco de zoom (20 pasos):', Date.now() - t0, 'ms →', Math.round((Date.now() - t0) / 20), 'ms por paso');
  // dibujar una línea tocando (con imanes calculados sobre 1000 objetos)
  await p.click('.tv-dib-nav button[data-grupo=dibujar]'); await p.click('.tv-dib-hoja button[data-herr="linea"]');
  t0 = Date.now(); await p.touchscreen.tap(c.x - 50, c.y); await p.touchscreen.tap(c.x + 50, c.y + 30); await p.waitForTimeout(50); console.log('dibujar una línea (2 toques):', Date.now() - t0, 'ms');
  t0 = Date.now(); await p.click('.tv-dib-nav button[data-grupo=medir]'); await p.click('.tv-dib-hoja button[data-herr="distancia"]'); await p.touchscreen.tap(c.x - 20, c.y); await p.touchscreen.tap(c.x + 20, c.y); console.log('medir una distancia:', Date.now() - t0, 'ms');
  t0 = Date.now(); const [d2] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DXF")').then(() => p.click('text=💾 Guardar en el dispositivo'))]); console.log('DXF de 1000 objetos:', Date.now() - t0, 'ms');
  const tam = await p.evaluate(() => (localStorage.getItem('topovias_standalone') || '').length); console.log('tamaño guardado:', (tam / 1024).toFixed(0), 'KB');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
