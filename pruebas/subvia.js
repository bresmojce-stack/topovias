const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [w, h, tag] of [[390, 844, 'cel'], [1280, 800, 'pc']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 500, hasTouch: w < 500 });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const proj = { id: 1, nombre: "EJE 7", absInicio: "0", tramos: [T("965.590","","-2","27.5"), T("965.040","","-2","31")], intermedias: [{valor:"34.6"}],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}],
    lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    lateralDer: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    parqueaderos: [{id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"0",absFin:"30",ancho:"5",sobreAncho:"0",diferencia:"0.09",tramos:[T("","","","")],coords:[]}],
    bmEstaciones: [], nivelaciones: [{ id: 5, nombre: "Roca limpieza", estaciones: [{id: 7, nombre: "Est. 1", cotaBM: "964.663", vistaMas: "2.375"}], lecturas: [{abs:0, estacionId:7, parqDer:"1.58", der:"1.75", eje:"1.78", izq:"1.73", parqIzq:""}] }],
    coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [{ id: 11, nombre: "Roca", fuenteSup: "tabla__base", fuenteInf: "nivel__5", sobreAncho: "0" }] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
    const pest = await p.$$eval('.tv-tabs button', bs => bs.map(b => b.innerText.trim()));
    console.log(tag, 'pestañas:', pest.join(' · '));
    if (!(await p.$('.tv-subvia'))) { await p.click('.tv-tabs button[data-tab=via]'); }
    for (const s of ['estr', 'eje', 'lat', 'parq', 'sard', 'plano']) {
      await p.click(`.tv-subvia button[data-sub=${s}]`); await p.waitForTimeout(250);
      const tit = await p.$$eval('main .tv-card', cs => cs.slice(0, 2).map(c => c.innerText.split('\n')[0]));
      console.log(tag, s, '→', JSON.stringify(tit));
      if (s === 'estr' || s === 'parq') await p.screenshot({ path: `../out/subvia_${tag}_${s}.png` });
    }
    // fija arriba al bajar
    await p.click('.tv-subvia button[data-sub=eje]'); await p.mouse.wheel(0, 1500); await p.waitForTimeout(400);
    console.log(tag, 'barra arriba tras bajar:', await p.$eval('.tv-subvia', e => Math.round(e.getBoundingClientRect().top)), 'scrollY', await p.evaluate(() => scrollY));
    await p.screenshot({ path: `../out/subvia_${tag}_bajar.png` });
    // recordar
    await p.click('.tv-subvia button[data-sub=parq]'); await p.click('.tv-tabs button[data-tab=nivel]'); await p.click('.tv-tabs button[data-tab=via]');
    console.log(tag, 'al volver:', await p.$eval('.tv-subvia .activa', e => e.innerText));
  }
  for (const [w, tag] of [[360, 'c360'], [390, 'cel'], [1280, 'pc']]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2 });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T2 = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const proj2 = { id: 1, nombre: "EJE 7", absInicio: "0", tramos: [T2("965.590","","-2","27.5"), T2("965.040","","-2","31")], intermedias: [{valor:"34.6"}],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}],
    lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T2("","","","")],absInicio:""},
    lateralDer: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T2("","","","")],absInicio:""},
    parqueaderos: [{id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"0",absFin:"30",ancho:"5",sobreAncho:"0",diferencia:"0.09",tramos:[T2("","","","")],coords:[]}],
    bmEstaciones: [], nivelaciones: [{ id: 5, nombre: "Roca limpieza", estaciones: [{id: 7, nombre: "Est. 1", cotaBM: "964.663", vistaMas: "2.375"}], lecturas: [{abs:0, estacionId:7, parqDer:"1.58", der:"1.75", eje:"1.78", izq:"1.73", parqIzq:""}] }],
    coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [{ id: 11, nombre: "Roca", fuenteSup: "tabla__base", fuenteInf: "nivel__5", sobreAncho: "0" }] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj2);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
    for (const t of ['via', 'resultado', 'cant']) {
      await p.click(`.tv-tabs button[data-tab=${t}]`).catch(()=>{}); await p.waitForTimeout(250);
      await p.screenshot({ path: `../out/tabs_${tag}_${t}.png`, clip: { x: 0, y: 0, width: w, height: 330 } });
    }
    const hh = await p.$eval('header.tv-header', e => e.offsetHeight); const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(tag, 'alto encabezado', hh, 'desborde horizontal', ov);
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
