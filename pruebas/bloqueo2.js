const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  console.log(await p.evaluate(() => {
    const A = { id: 1, nombre: 'A', bloqueada: true, x: 1 }, B = { id: 2, nombre: 'B', x: 1 };
    const prev = [A, B];
    const r = [];
    r.push(protegerBloqueadas(prev, [{ ...A, x: 2 }, { ...B, x: 2 }]).map(v => v.x).join());   // 1,2
    r.push(protegerBloqueadas(prev, [B]).map(v => v.nombre).join());                          // A,B
    r.push(protegerBloqueadas(prev, [{ ...A, bloqueada: false }, B])[0].bloqueada);            // false
    r.push(protegerBloqueadas(prev, [{ ...A, x: 3 }, B]) === prev);                            // true
    return r.join(' | ');
  }));
  await p.screenshot({ path: process.argv[3] + '_390.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
