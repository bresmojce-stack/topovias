const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('dialog: ' + d.message()); d.accept(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const proj = { id: 1, nombre: "Carrera 120 sur", absInicio: "0", tramos: [T("100","","1","20")], intermedias: [], capas: [{nombre:"base",espesor:"0.15",id:1}], lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
  await p.click('.tv-tabs button[data-tab=memoria]'); await p.waitForTimeout(200);
  console.log('pestaña:', await p.$eval('.tv-tabs button[data-tab=memoria]', e => e.innerText));
  // anotación de hace dos días con 2 fotos
  await p.click('button:has-text("+ Agregar anotación")');
  console.log('fecha por defecto:', await p.inputValue('input[type=date]'));
  await p.fill('input[type=date]', '2026-10-14');
  await p.fill('textarea', 'Se excavó de la 0+020 a la 0+060 lado derecho.\nFallo en la 0+030 rellenado con rajón.');
  const files = await p.$$('input[type=file]');
  await files[1].setInputFiles(['../out/foto0.jpg', '../out/foto1.jpg']); await p.waitForTimeout(1500);
  console.log('miniaturas en editor:', await p.$$eval('img[alt=foto]', i => i.length));
  await p.click('button:has-text("Guardar")'); await p.waitForTimeout(300);
  // otra de hoy, solo texto
  await p.click('button:has-text("+ Agregar anotación")'); await p.fill('textarea', 'Llegó la sub-base, 3 volquetas.'); await p.click('button:has-text("Guardar")'); await p.waitForTimeout(300);
  console.log('orden:', JSON.stringify(await p.$$eval('.tv-bit-item', es => es.map(e => e.innerText.split('\n')[0]))));
  const guardada = await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].bitacora);
  console.log('guardado en la vía:', JSON.stringify(guardada.map(a => ({ fecha: a.fecha, creada: a.creada, fotos: a.fotos.length, txt: a.texto.slice(0, 20) }))));
  const tam = await p.evaluate(async id => { const bl = await TVDB.get('foto_' + id); return bl ? [bl.size, bl.type] : null; }, guardada[0].fotos[0]);
  console.log('foto achicada (bytes, tipo):', JSON.stringify(tam), '| tamaño de la vía guardada:', (await p.evaluate(() => localStorage.getItem('topovias_standalone').length)), 'caracteres');
  await p.screenshot({ path: '../out/bitacora_cel.png', fullPage: true });
  // recargar: fotos siguen
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.click('.tv-tabs button[data-tab=memoria]'); await p.waitForTimeout(800);
  console.log('tras recargar, fotos visibles:', await p.$$eval('img[alt=foto]', i => i.filter(x => x.naturalWidth > 0).length));
  // visor
  await p.click('.tv-bit-item img[alt=foto]'); await p.waitForTimeout(400);
  console.log('visor:', await p.$eval('[role=dialog]', e => e.innerText.trim()));
  await p.screenshot({ path: '../out/bitacora_visor.png' });
  await p.click('[role=dialog]'); await p.waitForTimeout(200);
  // editar: quitar una foto
  const items = await p.$$('.tv-bit-item'); const conFotos = items[1];
  await (await conFotos.$('button:has-text("Editar")')).click(); await p.waitForTimeout(300);
  await p.click('button[title="Quitar foto"]'); await p.click('button:has-text("Guardar")'); await p.waitForTimeout(300);
  const g2 = await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].bitacora.find(a => a.fecha === '2026-10-14'));
  const borrada = await p.evaluate(async id => !!(await TVDB.get('foto_' + id)), guardada[0].fotos[0]);
  console.log('tras quitar: fotos', g2.fotos.length, '| la quitada sigue en el equipo:', borrada);
  // borrar anotación
  await (await (await p.$$('.tv-bit-item'))[1].$('button:has-text("🗑")')).click(); await p.waitForTimeout(300);
  console.log('quedan:', await p.$$eval('.tv-bit-item', e => e.length));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
