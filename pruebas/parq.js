const { chromium } = require('/opt/node-tools/node_modules/playwright');
async function leerXlsx(p, path) {
  return p.evaluate(async b64 => {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    return wb.worksheets.map(ws => { const filas = []; ws.eachRow({ includeEmpty: true }, (row, r) => { const f = []; row.eachCell({ includeEmpty: true }, (c, k) => { let v = c.value; if (v && typeof v === 'object' && 'result' in v) v = v.result; f[k - 1] = v == null ? '' : v; }); filas[r - 1] = f; }); return { nombre: ws.name, filas: Array.from(filas, f => f || []), formulas: (() => { const fs = []; ws.eachRow(row => row.eachCell(c => { if (c.formula) fs.push(c.address + '=' + c.formula); })); return fs; })() }; });
  }, require('fs').readFileSync(path).toString('base64'));
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const proj = { id: 1, nombre: "EJE 7", absInicio: "0", tramos: [T("100","","-2","30")], intermedias: [],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.20",id:2},{nombre:"Subbase",espesor:"0.30",id:3}],
    lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    lateralDer: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    parqueaderos: [{id:9,nombre:"Parq A",modo:"diferencia",lado:"derecho",absInicio:"10",absFin:"20",ancho:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
    bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForTimeout(500);
  // UI: estructura propia del parqueadero
  await (p.click('.tv-tabs button[data-tab=via]'), p.click('.tv-subvia button[data-sub=parq]'));
  await p.selectOption('select:near(:text("Estructura del parqueadero"))', 'propia');
  await p.fill('input[placeholder="Concreto, Base, Sub-base…"]', 'Concreto');
  await p.fill('input[placeholder="ej. 0.150"]', '0.15');
  await p.click('text=+ Agregar capa >> nth=-1');
  await p.fill('input[placeholder="Concreto, Base, Sub-base…"] >> nth=1', 'base');
  await p.fill('input[placeholder="ej. 0.150"] >> nth=1', '0.15');
  console.log('excav parq label:', await p.innerText('text=/Excavación parqueadero/'));
  await p.screenshot({ path: process.argv[3] + '_parq.png', fullPage: true });
  await p.click('button:has-text("CALCULAR")');
  const t = await p.evaluate(() => generarTabla(JSON.parse(localStorage.getItem('topovias_standalone'))[0]));
  const r = t.find(x => x.abs === 15);
  console.log('abs 15 eje', r.cotaEje, 'latDer', r.cotaLatDer, 'parqDer', r.parqDerCota);
  r.capas.forEach(c => console.log(' ', c.nombre.padEnd(10), c.esOculta ? '(oculta)' : '        ', 'eje', c.eje, 'der', c.der, 'parqDer', c.parqDer));
  const r5 = t.find(x => x.abs === 5);
  console.log('abs 5 (sin parq):', r5.capas.map(c => c.nombre + ':' + c.parqDer).join(' '));
  const hdr = await p.$$eval('table thead tr:first-child th', ths => ths.map(t => t.innerText.replace(/\s+/g,' ')));
  console.log('encabezados tabla:', JSON.stringify(hdr));
  await p.screenshot({ path: process.argv[3] + '_tabla.png' });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  const path = process.argv[3] + '.xlsx'; await dl.saveAs(path);
  const todas = (await leerXlsx(p, path))[0].filas.filter(r => r.some(v => v !== ''));
  const i0 = todas.findIndex(r => r[0] === '2. ESTRUCTURA DE LA VÍA');
  const rows = todas.slice(i0, i0 + 15).map(r => r.filter(v => v !== ''));
  rows.forEach(r => console.log('  xlsx', JSON.stringify(r)));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
