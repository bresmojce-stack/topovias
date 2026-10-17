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
  const X = fx => svg.x + svg.w * fx, Y = fy => svg.y + svg.h * fy;
  const tap = async (fx, fy) => { if (movil) await p.touchscreen.tap(X(fx), Y(fy)); else await p.mouse.click(X(fx), Y(fy)); await p.waitForTimeout(250); };
  const arrastrar = async (a, b, c, d) => {
    if (movil) { const cdp = await ctx.newCDPSession(p); const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
      await tp('touchStart', X(a), Y(b)); for (let i = 1; i <= 8; i++) await tp('touchMove', X(a + (c - a) * i / 8), Y(b + (d - b) * i / 8)); await tp('touchEnd'); }
    else { await p.mouse.move(X(a), Y(b)); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(X(a + (c - a) * i / 8), Y(b + (d - b) * i / 8)); await p.mouse.up(); }
    await p.waitForTimeout(300); };
  // un cuadrado hecho con 4 líneas sueltas y un círculo aparte
  const P = [[0.3, 0.3], [0.6, 0.3], [0.6, 0.6], [0.3, 0.6]];
  for (let i = 0; i < 4; i++) { await tap(...P[i]); await tap(...P[(i + 1) % 4]); await p.waitForTimeout(850); }
  await p.click('.tv-dib-nav button[data-grupo=dibujar]'); await p.click('.tv-dib-hoja button[data-herr="circulo"]');
  await tap(0.8, 0.8); await tap(0.85, 0.8); await p.waitForTimeout(850);
  console.log('dibujados:', (await objs()).map(o => o.t).join(','));
  await p.click('.tv-dib-nav button[data-grupo=editar]'); await p.click('.tv-dib-hoja button[data-herr="seleccionar"]');
  console.log('barra:', await p.$eval('.tv-dib-cmd span', s => s.innerText));
  // recuadro que encierra las 4 líneas pero no el círculo
  await arrastrar(0.25, 0.25, 0.66, 0.66);
  console.log('tras recuadro:', await p.$eval('.tv-dib-cmd span', s => s.innerText));
  await p.screenshot({ path: process.argv[3] + '_sel.png' });
  await p.click('.tv-dib-cmd button:has-text("Color")'); await p.click('.tv-dib-paleta button[data-color="#DC2626"]'); await p.waitForTimeout(300);
  console.log('colores:', (await objs()).map(o => o.t + ':' + (o.col || '-')).join(','));
  await p.click('.tv-dib-cmd button:has-text("Unir")'); await p.waitForTimeout(400);
  const o2 = await objs(); console.log('tras unir:', o2.map(o => o.t + (o.c ? '(cerrada)' : '') + ':' + (o.col || '-')).join(','));
  console.log('aviso/área:', await p.evaluate(() => (document.body.innerText.match(/ÁREA Y PERÍMETRO[\s\S]{0,60}/) || [''])[0].replace(/\n/g, ' ')));
  // tocar el círculo y la figura, y borrar los dos
  await p.click('.tv-dib-nav button[data-grupo=editar]'); await p.click('.tv-dib-hoja button[data-herr="seleccionar"]');
  await tap(0.85, 0.8); await tap(0.3, 0.45);
  console.log('tocando:', await p.$eval('.tv-dib-cmd span', s => s.innerText));
  await p.click('.tv-dib-cmd button:has-text("Borrar")'); await p.waitForTimeout(300);
  console.log('tras borrar:', (await objs()).length);
  await p.click('.tv-dib-deshacer button[data-accion=deshacer]'); await p.waitForTimeout(300);
  console.log('deshacer devuelve:', (await objs()).length);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
