const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, isMobile: movil, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'A' }, { id: 6, nombre: 'B' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999)); localStorage.setItem('topovias_standalone', '[]'); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999)); });
  await p.reload(); await p.waitForSelector('header.tv-header');
  await p.click('button[data-herramienta=dibujo]'); await p.click('button:has-text("Crear el primer dibujo")'); await p.waitForTimeout(300);
  const objs = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone')).find(v => v.libre).dibujos[0].objs);
  const svg = await p.$eval('.tv-dib-svg', s => { const r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const tap = async (fx, fy) => { const x = svg.x + svg.w * fx, y = svg.y + svg.h * fy; if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(300); };
  await tap(0.2, 0.3); await tap(0.6, 0.3); await p.waitForTimeout(900);
  const l = (await objs())[0]; console.log('línea fin:', l.b.x.toFixed(3), l.b.y.toFixed(3));
  await p.click('.tv-dib-nav button[data-grupo=medir]'); await p.screenshot({ path: process.argv[3] + '_hoja.png' });
  await p.click('.tv-dib-hoja button[data-herr="idcoord"]');
  console.log('barra:', await p.$eval('.tv-dib-cmd span', s => s.innerText));
  await tap(0.601, 0.302);   // cerca del extremo: el imán lo agarra
  const panel = await p.evaluate(() => document.body.innerText.match(/COORDENADA DEL PUNTO[\s\S]{0,120}/));
  console.log('panel:', panel && panel[0].replace(/\n/g, ' | '));
  await p.screenshot({ path: process.argv[3] + '_res.png' });
  await p.click('button:has-text("Anotar en el dibujo")'); await p.waitForTimeout(300);
  const o = await objs(); console.log('objetos:', o.length, JSON.stringify(o[o.length - 1]));
  await p.screenshot({ path: process.argv[3] + '_anot.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
