const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload(); await p.waitForSelector('header.tv-header');
  console.log('archivo compartido:', await p.evaluate(() => { const a = crearCopiaSeguridad([], []); const f = archivoParaCompartir(a); return f.name + ' ' + f.type; }));
  const copia = { app: 'TopoVias', version: 1, fecha: new Date().toISOString(), obras: [{ id: 9, nombre: 'Desde txt' }], vias: [] };
  fs.writeFileSync(process.argv[3] + '.txt', JSON.stringify(copia));
  await p.setInputFiles('input[type=file]', process.argv[3] + '.txt'); await p.waitForTimeout(400);
  console.log('obras tras restaurar .txt:', await p.$$eval('main', m => m[0].innerText.includes('Desde txt')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
