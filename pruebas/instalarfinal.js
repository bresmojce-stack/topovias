// Botón "Instalar" al final de la pantalla cuando la app se abre en el navegador: sin aviso del navegador muestra el
// paso del menú; con el aviso (beforeinstallprompt simulado) abre la ventana de instalar y se quita al aceptar
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 390);
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: W, height: 844 }, isMobile: W < 600, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const btn = '.tv-instalar-final button';
  console.log('1. botón al final:', await p.locator(btn).count(), '|', await p.evaluate(s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top) > 300 : false; }, btn) ? 'abajo' : 'NO');
  await p.locator(btn).scrollIntoViewIfNeeded(); await p.click(btn);
  console.log('2. sin aviso del navegador:', (await p.locator('.tv-instalar-final [role=note]').innerText().catch(() => 'nada')).slice(0, 60));
  await p.screenshot({ path: process.argv[3] + '.png', fullPage: true });
  await p.evaluate(() => { const e = new Event('beforeinstallprompt'); window.__llamado = 0; e.prompt = () => { window.__llamado++; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
  await p.waitForTimeout(200); await p.click(btn); await p.waitForTimeout(300);
  console.log('3. con aviso: ventana abierta', await p.evaluate(() => window.__llamado), 'vez | botón después de aceptar:', await p.locator(btn).count());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
