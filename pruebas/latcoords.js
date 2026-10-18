// "Distancias por coordenadas" de cada lateral va dentro de su desplegable (cerrado no se ve; abierto sí, y "Usar coordenadas" funciona).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch(); const errs = [];
 const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
 p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
 await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
 const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
 const lat = {modo:"longitudinal",ancho:"3",modoT:"diferencia",diferencia:"",pendienteT:"",tramos:[T("100.4","","-1","20"),T("","","1","30")],absInicio:""};
 const proj = { id: 1, obraId: 5, nombre: "EJE 5", absInicio: "0", tramos: [T("100.5","","-1","20"), T("","","1.2","30")], intermedias: [], capas: [{nombre:"Asfalto",espesor:"0.05",id:1}],
   lateralIzq: lat, lateralDer: {...lat}, bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], parqueaderos: [], nivelaciones: [], volumenes: [] };
 await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:"Obra Tamarindo"}])); localStorage.setItem('tv_tema', 'claro'); }, proj);
 await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
 if (await p.locator('text=‹ Obras').count()) await p.click('text=‹ Obras'); await p.click('text=Obra Tamarindo'); await p.click('text=EJE 5'); await p.waitForTimeout(300);
 await p.click('.tv-tabs button[data-tab=via]'); await p.waitForTimeout(200); await p.click('.tv-subvia button[data-sub=lat]'); await p.waitForTimeout(300);
 const cuenta = async () => p.locator('text=Distancias por coordenadas').count();
 console.log('cerrados → tarjetas de coordenadas visibles:', await cuenta());
 await p.screenshot({ path: '../out/lat_cerrado.png', fullPage: true });
 await p.locator('.tv-despl-cab', { hasText: 'Lateral derecho' }).click(); await p.waitForTimeout(300);
 console.log('abierto el derecho →', await cuenta(), '| texto:', await p.locator('text=Distancias por coordenadas').first().innerText());
 await p.screenshot({ path: '../out/lat_abierto.png', fullPage: true });
 // usar coordenadas sigue funcionando
 await p.locator('button:has-text("Usar coordenadas")').first().click(); await p.waitForTimeout(300);
 console.log('Usar coordenadas → campos Norte/Este:', await p.locator('input').count());
 console.log(errs.join('\n') || 'no errors'); await b.close(); })();
