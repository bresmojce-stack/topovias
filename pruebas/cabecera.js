const { chromium } = require('/opt/node-tools/node_modules/playwright');
async function leerXlsx(p, path) {
  return p.evaluate(async b64 => {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    return wb.worksheets.map(ws => { const filas = []; ws.eachRow({ includeEmpty: true }, (row, r) => { const f = []; row.eachCell({ includeEmpty: true }, (c, k) => { let v = c.value; if (v && typeof v === 'object' && 'result' in v) v = v.result; f[k - 1] = v == null ? '' : v; }); filas[r - 1] = f; }); return { nombre: ws.name, filas: Array.from(filas, f => f || []) }; });
  }, require('fs').readFileSync(path).toString('base64'));
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: +(process.env.W||1280), height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const L = (abs, v) => ({abs, estacionId: abs===-5?7:null, parqDer:v.pd||"", der:v.d||"", eje:v.e||"", izq:v.i||"", parqIzq:v.pi||""});
  const proj = { id: 1, nombre: "EJE 7", absInicio: "0", tramos: [T("100","","-2","30")], intermedias: [],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.20",id:2}],
    lateralIzq: lat, lateralDer: {...lat},
    parqueaderos: [
      {id:9,nombre:"Cupos 279-281",modo:"diferencia",ubicacion:"inicio",lado:"izquierdo",desde:"1",hasta:"8.5",fondo:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]},
      {id:10,nombre:"Cupos 234-235",modo:"diferencia",ubicacion:"inicio",lado:"derecho",desde:"3.5",hasta:"9.5",fondo:"5",pendienteFondo:"2",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
    bmEstaciones: [], coordsEje: [], volumenes: [{id:11,nombre:"Corte",fuenteSup:"nivel__5",fuenteInf:"tabla__rasante",sobreAncho:"0"}],
    nivelaciones: [{id:5,nombre:"TN",tipo:"tn",estaciones:[{id:7,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}],
      lecturas:[L(-5,{pd:"0.5",pi:"0.5"}),L(0,{pd:"0.5",d:"0.5",e:"0.5",i:"0.5",pi:"0.5"}),L(5,{d:"0.5",e:"0.5",i:"0.5"}),L(10,{d:"0.5",e:"0.5",i:"0.5"})]}] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForTimeout(600);
  const t = await p.evaluate(() => generarTabla(JSON.parse(localStorage.getItem('topovias_standalone'))[0]));
  t.slice(0,4).forEach(r => console.log(r.absFormato, 'fuera', r.fueraVia, 'eje', r.cotaEje, 'izq', r.cotaLatIzq, 'pI', r.parqIzqCota, 'pD', r.parqDerCota, 'base pI', r.capas.find(c=>c.nombre==='Base').parqIzq));
  const res = await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('topovias_standalone'))[0]; const t = generarTabla(pr);
    const v = calcVolumenTotal(pr.volumenes[0], pr, t); const a = calcAreas(pr, t); const c = calcCantidades(pr, t);
    return { filas: v.partes[0].r.filas.map(f => [f.absFormato, f.cab?'CAB':'via', f.prom, f.ancho, f.area, f.dist, f.vol]), tot: v.volTotal,
      areas: { largo: a.largo, via: a.via, parqs: a.parqs.map(x => [x.nombre, x.largo, x.ancho, x.area]), total: a.total }, cant: c.items ? c.items.map(i => i.nombre + ' ' + i.valor) : Object.keys(c) }; });
  console.log(JSON.stringify(res, null, 1));
  // UI
  await (p.click('.tv-tabs button[data-tab=via]'), p.click('.tv-subvia button[data-sub=parq]'));
  await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[3] + '_parq.png', fullPage: true });
  await p.click('button:has-text("CALCULAR")').catch(()=>{});
  await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[3] + '_tabla.png', fullPage: false });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  const path = process.argv[3] + '.xlsx'; await dl.saveAs(path);
  const todas = (await leerXlsx(p, path))[0].filas.filter(r => r.some(v => v !== ''));
  todas.forEach(r => { const s = JSON.stringify(r.filter(v => v !== '')); if (/PARQUEADERO|CUPOS|-0\+005|ABS|LARGO|VOLUMEN|TOTAL|CONFORMADA|Base|Corte/i.test(s)) console.log('  xlsx', s.slice(0, 260)); });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
