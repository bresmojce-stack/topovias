const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const r = await p.evaluate(() => {
    const T = (ci, cf, pe, di) => ({ cotaInicio: ci, cotaFin: cf, pendiente: pe, distancia: di, id: Math.random() });
    const tramos = []; for (let i = 0; i < 20; i++) tramos.push(T(i === 0 ? "1000" : "", "", String(((i % 5) - 2) * 0.8), "100"));
    const lect = []; for (let a = 0; a <= 2000; a += 5) lect.push({ abs: a, sub: 0, estacionId: a === 0 ? 1 : null, der: "0.5", eje: "0.4", izq: "0.6" });
    const niv = { id: 21, tipo: "tn", nombre: "TN", estaciones: [{ id: 1, nombre: "E1", cotaBM: "1001", vistaMas: "1.5" }], lecturas: lect };
    const proy = { ...proyVacio(), tramos, nivelaciones: [niv], lateralIzq: { modo: "transversal", ancho: "3.5", modoT: "pendiente", pendienteT: "-2", tramos: [T("", "", "", "")] }, lateralDer: { modo: "transversal", ancho: "3.5", modoT: "pendiente", pendienteT: "-2", tramos: [T("", "", "", "")] } };
    const t = generarTabla(proy); const out = {};
    let t0 = performance.now(); for (let k = 0; k < 3; k++) calcCotasNivelacion(niv, proy, t); out.calcCotas = ((performance.now() - t0) / 3).toFixed(1);
    t0 = performance.now(); for (let k = 0; k < 3; k++) alinearLecturas(niv.lecturas, t); out.alinear = ((performance.now() - t0) / 3).toFixed(1);
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
