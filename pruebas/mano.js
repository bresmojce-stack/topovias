const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, isMobile: movil, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'A' }, { id: 6, nombre: 'B' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999)); localStorage.setItem('topovias_standalone', '[]'); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999)); });
  await p.reload(); await p.waitForSelector('header.tv-header');
  await p.click('button[data-herramienta=dibujo]'); await p.click('button:has-text("Crear el primer dibujo")'); await p.waitForTimeout(300);
  const n = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone')).find(v => v.libre).dibujos[0].objs.length);
  const svg = await p.$eval('.tv-dib-svg', s => { const r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const tap = async (fx, fy) => { const x = svg.x + svg.w * fx, y = svg.y + svg.h * fy; if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(300); };
  await tap(0.2, 0.3); await tap(0.6, 0.3); await p.waitForTimeout(900);
  const pos = () => p.$$eval('.tv-dib-svg line', ls => ls.map(l => Math.round(+l.getAttribute('x1'))).slice(-3).join(' '));
  console.log('objetos', await n(), 'línea en', await pos());
  await p.click('.tv-dib-mano'); await p.waitForTimeout(200);
  console.log('barra:', await p.$eval('.tv-dib-cmd span', s => s.innerText));
  const x0 = svg.x + svg.w * 0.5, y0 = svg.y + svg.h * 0.6;
  if (movil) {
    const cdp = await ctx.newCDPSession(p);
    const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    await tp('touchStart', x0, y0); for (let i = 1; i <= 10; i++) await tp('touchMove', x0 - 8 * i, y0 + 6 * i); await tp('touchEnd'); 
  } else { await p.mouse.move(x0, y0); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(x0 - 8 * i, y0 + 6 * i); await p.mouse.up(); }
  await p.waitForTimeout(300);
  console.log('tras arrastrar: objetos', await n(), 'línea en', await pos());
  await tap(0.3, 0.8); console.log('toque en modo mano: objetos', await n());
  await p.click('.tv-dib-mano'); await p.waitForTimeout(200);
  console.log('volvió a:', await p.$eval('.tv-dib-cmd span', s => s.innerText));
  await p.screenshot({ path: process.argv[3] + '.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
