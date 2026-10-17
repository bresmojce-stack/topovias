const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +(process.env.W||1280), height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const dialogos = []; p.on('dialog', d => { dialogos.push(d.message().slice(0, 70)); d.accept(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const proj = { id: 1, obraId: 5, nombre: "EJE 7", absInicio: "0", tramos: [T("100","","1","50")], intermedias: [],
    capas: [{nombre:"base",espesor:"0.15",id:1}], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [],
    bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
  const estado = () => p.$eval('.tv-guardado', e => e.innerText);
  console.log('1. estado al abrir:', await estado());
  await p.click('.tv-subvia button[data-sub=eje]');
  const nombre = 'main input[placeholder="Ej. EJE 7"]';
  await p.fill(nombre, 'EJE 7B'); await p.waitForTimeout(300);
  console.log('2. editar sin bloqueo:', await p.inputValue(nombre), '| estado:', await estado());
  await p.click('.tv-acciones button:has-text("Bloquear")'); await p.waitForTimeout(300);
  console.log('3. banner:', await p.$eval('.tv-banner-bloqueo', e => e.innerText.replace(/\n/g,' ')), '| aviso:', await p.$eval('.tv-aviso', e => e.innerText));
  console.log('   campo readOnly:', await p.$eval(nombre, e => e.readOnly));
  await p.type(nombre, 'XYZ'); await p.waitForTimeout(200);
  console.log('4. escribir bloqueada:', await p.inputValue(nombre));
  // botón que agrega/borra (vía upd) debe avisar
  const n0 = await p.$$eval('main', m => m[0].innerText.length);
  const btnAdd = await p.$('main button:has-text("+ Tramo"), main button:has-text("Agregar tramo")');
  if (btnAdd) { await btnAdd.click(); await p.waitForTimeout(300); console.log('5. +tramo bloqueada → aviso:', await p.$eval('.tv-aviso', e => e.innerText), '| tramos guardados:', await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].tramos.length)); }
  // la guardia de datos: cambiar directo por setProyectos (simula cualquier otro camino)
  // calcular y exportar siguen
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  console.log('6. calcular bloqueada, filas:', await p.$$eval('main table tbody tr', r => r.length));
  // ir a la obra e intentar eliminar
  await p.click('.tv-volver'); await p.waitForTimeout(300);
  console.log('7. tarjeta:', await p.$eval('main', m => m.innerText.split('\n').find(t => t.includes('EJE 7B'))));
  await p.click('main button:has-text("Eliminar")', { trial: false }).catch(()=>{});
  const elim = await p.$$('main button'); 
  for (const bt of elim) { const t = await bt.innerText(); if (/^🗑|Eliminar$/.test(t.trim()) && !/obra/i.test(t)) { await bt.click(); break; } }
  await p.waitForTimeout(300);
  console.log('   diálogos:', JSON.stringify(dialogos));
  console.log('   vías guardadas:', await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone')).map(v => v.nombre + (v.bloqueada?'🔒':''))));
  // duplicar → copia sin candado
  const dup = await p.$('main button:has-text("Duplicar")') || await p.$('main button:has-text("⧉")');
  await dup.click(); await p.waitForTimeout(300);
  console.log('8. tras duplicar:', await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone')).map(v => v.nombre + (v.bloqueada?'🔒':''))));
  // abrir la vía bloqueada, desbloquear y editar
  await p.click('main [role="button"]:has-text("EJE 7B"), main div:text-is("🔒 EJE 7B")').catch(async () => { await p.click('text=🔒 EJE 7B'); });
  await p.waitForTimeout(300);
  await p.click('.tv-banner-bloqueo button:has-text("Desbloquear")'); await p.waitForTimeout(300);
  await p.fill(nombre, 'EJE 7C'); await p.waitForTimeout(300);
  console.log('9. tras desbloquear:', await p.inputValue(nombre), '| banner:', !!(await p.$('.tv-banner-bloqueo')));
  // copias automáticas: recargar y hacer un cambio → copia con el estado anterior
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
  await p.click('.tv-subvia button[data-sub=eje]');
  await p.fill(nombre, 'EJE 7D'); await p.waitForTimeout(600);
  await p.click('.tv-volver'); await p.click('.tv-volver').catch(()=>{}); await p.waitForTimeout(300);
  const back = await p.$('button:has-text("Obras")'); if (back) { await back.click(); await p.waitForTimeout(300); }
  const copias = await p.$$eval('.tv-copia-auto', ds => ds.map(d => d.innerText.replace(/\n/g,' ')));
  console.log('10. copias automáticas:', JSON.stringify(copias));
  await p.click('.tv-copia-auto button'); await p.waitForTimeout(400);
  console.log('    tras restaurar:', await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone')).map(v => v.nombre)));
  console.log('    estado:', await estado());
  await p.screenshot({ path: process.argv[3] + '_obras.png' });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
