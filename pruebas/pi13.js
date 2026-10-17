const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const r = await p.evaluate(() => {
    const T = (ci,pe,di) => ({cotaInicio:ci,cotaFin:"",pendiente:pe,distancia:di,id:Math.random()});
    const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T("","","")],absInicio:""};
    const est = { id: 1, cotaBM: "101", vistaMas: "1" };
    const proy = { absInicio:"0", tramos:[T("100","1","13"), T("100.13","-1","7")], intermedias:[], capas:[], lateralIzq:lat, lateralDer:lat, parqueaderos:[], sobreancho:{} };
    const tabla = generarTabla(proy);
    // TN 1 m por encima de la rasante en cada punto: lectura = AI − (rasante + 1)
    proy.nivelaciones = [{ id: 7, tipo: "tn", estaciones: [est], lecturas: tabla.map((row, i) => { const l = (102 - (row.cotaEje + 1)).toFixed(3); return { abs: row.abs, sub: 0, estacionId: i ? null : 1, der: l, eje: l, izq: l }; }) }];
    const v = calcVolumen({ fuenteSup: "nivel__7", fuenteInf: "tabla__rasante" }, proy, tabla);
    return { cotas: tabla.map(t => t.absFormato + " " + t.cotaEje), niv: calcCotasNivelacion(proy.nivelaciones[0], tabla).map(c => c.absFormato + " ai " + c.ai + " eje " + c.cotaEje), lect: proy.nivelaciones[0].lecturas.map(l => l.abs + ":" + l.eje), filas: v.filas.map(f => f.absFormato + "  dist " + f.dist + "  área " + f.area + "  vol " + f.vol), total: v.volTotal };
  });
  console.log(JSON.stringify(r, null, 1)); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
