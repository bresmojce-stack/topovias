// Calculadora → Distancia entre coordenadas y Coordenadas de un punto: solo Norte y Este (la cota se esconde con
// CALC_CON_COTA = false); distancia, azimut y rumbo no cambian y una cota guardada de antes no saca desnivel
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 390);
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: W, height: 844 }, isMobile: W < 600, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  // un punto guardado de antes, con cota
  await p.evaluate(() => localStorage.setItem('topovias_standalone_calcCoords', JSON.stringify([{ id: 1, norte: "1000", este: "1000", cota: "100" }, { id: 2, norte: "1030", este: "1040", cota: "103" }])));
  await p.reload(); await p.waitForSelector('header.tv-header');
  await p.click('main button:has-text("Calculadora")'); await p.waitForTimeout(300);
  await p.click('button:has-text("Distancia entre coordenadas")'); await p.waitForTimeout(300);
  console.log('1. columnas:', await p.$$eval('.tv-calc-punto', f => f[0].querySelectorAll('input').length), 'campos por punto | cota visible:', await p.locator('input[placeholder="Cota"]').count());
  console.log('2. cálculo:', (await p.$$eval('.tv-calc-tramo', t => t[0].innerText.replace(/\n/g, ' | '))).slice(0, 200));
  console.log('3. desnivel/pendiente:', /Desnivel|Pendiente/.test(await p.$eval('.tv-calc-tramo', t => t.innerText)) ? 'SALEN' : 'no salen');
  console.log('4. cabe sin desbordar:', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await p.screenshot({ path: process.argv[3] + '.png' });
  await p.click('button:has-text("Coordenadas de un punto")'); await p.waitForTimeout(300);
  console.log('5. punto nuevo: campos de cota:', await p.locator('text=Cota (opcional)').count(), '| desnivel:', await p.locator('text=Desnivel (opcional').count());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
