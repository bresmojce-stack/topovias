const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1.5 });
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('dialog ' + d.message()); d.dismiss(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const g = Math.PI / 180 * 21;
  const coords = [{norte:"1000",este:"1000"},{norte:"1000",este:"1007.2"},{norte:String(1000 + 12.8*Math.sin(g)),este:String(1007.2 + 12.8*Math.cos(g))}];
  const latD = {modo:"longitudinal",ancho:"3",absInicio:"",tramos:[T("100","","1","7.5"),T("100.075","100.5","","13.5")]};
  const latI = {modo:"longitudinal",ancho:"3",absInicio:"",tramos:[T("100","","1","6.8"),T("100.068","100.2","","12.2")]};
  const proj = { id: 1, nombre: "Quiebre", absInicio: "0", tramos: [T("100.1","","1","7.2"), T("100.172","100.4","","12.8")], intermedias: [],
    capas: [{nombre:"base",espesor:"0.15",id:1}], lateralIzq: latI, lateralDer: latD, coordsEje: coords,
    parqueaderos: [{id:9,nombre:"Parq A",modo:"diferencia",lado:"izquierdo",absInicio:"8",absFin:"18",ancho:"4",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]},
      {id:8,nombre:"Cab",ubicacion:"inicio",modo:"esquinas",desdeX:"3",desdeLado:"izq",hastaX:"3",hastaLado:"der",fondo:"4",esq:{A:"100",B:"100.1",C:"100.1",D:"100"},tramos:[T("","","","")],coords:[]}],
    bmEstaciones: [], nivelaciones: [], coordsIzq: [], coordsDer: [], volumenes: [] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  const r = await p.evaluate(pr => generarTabla(pr).filter(x => !x.fueraVia).map(x => [x.abs, x.cotaLatIzq, x.cotaEje, x.cotaLatDer].join(' | ')), proj);
  console.log(r.join('\n'));
  await p.click('.tv-subvia button[data-sub=lat]'); await p.waitForTimeout(250);
  console.log(JSON.stringify(await p.$$eval('.tv-franja-abs, .tv-pie-abs', es => es.map(e => e.innerText.replace(/\s+/g,' ')))));
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  await p.click('.tv-tabs button[data-tab=via]'); await p.click('.tv-subvia button[data-sub=plano]'); await p.waitForTimeout(400);
  const pl = await p.$$('main svg'); if (pl[1]) await pl[1].screenshot({ path: '../out/quiebre_planta.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
