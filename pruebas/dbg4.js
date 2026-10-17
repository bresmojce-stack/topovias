const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  console.log(await p.evaluate(() => {
    const e = { id: 9, t: 'eje', v: [{ x: 1000, y: 1000 }, { x: 1100, y: 1000 }, { x: 1100, y: 1050 }], abs0: 5, paso: 10 };
    try { return JSON.stringify(paralela(e, 3.5, { x: 1060, y: 997.5 })); } catch (x) { return 'EXC ' + x.message; }
  }));
  await b.close();
})();
