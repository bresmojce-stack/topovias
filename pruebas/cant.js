const { chromium } = require('/opt/node-tools/node_modules/playwright');
async function leerXlsx(p, path) {
  return p.evaluate(async b64 => {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    return wb.worksheets.map(ws => { const filas = []; ws.eachRow({ includeEmpty: true }, (row, r) => { const f = []; row.eachCell({ includeEmpty: true }, (c, k) => { let v = c.value; if (v && typeof v === 'object' && 'result' in v) v = v.result; f[k - 1] = v == null ? '' : v; }); filas[r - 1] = f; }); return { nombre: ws.name, filas: Array.from(filas, f => f || []), formulas: (() => { const fs = []; ws.eachRow(row => row.eachCell(c => { if (c.formula) fs.push(c.address + '=' + c.formula); })); return fs; })() }; });
  }, require('fs').readFileSync(path).toString('base64'));
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const proj = { id: 1, nombre: "Vía A", absInicio: "0", tramos: [T("965.59","","-2","57.5")], intermedias: [],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.15",id:2},{nombre:"Roca",espesor:"0.20",id:3}],
    lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    lateralDer: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    parqueaderos: [{id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"0",absFin:"30",ancho:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
    bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    volumenes: [{ id: 11, nombre: "Exc 1", fuenteSup: "tabla__rasante", fuenteInf: "tabla__Base", sobreAncho: "0", concepto: "Excavación" },
                { id: 12, nombre: "Exc 2", fuenteSup: "tabla__rasante", fuenteInf: "tabla__Base", sobreAncho: "0", concepto: "excavación" },
                { id: 13, nombre: "Relleno", fuenteSup: "tabla__Base", fuenteInf: "tabla__Roca", sobreAncho: "0", concepto: "base" }] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); }, proj);
  await p.reload(); await p.waitForTimeout(400);
  const vol = await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('topovias_standalone'))[0]; const t = generarTabla(pr); return pr.volumenes.map(v => calcVolumen(v, pr, t).volTotal); });
  console.log('volúmenes individuales:', vol);
  await p.click('button:has-text("Cantidades")');
  const leer = async () => p.$$eval('main table tbody tr', trs => trs.map(tr => [...tr.cells].slice(0, 3).map(c => c.innerText).join(' | ')));
  console.log('A. calculada:', JSON.stringify(await leer()));
  await p.uncheck('label:has-text("Asfalto") input');
  await p.fill('input[placeholder="Nombre del ítem (ej. Geotextil)"]', 'Geotextil'); await p.click('text=+ Agregar');
  console.log('B. sin asfalto + geotextil:', JSON.stringify(await leer()));
  await p.fill('input[placeholder="495.000"]', '719.98');
  console.log('C. área escrita 719.98:', JSON.stringify(await leer()));
  await p.screenshot({ path: process.argv[3], fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  const path = process.argv[3] + '.xlsx'; await dl.saveAs(path);
  const todas = (await leerXlsx(p, path))[0].filas;
  const i = todas.findIndex(x => x[0] === '6. CANTIDADES DE LA VÍA');
  const rows = todas.slice(i, i + 8);
  rows.forEach(r => console.log('  xlsx', JSON.stringify(r.slice(0, 3))));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
