const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1.5 });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const latI = {modo:"longitudinal",ancho:"3",absInicio:"",tramos:[T("955.28","955.26","","1.75"),T("955.26","955.33","","9")]};
  const latD = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const proj = { id: 1, nombre: "Eje 2", absInicio: "0", tramos: [T("955.256","955.19","","3"), T("955.19","955.44","","20.95"), T("955.44","","1","")], intermedias: [],
    capas: [{nombre:"base",espesor:"0.15",id:1}], lateralIzq: latI, lateralDer: latD,
    parqueaderos: [{id:9,nombre:"Parq A",modo:"independiente",lado:"derecho",absInicio:"20",absFin:"30",ancho:"5",sobreAncho:"0",diferencia:"",tramos:[T("955.4","955.38","","2.5")],coords:[]}],
    bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  for (const s of ['eje','lat','parq']) {
    await p.click(`.tv-subvia button[data-sub=${s}]`); await p.waitForTimeout(250);
    console.log(s, JSON.stringify(await p.$$eval('.tv-franja-abs, .tv-pie-abs', es => es.map(e => e.innerText.replace(/\s+/g,' ')))));
    await p.screenshot({ path: `../out/acum_${s}.png`, fullPage: true });
  }
  // escribir la distancia del 3er tramo del eje y ver que el lateral cambie su meta
  await p.click('.tv-subvia button[data-sub=eje]');
  const dist = (await p.$$('main input')).length;
  await p.evaluate(() => {});
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
