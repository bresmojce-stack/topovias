const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('dialog', d => { errs.push('dialog ' + d.message()); d.dismiss(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const proj = { id: 1, nombre: "EJE 7", absInicio: "0", paso: "10", tramos: [T("965.590","","-2","27.5"), T("965.040","","-2","31")], intermedias: [{valor:"34.6"}],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}],
    lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    lateralDer: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    parqueaderos: [{id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"0",absFin:"30",ancho:"5",sobreAncho:"0",diferencia:"0.09",tramos:[T("","","","")],coords:[]}],
    bmEstaciones: [], nivelaciones: [{ id: 5, nombre: "Roca limpieza", estaciones: [{id: 7, nombre: "Est. 1", cotaBM: "964.663", vistaMas: "2.375"}], lecturas: [{abs:0, estacionId:7, parqDer:"1.58", der:"1.75", eje:"1.78", izq:"1.73", parqIzq:""}] }],
    coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [{ id: 11, nombre: "Roca", fuenteSup: "tabla__base", fuenteInf: "nivel__5", sobreAncho: "0" }] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForTimeout(400);
  await p.click('button:has-text("Exportar")');
  const modal = await p.innerText('[role=dialog]');
  console.log('ventana:', modal.replace(/\n+/g, ' / '));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=💾 Guardar en el dispositivo')]);
  await dl.saveAs(process.argv[3]);
  console.log('archivo:', dl.suggestedFilename());
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
