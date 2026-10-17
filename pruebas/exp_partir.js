const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('dialog ' + d.message()); d.dismiss(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const proj = await p.evaluate(() => {
    const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()}); const g = Math.PI / 180 * 21;
    let pr = { ...proyVacio(), id: 1, nombre: "Partida", absInicio: "0", tramos: [T("965.59","","-2","27.5"), T("965.04","","-1.5","31")],
      capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2},{nombre:"subbase",espesor:"0.30",id:3}],
      coordsEje: [{norte:"1000",este:"1000"},{norte:"1000",este:"1027.5"},{norte:String(1000+31*Math.sin(g)),este:String(1027.5+31*Math.cos(g))}],
      lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
      lateralDer: {modo:"longitudinal",ancho:"3",absInicio:"",tramos:[T("965.53","","-2","28.6"), T("964.958","964.5","","32.2")]},
      parqueaderos: [{id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"5",absFin:"25",ancho:"5",sobreAncho:"0.5",diferencia:"0.09",tramos:[T("","","","")],coords:[]}],
      volumenes: [{ id: 11, nombre: "Base", fuenteSup: "tabla__rasante", fuenteInf: "tabla__base", sobreAncho: "0.5" }] };
    const e = partirTramo(pr.tramos, 0, "12.5"); pr = { ...pr, tramos: e.tramos, coordsEje: partirCoords(pr.coordsEje, 0, 12.5 / 27.5) };
    pr.tramos = ponerCotaPI(pr.tramos, 1, "965.40");
    const l = partirTramo(pr.lateralDer.tramos, 1, "10"); pr.lateralDer = { ...pr.lateralDer, tramos: ponerCotaPI(l.tramos, 2, "964.70") };
    pr.lateralIzq = lateralAPropia(pr, "izq");
    return pr;
  });
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForTimeout(400);
  const t = await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('topovias_standalone'))[0]; return generarTabla(pr).filter(r => [0, 5, 12.5, 20, 27.5, 40, 58.5].includes(r.abs)).map(r => [r.abs, r.cotaLatIzq, r.cotaEje, r.cotaLatDer, r.parqDerCota].join(' | ')); });
  console.log(t.join('\n'));
  await p.click('button:has-text("Exportar")');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=💾 Guardar en el dispositivo')]);
  await dl.saveAs(process.argv[3]); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
