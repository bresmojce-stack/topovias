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
  const niv = [{ id: 5, tipo: "tn", nombre: "Nivelacion limpieza sub base", estaciones: [{id:7,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}], lecturas: [0,5,10,15,20,25,30,35,40,45,50].map((a,k)=>L(a,tnL[k],k?null:7)) }];
  if (!sinSitio) niv.push({ id: 6, tipo: "excavacion", nombre: "Excavación en sitio", estaciones: [{id:8,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}], lecturas: [0,5,10,15,20,25,30,35,40,45,50].map((a,k)=>L(a,exL[k],k?null:8)) });
  const proj = { id: 1, nombre: "EJE 5", absInicio: "0", tramos: [T("100.5","","-1","20"), T("100.3","","1.2","30")], intermedias: [],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.15",id:2},{nombre:"Sub-base",espesor:"0.20",id:3},{nombre:"Roca muerta",espesor:"0.30",id:4}],
    lateralIzq: lat, lateralDer: {...lat}, parqueaderos: [], bmEstaciones: [], coordsEje: [], nivelaciones: niv, volumenes: [] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForSelector('header.tv-header');
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  await p.click('.tv-tabs button[data-tab=via]'); await p.click('.tv-subvia button[data-sub=plano]'); await p.waitForTimeout(400);
  const card = p.locator('.tv-grafica').first(); await card.locator('xpath=..').screenshot({ path: process.argv[3] + '.png' });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.xlsx');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
