const { chromium } = require('/opt/node-tools/node_modules/playwright');
async function leerXlsx(p, path) {
  return p.evaluate(async b64 => {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    return wb.worksheets.map(ws => { const filas = []; ws.eachRow({ includeEmpty: true }, (row, r) => { const f = []; row.eachCell({ includeEmpty: true }, (c, k) => { let v = c.value; if (v && typeof v === 'object' && 'result' in v) v = v.result; f[k - 1] = v == null ? '' : v; }); filas[r - 1] = f; }); return { filas: Array.from(filas, f => f || []) }; });
  }, require('fs').readFileSync(path).toString('base64'));
}
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: W, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const L = (abs, v, est) => ({abs, estacionId: est||null, parqDer:"", der:v, eje:v, izq:v, parqIzq:""});
  const proj = { id: 1, nombre: "EJE 7", absInicio: "0", tramos: [T("100","","-1","50")], intermedias: [],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.20",id:2},{nombre:"Rajón",espesor:"0.30",id:3}], lateralIzq: lat, lateralDer: {...lat}, parqueaderos: [],
    bmEstaciones: [], coordsEje: [],
    nivelaciones: [{ id: 5, tipo: "tn", nombre: "TN", estaciones: [{id:7,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}], lecturas: [0,5,10,15,20,25,30,35,40,45,50].map((a,k)=>L(a,"0.5",k?null:7)) },
      { id: 6, tipo: "excavacion", nombre: "Excavación en sitio", estaciones: [{id:8,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}], lecturas: [0,5,10,15,20,25,30,35,40,45,50].map((a,k)=>L(a,"2.0",k?null:8)) }],
    volumenes: [{ id: 11, tipo: "excavacion", nombre: "Excavación", fuenteSup: "nivel__5", fuenteInf: "nivel__6", sobreAncho: "0" }],
    fallos: [{ id: 21, nombre: "Fallo 1", desde: "30", hasta: "35", xDesde: "0", ladoDesde: "der", xHasta: "3", ladoHasta: "der", material: "Rajón", contra: "nivel__6", puntos: 3, cotaBM: "100", vistaMas: "1.5",
      lecturas: [{ abs: "30", v: ["2.18","2.20","2.17"] }, { abs: "32.5", v: ["2.21","2.23","2.20"] }, { abs: "35", v: ["2.17","2.19","2.18"] }] },
      { id: 22, nombre: "Fallo 2", desde: "10", hasta: "12", xDesde: "1", ladoDesde: "izq", xHasta: "1", ladoHasta: "der", material: "otro", materialOtro: "Piedra pegada", contra: "tabla__Excavación", puntos: 1, cotaBM: "100", vistaMas: "1.5",
      lecturas: [{ abs: "11", v: ["2.0"] }] }] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('topovias_standalone'))[0]; const t = generarTabla(pr);
    const f = pr.fallos.map(fa => { const x = calcFallo(fa, pr, t); return [fa.nombre, x.ancho, x.largo, x.ai, x.validas.map(v => [v.abs, v.prof.join('/'), v.prom, v.area, v.dist, +v.vol.toFixed(4)]), x.vol, x.material]; });
    const q = calcCantidades(pr, t); return { f, cant: q.items.map(i => i.nombre + ' ' + i.valor + (i.desglose ? ' [' + i.desglose.map(d => d.nombre + ' ' + d.valor).join('; ') + ']' : '')) }; });
  console.log(JSON.stringify(r, null, 1));
  await p.click('button:has-text("Nivelaciones")'); await p.waitForTimeout(400);
  await p.locator('.tv-fallo').first().scrollIntoViewIfNeeded(); await p.screenshot({ path: process.argv[3] + '_ui.png' });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  const path = process.argv[3] + '.xlsx'; await dl.saveAs(path);
  const todas = (await leerXlsx(p, path))[0].filas.filter(r => r.some(v => v !== ''));
  const i0 = todas.findIndex(r => String(r[0]).startsWith('FALLO:'));
  todas.slice(i0, i0 + 22).concat(todas.filter(r => /Excavación|Relleno|Fallos/.test(String(r[0])))).forEach(r => console.log('  xlsx', JSON.stringify(r.filter(v => v !== ''))));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
