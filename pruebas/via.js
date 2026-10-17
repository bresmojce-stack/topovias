const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, m] of [[390, 844, true], [1280, 900, false]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
    const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
    const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
    const proj = { id: 1, obraId: 5, nombre: "EJE 7", absInicio: "0", tramos: [T("965.59","","-2","27.5"), T("965.04","","2","30")], intermedias: [],
      capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}], lateralIzq: lat, lateralDer: lat, parqueaderos: [], nivelaciones: [], volumenes: [] };
    await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); localStorage.setItem('topovias_standalone__t', String(Date.now() + 100000)); }, proj);
    await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
    console.log(w, 'pestañas:', JSON.stringify(await p.$$eval('.tv-tabs button', bs => bs.map(b => b.innerText))));
    console.log(w, 'títulos de sección:', JSON.stringify(await p.$$eval('main > div[id^="tv-sec"]', ds => ds.map(d => d.innerText + '@' + Math.round(d.getBoundingClientRect().top)))));
    const sobre = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(w, 'desborde horizontal:', sobre);
    await p.screenshot({ path: process.argv[3] + '_' + w + '.png', fullPage: true });
    await p.click('main button:has-text("③ Laterales")'); await p.waitForTimeout(700);
    console.log(w, 'tras ir a ③, Laterales arriba en:', await p.$eval('#tv-sec-laterales', d => Math.round(d.getBoundingClientRect().top)));
    console.log(errs.join('\n') || 'no errors');
  }
  await b.close();
})();
