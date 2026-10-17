const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8767/topovias/'); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(1500);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(800);
  const sw = await p.evaluate(async () => ({ controla: !!navigator.serviceWorker.controller, scope: (await navigator.serviceWorker.getRegistration())?.scope, cache: await caches.keys() }));
  const man = await p.evaluate(async () => { const r = await fetch(document.querySelector('link[rel=manifest]').href); const j = await r.json(); return { ok: r.ok, start: new URL(j.start_url, r.url).href, iconos: j.icons.length }; });
  console.log('service worker:', JSON.stringify(sw)); console.log('manifiesto:', JSON.stringify(man));
  await ctx.setOffline(true); await p.reload(); await p.waitForSelector('header.tv-header');
  console.log('sin internet abre:', (await p.innerText('header')).replace(/\n/g, ' '));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
