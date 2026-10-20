// Abscisa repetida solo en la superficie de ABAJO (lectura "(2)" con cambio brusco de nivel): la fila (2) debe salir igual que
// si las dos la tuvieran: volumen 0 en la (2) y la siguiente abscisa vuelve a dar volumen (promedio de áreas × distancia).
// Vía plana 40 m, ancho 6; arriba cota 101; abajo 100 hasta 0+020 y 99 desde 0+020 (2): a mano 120 + 0 + 240 = 360.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const abrirVia = require('./abrir.js');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); }); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci, cf, pe, di) => ({ cotaInicio: ci, cotaFin: cf, pendiente: pe, distancia: di, id: Math.random() });
  const lat = { modo: "transversal", ancho: "3", modoT: "diferencia", diferencia: "0", pendienteT: "", tramos: [T("", "", "", "")], absInicio: "" };
  const L = (abs, sub, est, v) => ({ abs, sub, estacionId: est, der: v, eje: v, izq: v });
  const xs = [0, 5, 10, 15, 20, 25, 30, 35, 40];
  const mk = (conDos, v1, v2) => { const o = []; xs.forEach((x, i) => { o.push(L(x, 0, i ? null : 1, x <= 20 ? v1 : v2)); if (x === 20 && conDos) o.push(L(20, 1, null, v2)); }); return o; };
  const pr = { id: 1, obraId: 5, nombre: "Repetida", absInicio: "0", tramos: [T("105", "", "0", "40")], intermedias: [], capas: [], sobreancho: { izq: "", der: "" }, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    nivelaciones: [{ id: 21, tipo: "tn", nombre: "Terreno", estaciones: [{ id: 1, nombre: "E1", cotaBM: "100", vistaMas: "2" }], lecturas: mk(false, "1.0", "1.0") },
      { id: 22, tipo: "excavacion", nombre: "Excavado", estaciones: [{ id: 1, nombre: "E1", cotaBM: "100", vistaMas: "1" }], lecturas: mk(true, "1.0", "2.0") }],
    volumenes: [{ id: 31, tipo: "libre", nombre: "TN - excavado", fuenteSup: "nivel__21", fuenteInf: "nivel__22" }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'Obra' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); }, pr);
  await p.reload(); await abrirVia(p, pr.nombre);
  const r = await p.evaluate(pr => { const t = generarTabla(pr), v = calcVolumen(pr.volumenes[0], pr, t);
    return { total: v.volTotal, filas: v.filas.filter(f => f.abs >= 15 && f.abs <= 25).map(f => [f.absFormato, f.area, f.dist, f.vol].join(' | ')) }; }, pr);
  console.log('1. filas 15 a 25 (abscisa | área | distancia | volumen):'); r.filas.forEach(f => console.log('   ' + f));
  console.log('2. total app: ' + r.total + ' | a mano: 360 | ' + (Math.abs(r.total - 360) < 0.0006 ? 'IGUALES' : 'DISTINTOS'));
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(200);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.xlsx'); await p.click('text=Cerrar').catch(() => {});
  console.log('3. Excel:', process.argv[3] + '.xlsx');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
