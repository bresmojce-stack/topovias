const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const proj = { id: 1, obraId: 5, nombre: "EJE", absInicio: "0", tramos: [T("100","","0","20")], intermedias: [],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}], lateralIzq: lat, lateralDer: lat, parqueaderos: [], nivelaciones: [], volumenes: [] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); localStorage.setItem('topovias_standalone__t', String(Date.now() + 100000)); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  await p.click('.tv-tabs button[data-tab=nivel]');
  // como lo haría el usuario: crea excavación en sitio, escribe BM, V+, marca estación y lee
  await p.click('text=+ ⛏️ Excavación en sitio'); await p.waitForTimeout(200);
  await p.fill('main input[placeholder="ej. 965.000"]', '101'); await p.fill('main input[placeholder="ej. 1.520"]', '1');
  await p.selectOption('main tbody tr[data-i="0"] select', { index: 1 });
  await p.fill('main tbody tr[data-i="0"] td:nth-child(6) input', '2.6');
  await p.fill('main tbody tr[data-i="1"] td:nth-child(6) input', '2.5');
  await p.waitForTimeout(300);
  const t = await p.$$eval('main div', ds => ds.map(d => d.innerText).filter(x => /^Cotas — /.test(x)).map(x => x.split('\n')[0]));
  console.log('títulos de cotas:', JSON.stringify(t));
  const filas = await p.$$eval('main table', ts => ts.length);
  console.log('tablas:', filas);
  await p.screenshot({ path: process.argv[3], fullPage: true });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
