const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const W = process.argv[2];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ver = () => p.evaluate(() => TV_VERSION);
  await p.goto('http://localhost:8765/'); await p.waitForSelector('header.tv-header');
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForSelector('header.tv-header');
  console.log('1. versión inicial:', await ver(), '| controlado por SW:', await p.evaluate(() => !!navigator.serviceWorker.controller));
  // publicar versión 17
  fs.writeFileSync(W + '/index.html', fs.readFileSync(W + '/index.html', 'utf8').replace('const TV_VERSION = "35"', 'const TV_VERSION = "36"'));
  fs.writeFileSync(W + '/sw.js', fs.readFileSync(W + '/sw.js', 'utf8').replace('topovias-v35', 'topovias-v36'));
  // con la app abierta: buscar actualización → aviso
  await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  await p.waitForSelector('#tv-nueva-version', { timeout: 10000 }).catch(() => {});
  console.log('2. aviso con la app abierta:', await p.$eval('#tv-nueva-version', d => d.innerText.replace(/\n/g, ' ')).catch(() => 'NO'));
  await p.click('#tv-nueva-version button'); await p.waitForSelector('header.tv-header');
  console.log('3. tras tocar Actualizar:', await ver());
  // versión 18 publicada; abrir de nuevo (sin aviso): debe salir la nueva de una
  fs.writeFileSync(W + '/index.html', fs.readFileSync(W + '/index.html', 'utf8').replace('const TV_VERSION = "36"', 'const TV_VERSION = "35"'));
  await p.goto('http://localhost:8765/'); await p.waitForSelector('header.tv-header');
  console.log('4. al abrir con señal:', await ver());
  await ctx.setOffline(true);
  await p.goto('http://localhost:8765/').catch(e => console.log('err', e.message)); await p.waitForSelector('header.tv-header');
  console.log('5. sin señal abre:', await ver(), '| Datos:', await p.$$eval('main', m => m[0].innerText.split('\n').filter(t => /Versión/.test(t)).join(' ')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
