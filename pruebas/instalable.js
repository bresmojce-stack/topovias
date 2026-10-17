const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://localhost:8765/'); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(1500);
  const c = await p.context().newCDPSession(p);
  console.log('errores de instalación:', JSON.stringify(await c.send('Page.getInstallabilityErrors')));
  const m = await c.send('Page.getAppManifest');
  console.log('manifest errores:', JSON.stringify(m.errors), m.url);
  for (const f of ['icon-topo-192.png','icon-topo-512.png','icon-topo-maskable.png','manifest.json']) {
    const r = await p.evaluate(u => fetch(u).then(r => r.status + ' ' + r.headers.get('content-type')), f); console.log(f, r);
  }
  await b.close();
})();
