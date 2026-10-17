const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, isMobile: movil, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'A' }, { id: 6, nombre: 'B' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999)); localStorage.setItem('topovias_standalone', '[]'); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999)); });
  await p.reload(); await p.waitForSelector('header.tv-header');
  await p.click('button[data-herramienta=dibujo]'); await p.click('button:has-text("Crear el primer dibujo")'); await p.waitForTimeout(300);
  const n = () => p.evaluate(() => { const l = JSON.parse(localStorage.getItem('topovias_standalone')).find(v => v.libre); return l ? l.dibujos[0].objs.length : -1; });
  const svg = await p.$eval('.tv-dib-svg', s => { const r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const tap = async (fx, fy) => { const x = svg.x + svg.w * fx, y = svg.y + svg.h * fy; if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(300); };
  // dos líneas (con pausa: cada una es un paso de deshacer)
  await tap(0.2, 0.3); await tap(0.6, 0.3); await p.waitForTimeout(900); await tap(0.2, 0.5); await tap(0.6, 0.5); await p.waitForTimeout(900);
  console.log('dibujadas:', await n());
  console.log('botón visible:', await p.$eval('.tv-dib-deshacer', d => d.innerText.replace(/\n/g, ' ')));
  await p.click('.tv-dib-deshacer button[data-accion=deshacer]'); await p.waitForTimeout(300); console.log('botón ↶ →', await n());
  if (!movil) { await p.keyboard.press('Control+z'); await p.waitForTimeout(300); console.log('Ctrl+Z →', await n()); await p.keyboard.press('Control+y'); await p.waitForTimeout(300); console.log('Ctrl+Y →', await n()); }
  // a mitad de una polilínea: deshacer quita el último punto (no borra otra cosa)
  await p.click('.tv-dib-nav button[data-grupo=dibujar]'); await p.click('.tv-dib-hoja button[data-herr="polilinea"]');
  await tap(0.2, 0.7); await tap(0.4, 0.75); await tap(0.6, 0.7);
  const antes = await n(); await p.click('.tv-dib-deshacer button[data-accion=deshacer]'); await p.waitForTimeout(300);
  const btn = await p.$eval('.tv-dib-deshacer', d => d.innerText.replace(/\n/g, ' '));
  await p.click('.tv-dib-deshacer button[data-accion=deshacer]'); await p.waitForTimeout(300);
  console.log('polilínea a medias (3 puntos), botón decía «' + btn + '» → objetos', antes, '→', await n(), '| barra:', await p.$eval('.tv-dib-cmd span', s => s.innerText));
  if (!movil) { await p.keyboard.press('Control+z'); await p.waitForTimeout(200); console.log('   Ctrl+Z quita otro punto:', await p.$eval('.tv-dib-cmd span', s => s.innerText), '| objetos', await n()); }
  await p.keyboard.press('Escape').catch(() => {}); await p.click('.tv-dib-cmd button:has-text("Cancelar")').catch(() => {});
  await p.click('.tv-dib-nav button[data-grupo=editar]'); await p.click('.tv-dib-hoja button[data-herr="@deshacer"]'); await p.waitForTimeout(300);
  console.log('Editar → Deshacer (sin operación a medias):', await n());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
