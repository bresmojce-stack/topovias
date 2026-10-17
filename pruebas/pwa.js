const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL0 = 'http://localhost:8766/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  p.on('dialog', d => { console.log('   [diálogo] ' + d.message().replace(/\n+/g, ' | ')); d.accept(); });
  // 1. datos antiguos en localStorage → deben pasar a IndexedDB
  await p.goto(URL0); await p.waitForSelector('header.tv-header');
  await p.evaluate(() => localStorage.setItem('topovias_standalone', JSON.stringify([{ ...proyVacio(), id: 1, nombre: 'EJE viejo' }])));
  await p.reload(); await p.waitForSelector('text=EJE viejo');
  const enIDB = await p.evaluate(() => TVDB.get('topovias_standalone').then(v => v && v.map(x => x.nombre)));
  console.log('1. migración a la base de datos del dispositivo:', JSON.stringify(enIDB), '| DATOS.idb =', await p.evaluate(() => DATOS.idb));
  // 2. crear datos, borrar localStorage: deben seguir (viven en IndexedDB)
  await p.click('text=‹ Obras');
  await p.fill('input[placeholder^="Nombre de la nueva obra"]', 'Obra Nueva'); await p.click('text=+ Crear obra');
  await p.fill('input[placeholder^="Nombre de la vía"]', 'Vía 1'); await p.click('text=+ Nueva vía');
  await p.waitForTimeout(300);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(600);
  console.log('2. tras borrar localStorage y recargar:', (await p.innerText('main')).replace(/\n+/g, ' / ').slice(0, 200));
  // 3. instalable: service worker activo y manifiesto válido
  await p.evaluate(() => navigator.serviceWorker.ready);
  const sw = await p.evaluate(async () => ({ controla: !!navigator.serviceWorker.controller, regs: (await navigator.serviceWorker.getRegistrations()).length, cache: await caches.keys() }));
  const man = await p.evaluate(async () => { const r = await fetch(document.querySelector('link[rel=manifest]').href); const j = await r.json(); return { name: j.name, display: j.display, icons: j.icons.length }; });
  console.log('3. service worker:', JSON.stringify(sw), '| manifiesto:', JSON.stringify(man));
  // 4. sin internet
  await p.reload(); await p.waitForTimeout(400);
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(800);
  console.log('4. sin internet abre:', (await p.innerText('main')).replace(/\n+/g, ' / ').slice(0, 120));
  await ctx.setOffline(false);
  // 5. copia de seguridad y restaurar en un equipo "nuevo"
  if (await p.$('text=‹ Obras')) await p.click('text=‹ Obras');
  console.log('5. panel:', (await p.innerText('text=📱 Datos en este dispositivo >> xpath=../..')).replace(/\n+/g, ' / ').slice(0, 260));
  await p.screenshot({ path: process.argv[2], fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=💾 Copia de seguridad').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  const copia = process.argv[2] + '.json'; await dl.saveAs(copia);
  console.log('   archivo:', dl.suggestedFilename());
  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const q = await ctx2.newPage();
  q.on('pageerror', e => errs.push('Q ' + e.message));
  q.on('dialog', d => { console.log('   [diálogo equipo 2] ' + d.message().replace(/\n+/g, ' | ')); d.accept(); });
  await q.goto(URL0); await q.waitForSelector('header.tv-header');
  await q.setInputFiles('input[type=file]', copia);
  await q.waitForTimeout(500);
  console.log('6. equipo nuevo tras restaurar:', (await q.innerText('main')).replace(/\n+/g, ' / ').slice(150, 330));
  await q.setInputFiles('input[type=file]', copia); await q.waitForTimeout(300);
  console.log('   restaurar dos veces no duplica:', await q.$$eval('main button', bs => bs.filter(b => b.innerText.startsWith('📁')).map(b => b.innerText.split('\n')[0])));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
