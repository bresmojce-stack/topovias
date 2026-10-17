const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  p.on('dialog', d => d.accept());
  const out = process.argv[3];
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  console.log('1. inicio vacío:', (await p.innerText('main')).slice(0, 120).replace(/\n+/g,' / '));
  await p.fill('input[placeholder^="Nombre de la nueva obra"]', 'Carambolo'); await p.click('text=+ Crear obra');
  await p.fill('input[placeholder^="Nombre de la vía"]', 'EJE 7'); await p.click('text=+ Nueva vía');
  console.log('2. editor abierto, cabecera:', (await p.innerText('header')).replace(/\n+/g,' / '));
  await p.fill('input[placeholder="ej. 965.390"]', '965.59'); await p.fill('input[placeholder="ej. 27.5"]', '27.5'); await p.fill('input[placeholder="ej. -1.820"]', '-2');
  await p.click('button:has-text("CALCULAR")');
  await p.click('.tv-proyecto button:has-text("Vía")');
  console.log('3. segunda vía, selector:', JSON.stringify(await p.$$eval('header select option', o => o.map(x => x.textContent))));
  await p.fill('input[placeholder="Ej. EJE 7"]', 'EJE 6');
  await p.click('.tv-volver');
  console.log('4. obra:', (await p.innerText('main')).replace(/\n+/g,' / ').slice(0, 400));
  await p.screenshot({ path: out + '_obra.png', fullPage: true });
  // duplicar + excel desde la tarjeta
  await p.click('text=⧉ Duplicar >> nth=0');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=📊 Excel >> nth=0').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  console.log('5. excel desde tarjeta:', dl.suggestedFilename());
  await p.click('text=Cerrar');
  await p.click('text=🗑 Eliminar >> nth=2');
  console.log('6. tras duplicar y eliminar:', JSON.stringify(await p.$$eval('main [role=button] > div:first-child', d => d.map(x => x.innerText))));
  // segunda obra
  await p.click('text=‹ Obras');
  await p.fill('input[placeholder^="Nombre de la nueva obra"]', 'Tamarindo'); await p.click('text=+ Crear obra');
  await p.click('text=‹ Obras');
  console.log('7. lista de obras:', (await p.innerText('main')).replace(/\n+/g,' / ').slice(100, 400));
  await p.screenshot({ path: out + '_obras.png', fullPage: true });
  // abrir vía y recargar: debe volver a la misma vía
  await p.click('text=📁 Carambolo'); await p.click('text=🛣 EJE 7');
  await p.reload(); await p.waitForTimeout(400);
  console.log('8. tras recargar:', (await p.innerText('header')).replace(/\n+/g,' / '), '| tabla calculada:', await p.$$eval('button', bs => bs.some(b => b.innerText.includes('Tabla'))));
  // migración de datos antiguos
  await p.close();
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('P2 ' + e.message));
  await p2.goto('file://' + process.argv[2]); await p2.waitForSelector('header.tv-header');
  await p2.evaluate(() => new Promise(r => { const q = indexedDB.deleteDatabase('topovias'); q.onsuccess = q.onerror = q.onblocked = r; }));
  await p2.evaluate(() => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([{ ...proyVacio(), id: 1, nombre: 'EJE viejo' }, { ...proyVacio(), id: 2, nombre: 'Parq viejo' }])); });
  await p2.reload(); await p2.waitForTimeout(400);
  console.log('9. migración:', (await p2.innerText('main')).replace(/\n+/g,' / ').slice(0, 300));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
