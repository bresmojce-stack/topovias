// Excavación en dos cortes cuando el terreno queda por debajo de la cota teórica (v78).
// Rasante 100, estructura 0.55 → cota teórica 99.45. Terreno 99.40 (0–20) y 100.00 (20–40); fondo en sitio 98.40; ancho 6 m (sin sobreancho).
// Esperado: corte 1 = solo donde el terreno pasa de la teórica: 0.55×6 entre 20 y 40, más medio tramo de 15 a 20
//           corte 1 + corte 2 = terreno − sitio (medido directo); antes el corte 2 contaba la franja de relleno 99.40–99.45.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const r = await p.evaluate(() => {
    const T = (ci, pe, di) => ({ cotaInicio: ci, cotaFin: "", pendiente: pe, distancia: di, id: Math.random() });
    const lat = { modo: "transversal", ancho: "3", modoT: "diferencia", diferencia: "0", pendienteT: "", tramos: [T("", "", "")], absInicio: "" };
    const abs = [0, 5, 10, 15, 20, 25, 30, 35, 40], est = { id: 1, nombre: "Est. 1", cotaBM: "101", vistaMas: "1" };
    const lect = f => abs.map((a, i) => { const l = f(a); return { abs: a, sub: 0, estacionId: i ? null : 1, der: l, eje: l, izq: l }; });
    const v = { id: 1, nombre: "P", absInicio: "0", tramos: [T("100", "0", "40")], intermedias: [], sobreancho: { izq: "", der: "" },
      capas: [{ nombre: "asfalto", espesor: "0.05", id: 1 }, { nombre: "base", espesor: "0.15", id: 2 }, { nombre: "roca", espesor: "0.35", id: 3 }],
      lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
      nivelaciones: [{ id: 21, tipo: "tn", estaciones: [est], lecturas: lect(a => a < 20 ? "2.600" : "2.000") }, { id: 22, tipo: "excavacion", estaciones: [est], lecturas: lect(() => "3.600") }],
      volumenes: [{ id: 31, tipo: "excavacion", nombre: "Excavación", fuenteSup: "nivel__21", fuenteTeorica: "tabla__Excavación", fuenteInf: "nivel__22" }] };
    const t = generarTabla(proyCalc(v)), vo = v.volumenes[0];
    const ps = partesVolumen(vo).map(pt => calcVolumen(pt, v, t).volTotal);
    const real = calcVolumen({ fuenteSup: vo.fuenteSup, fuenteInf: vo.fuenteInf, capaSA: "Excavación" }, v, t).volTotal;
    return { c1: ps[0], c2: ps[1], suma: r3(ps[0] + ps[1]), real };
  });
  console.log('corte 1: ' + r.c1 + ' | corte 2: ' + r.c2 + ' | suma: ' + r.suma + ' | terreno → sitio: ' + r.real);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
