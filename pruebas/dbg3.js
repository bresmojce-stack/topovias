const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  console.log(await p.evaluate(() => {
    const e = { t: 'eje', v: [{ x: 1000, y: 1000 }, { x: 1100, y: 1000 }, { x: 1100, y: 1050 }], abs0: 5, paso: 10 };
    return JSON.stringify([leerAbscisa('0+125'), leerAbscisa('55.5'), EJE.punto(e, 125, -2), EJE.punto(e, 55.5, 1.5)]);
  }));
  await b.close();
})();
