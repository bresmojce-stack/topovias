const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
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
  await p.click('button:has-text("Plano")'); await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[3], fullPage: true });
  console.log('svgs:', await p.$$eval('.tv-grafica svg', s => s.length));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
