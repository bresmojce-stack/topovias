const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: +(process.env.W || 1200), height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('dialog ' + d.message()); d.dismiss(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const sinSitio = process.env.SIN === '1';
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const tnL = [0.9,1.1,1.3,1.6,1.4,1.2,1.0,0.8,0.7,0.9,1.1].map(String), exL = [2.25,2.3,2.4,2.55,2.5,2.35,2.3,2.28,2.3,2.32,2.3].map(String);
  const L = (abs, v, est) => ({abs, estacionId: est||null, parqDer:"", der:v, eje:v, izq:v, parqIzq:""});
  const niv = [{ id: 5, tipo: "tn", nombre: "TN", estaciones: [{id:7,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}], lecturas: [0,5,10,15,20,25,30,35,40,45,50].map((a,k)=>L(a,tnL[k],k?null:7)) }];
  if (!sinSitio) niv.push({ id: 6, tipo: "excavacion", nombre: "Excavación en sitio", estaciones: [{id:8,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}], lecturas: [0,5,10,15,20,25,30,35,40,45,50].map((a,k)=>L(a,exL[k],k?null:8)) });
  const proj = { id: 1, nombre: "EJE 5", absInicio: "0", tramos: [T("100.5","","-1","20"), T("100.3","","1.2","30")], intermedias: [],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.15",id:2},{nombre:"Sub-base",espesor:"0.20",id:3},{nombre:"Roca muerta",espesor:"0.30",id:4}],
    lateralIzq: lat, lateralDer: {...lat}, parqueaderos: [], bmEstaciones: [], coordsEje: [], nivelaciones: niv, volumenes: [] };
  proj.parqueaderos = [{id:9,nombre:"P-1",modo:"diferencia",ubicacion:"lateral",lado:"derecho",absInicio:"15",absFin:"40",ancho:"5",sobreAncho:"0.5",diferencia:"0.09",tramos:[T("","","","")],coords:[]}];
  proj.obraId = 5;
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:"Obra Tamarindo"}])); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'inicio'})); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  if (await p.locator('text=‹ Obras').count()) { await p.click('text=‹ Obras'); await p.waitForTimeout(300); }
  await p.click('[data-tema-btn=oscuro]'); await p.waitForTimeout(200);
  console.log('tema:', await p.evaluate(() => document.documentElement.dataset.tema + ' ' + localStorage.getItem('tv_tema')));
  await p.screenshot({ path: '../out/oscuro_inicio.png' });
  await p.reload(); await p.waitForSelector('header.tv-header');
  console.log('tras recargar:', await p.evaluate(() => document.documentElement.dataset.tema));
  await p.click('text=Obra Tamarindo'); await p.waitForTimeout(300);
  await p.screenshot({ path: '../out/oscuro_obra.png' });
  await p.click('text=EJE 5'); await p.waitForTimeout(300);
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(400);
  await p.screenshot({ path: '../out/oscuro_cotas.png' });
  await p.click('.tv-tabs button[data-tab=via]'); await p.click('.tv-subvia button[data-sub=parq]'); await p.waitForTimeout(300);
  await p.locator('.tv-despl-cab').first().click(); await p.waitForTimeout(200);
  await p.screenshot({ path: '../out/oscuro_parq.png', fullPage: true });
  await p.click('.tv-subvia button[data-sub=plano]'); await p.waitForTimeout(400);
  await p.screenshot({ path: '../out/oscuro_plano.png' });
  await p.click('.tv-tabs button[data-tab=nivel]'); await p.waitForTimeout(300);
  await p.screenshot({ path: '../out/oscuro_niv.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
