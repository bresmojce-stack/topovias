// Dos parqueaderos laterales que se tocan con distinto ancho (caso de Brian, 0+041.500: gris 5.00 m y azul 5.40 m).
// La abscisa de la unión va dos veces: la primera con el gris (955.200, ancho 5) y la segunda con el azul (955.210,
// ancho 5.4); entre las dos la distancia es 0. Se compara el volumen de la app con la cuenta a mano y se baja el
// Excel para recalcularlo en LibreOffice (correr.js).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const abrirVia = require('./abrir.js');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); }); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci, cf, pe, di) => ({ cotaInicio: ci, cotaFin: cf, pendiente: pe, distancia: di, id: Math.random() });
  const lat = { modo: "transversal", ancho: "3", modoT: "diferencia", diferencia: "0.06", pendienteT: "", tramos: [T("", "", "", "")], absInicio: "" };
  const PQ = (id, nombre, ai, af, ancho, ci, cf) => ({ id, nombre, modo: "independiente", ubicacion: "lateral", lado: "derecho", absInicio: ai, absFin: af, ancho, sobreAncho: "0", saExtremos: "0", diferencia: "0",
    tramos: [T(ci, cf, "", String(Math.round((parseFloat(af) - parseFloat(ai)) * 1000) / 1000))], coords: [], estructura: "via", capas: [] });
  const est = { id: 1, nombre: "Est. 1", cotaBM: "955", vistaMas: "1" };   // A.I. 956: lectura 1.100 → cota 954.900
  const L = (abs, sub, i) => ({ abs, sub, estacionId: i ? null : 1, parqDer: "1.100", der: "1.100", eje: "1.100", izq: "1.100", fecha: "2026-10-19" });
  const pr = { id: 1, obraId: 5, nombre: "Escalon", absInicio: "0", tramos: [T("955.273", "", "-0.56", "52.8")], intermedias: [], capas: [], sobreancho: { izq: "", der: "" },
    lateralIzq: lat, lateralDer: lat, bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    parqueaderos: [PQ(9, "Parqueadero 1", "1.5", "41.5", "5", "955.420", "955.200"), PQ(8, "Parqueadero 2", "41.5", "45.4", "5.4", "955.210", "955.190")],
    nivelaciones: [{ id: 21, tipo: "tn", nombre: "Terreno", estaciones: [est], lecturas: [L(40, 0, 0), L(41.5, 0, 1), L(41.5, 1, 2), L(45, 0, 3)] }],
    volumenes: [{ id: 31, tipo: "libre", nombre: "Rasante - terreno", fuenteSup: "tabla__rasante", fuenteInf: "nivel__21" }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'Obra' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); }, pr);
  await p.reload(); await abrirVia(p, pr.nombre);
  const r = await p.evaluate(pr => {
    const t = generarTabla(pr), v = calcVolumen(pr.volumenes[0], pr, t), a = calcAreas(pr, t);
    const cot = calcCotasNivelacion(pr.nivelaciones[0], t).filter(c => c.abs >= 40 && c.abs <= 45.0005);
    return { filas: t.filter(f => f.abs >= 39.9 && f.abs <= 45.5).map(f => [f.absFormato + (f.sub ? " (2)" : ""), f.parqDerCota, f.cotaLatDer, f.cotaEje].join(' ')),
      cartera: cot.map(c => c.absFormato + ' ' + c.cotaParqDer).join(' | '),
      vol: v.filas.map(f => [f.abs + (f.sub ? "(2)" : ""), f.prom, f.ancho, f.area, f.dist, f.vol].join(' ')), total: v.volTotal,
      areas: a.parqs.map(x => x.nombre + ' ' + x.areaPlano).join(' + ') + ' = ' + r3(a.parqs.reduce((s, x) => s + x.areaPlano, 0)) };
  }, pr);
  console.log('1. tabla de cotas:'); r.filas.forEach(f => console.log('   ' + f));
  console.log('2. cartera:', r.cartera);
  console.log('3. volumen (abscisa, promedio, ancho, área, distancia, volumen):'); r.vol.forEach(f => console.log('   ' + f));
  // cuenta a mano: cotas por la recta de cada tramo, terreno 954.900 en todo, 4 puntos (parq der, lat der, eje, lat izq)
  const r3 = x => Math.round(x * 1000 + 1e-9) / 1000;
  const eje = a => r3(955.273 - 0.0056 * a), latC = a => r3(eje(a) + 0.06);
  const gris = a => r3(955.420 + (955.200 - 955.420) * (a - 1.5) / 40), azul = a => r3(955.210 + (955.190 - 955.210) * (a - 41.5) / 3.9);
  const sec = (a, pq, ancho) => { const prom = r3([pq(a), latC(a), eje(a), latC(a)].reduce((s, c) => s + r3(c - 954.9), 0) / 4); return { prom, area: r3(prom * ancho) }; };
  const S = [[40, sec(40, gris, 11)], [41.5, sec(41.5, gris, 11)], [41.5, sec(41.5, azul, 11.4)], [45, sec(45, azul, 11.4)]];
  let mano = 0; for (let i = 1; i < S.length; i++) mano += (S[i - 1][1].area + S[i][1].area) / 2 * (S[i][0] - S[i - 1][0]);
  console.log('4. total app: ' + r.total + ' | a mano: ' + r3(mano) + ' | ' + (Math.abs(r.total - r3(mano)) < 0.0006 ? 'IGUALES' : 'DISTINTOS'));
  console.log('5. área de parqueaderos: ' + r.areas);
  // B. el mismo caso como UN parqueadero con dos tramos (tramo 2 con su ancho 5.40): mismos números; además
  //    sobreancho 0.5 y extremos 0.5 (los extremos solo al inicio y al fin, no en el cambio) y sardinel con el escalón
  const rB = await p.evaluate(pr => {
    const T = (ci, cf, di, ancho) => ({ cotaInicio: ci, cotaFin: cf, pendiente: "", distancia: di, ...(ancho ? { ancho } : {}), id: Math.random() });
    const uno = { ...pr.parqueaderos[0], absFin: "45.4", sobreAncho: "0.5", saExtremos: "0.5", tramos: [T("955.420", "955.200", "40"), T("955.210", "955.190", "3.9", "5.4")] };
    const v = { ...pr, parqueaderos: [uno], sardinel: { activo: true, corona: "0.15", pata: "0.20", altura: "0.45", revelado: "0.15", lados: { izq: false, der: false, ini: false, fin: false }, sin: [], ejecutado: [] } };
    const t = generarTabla(v), vol = calcVolumen(v.volumenes[0], v, t), a = calcAreas(v, t), sd = piezasSardinel(v).find(z => z.key === "pq:9");
    return { filas: t.filter(f => f.abs > 41 && f.abs < 42).map(f => f.absFormato + (f.sub ? " (2)" : "") + " " + f.parqDerCota).join(' | '), total: vol.volTotal,
      areas: a.parqs.map(x => x.nombre + ' ' + x.largoC + '×' + x.ancho + '=' + x.area).join(' + '), sd: sd ? sdTotalPieza(sd) : null, n: proyCalc(v).parqueaderos.length };
  }, pr);
  console.log('8. un parqueadero con dos anchos: ' + rB.filas + ' | total ' + rB.total + (Math.abs(rB.total - r.total) < 0.0006 ? ' (igual a dos parqueaderos)' : ' (DISTINTO)'));
  console.log('   áreas con extremos: ' + rB.areas);
  console.log('   sardinel del parqueadero: ' + rB.sd + ' (43.9 por afuera + 5.0 + 0.4 + 5.4)');
  // C. cartera de antes (una sola lectura en 0+041.500): la fila (2) usa esa misma lectura y el volumen no se corta
  const rC = await p.evaluate(pr => { const v = { ...pr, nivelaciones: pr.nivelaciones.map(n => ({ ...n, lecturas: n.lecturas.filter(l => !l.sub) })) };
    const t = generarTabla(v); return calcVolumen(v.volumenes[0], v, t).volTotal; }, pr);
  console.log('10. sin lectura (2): total ' + rC + (Math.abs(rC - r.total) < 0.0006 ? ' (no se corta)' : ' (SE CORTA)'));
  // pantalla y Excel
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(200);
  await p.click('.tv-tabs button[data-tab=cotas]').catch(() => {}); await p.waitForTimeout(200);
  console.log('6. en pantalla:', (await p.$$eval('td', ts => ts.map(t => t.innerText).filter(x => /^0\+041\.500/.test(x)))).join(' | '));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.xlsx'); await p.click('text=Cerrar').catch(() => {});
  console.log('7. Excel:', process.argv[3] + '.xlsx');
  // Excel del caso B (un parqueadero con dos anchos, sobreancho y extremos): se recalcula en LibreOffice (correr.js)
  const T2 = (ci, cf, di, ancho) => ({ cotaInicio: ci, cotaFin: cf, pendiente: "", distancia: di, ...(ancho ? { ancho } : {}), id: Math.random() });
  const prB = { ...pr, nombre: "Escalon B", capas: [{ nombre: "asfalto", espesor: "0.05", id: 1 }, { nombre: "base", espesor: "0.15", id: 2, sobreancho: "general" }], sobreancho: { izq: "0.5", der: "0.5" },
    parqueaderos: [{ ...pr.parqueaderos[0], absFin: "45.4", sobreAncho: "0.5", saExtremos: "0.5", tramos: [T2("955.420", "955.200", "40"), T2("955.210", "955.190", "3.9", "5.4")] }],
    nivelaciones: pr.nivelaciones.map(n => ({ ...n, lecturas: n.lecturas.filter(l => !l.sub) })) };   // sin la (2): el Excel la toma de la fila de arriba
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999)); }, prB);
  await p.reload(); await abrirVia(p, prB.nombre); await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(200);
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl2.saveAs(process.argv[3] + '_b.xlsx'); await p.click('text=Cerrar').catch(() => {});
  console.log('9. Excel un parqueadero:', process.argv[3] + '_b.xlsx');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
