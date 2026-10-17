const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const dlg = []; p.on('dialog', d => { dlg.push(d.message()); d.accept(); });
  await p.addInitScript(() => {
    navigator.canShare = () => true;
    window.__compartido = [];
    navigator.share = async d => { window.__compartido.push(d.files.map(f => f.name + ' ' + f.type)); if (window.__falla) { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; } };
  });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  await p.click('button:has-text("Copia de seguridad")');
  await p.click('button:has-text("Compartir")'); await p.waitForTimeout(300);
  console.log('compartir OK →', JSON.stringify(await p.evaluate(() => window.__compartido)), '| diálogos:', dlg.length);
  await p.evaluate(() => window.__falla = true);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Compartir")')]);
  await p.waitForTimeout(300);
  console.log('compartir falla → descarga:', dl.suggestedFilename(), '\n  aviso:', dlg[0]);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
