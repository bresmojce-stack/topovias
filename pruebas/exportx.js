const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const tnCotas = {0:965.80,5:965.55,10:965.22,15:964.98,20:964.62,25:964.18,27.5:964.05,30:964.12,35:964.45,40:965.10,45:965.42,50:965.68,55:965.92,57.5:966.02};
  const AI = 967.5;
  const lect = Object.entries(tnCotas).map(([a, c], i) => ({ abs: +a, estacionId: i === 0 ? 7 : null, parqDer: "", der: "", eje: (AI - c).toFixed(3), izq: "", parqIzq: "" }));
  const proj = { id: 1, nombre: "EJE 7", absInicio: "0", tramos: [T("965.39","","-1.82","27.5"), T("964.889","965.5","","30")], intermedias: [],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2},{nombre:"roca",espesor:"0.35",id:3,sobreancho:"general"}],
    sobreancho: { izq: "0.5", der: "0.4" }, lateralIzq: lat, lateralDer: lat, bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [],
    parqueaderos: [{id:9,nombre:"Parqueadero",modo:"diferencia",lado:"derecho",absInicio:"10",absFin:"25",ancho:"5",sobreAncho:"0.5",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
    nivelaciones: [{ id: 5, nombre: "Terreno natural", estaciones: [{ id: 7, nombre: "Est. 1", cotaBM: "966", vistaMas: "1.5" }], lecturas: lect }] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); }, proj);
  await p.reload(); await p.waitForTimeout(400);
  // volumen para probar fórmulas
  await p.evaluate(() => { const ps = JSON.parse(localStorage.getItem('topovias_standalone')); ps[0].volumenes = [{ id: 11, nombre: 'Excavación', fuenteSup: 'nivel__5', fuenteInf: 'tabla__Excavación' }]; localStorage.setItem('topovias_standalone', JSON.stringify(ps)); return TVDB.set('topovias_standalone', ps); });
  await p.reload(); await p.waitForTimeout(400);
  const t0 = Date.now();
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3]);
  console.log('excel listo en', ((Date.now() - t0) / 1000).toFixed(1), 's →', dl.suggestedFilename());
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
