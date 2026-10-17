const { chromium } = require('/opt/node-tools/node_modules/playwright');
async function leerXlsx(p, path) {
  return p.evaluate(async b64 => {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    return wb.worksheets.map(ws => { const filas = []; ws.eachRow({ includeEmpty: true }, (row, r) => { const f = []; row.eachCell({ includeEmpty: true }, (c, k) => { let v = c.value; if (v && typeof v === 'object' && 'result' in v) v = v.result; f[k - 1] = v == null ? '' : v; }); filas[r - 1] = f; }); return { nombre: ws.name, filas: Array.from(filas, f => f || []), formulas: (() => { const fs = []; ws.eachRow(row => row.eachCell(c => { if (c.formula) fs.push(c.address + '=' + c.formula); })); return fs; })() }; });
  }, require('fs').readFileSync(path).toString('base64'));
}

const file = process.argv[2], tag = process.argv[3], out = process.argv[4];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  p.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
  await p.goto('file://' + file); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const proj = {
    id: 1, nombre: "EJE 7", absInicio: "0",
    tramos: [T("965.390","","-1.820","27.5"), T("964.890","965.500","","30")],
    intermedias: [{valor:"12.3"}],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.20",id:2},{nombre:"Subbase",espesor:"0.30",id:3}],
    lateralIzq: {modo:"transversal",ancho:"3",modoT:"pendiente",diferencia:"",pendienteT:"-2",tramos:[T("","","","")],absInicio:""},
    lateralDer: {modo:"transversal",ancho:"3.5",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
    parqueaderos: [{id:9,nombre:"Parq A",modo:"diferencia",lado:"derecho",absInicio:"10",absFin:"25",ancho:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
    bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: []
  };
  // nivelación de terreno natural: lecturas guardadas con abs (formato nuevo) o por índice (formato antiguo)
  await p.evaluate(pr => { (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))); }, proj);
  await p.reload(); await p.waitForTimeout(800);
  // calcular
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  const tabla = await p.evaluate(() => generarTabla(JSON.parse(localStorage.getItem('topovias_standalone'))[0]));
  console.log(tag, 'rows', tabla.length, 'first', tabla[0].absFormato, tabla[0].cotaEje, 'last', tabla.at(-1).absFormato, tabla.at(-1).cotaEje);
  // add nivelacion via UI state directly (lecturas by index, legacy style)
  await p.evaluate(rows => {
    const ps = JSON.parse(localStorage.getItem('topovias_standalone'));
    ps[0].nivelaciones = [{ id: 5, nombre: "TN", estaciones: [{id: 7, nombre: "Est. 1", cotaBM: "966", vistaMas: "1.5"}],
      lecturas: rows.map((r, i) => ({ estacionId: i === 0 ? 7 : null, parqDer: r.parqDerCota != null ? "1.8" : "", der: "1.9", eje: "1.7", izq: "1.95", parqIzq: "" })) }];
    ps[0].volumenes = [{ id: 11, nombre: "Excavación", fuenteSup: "nivel__5", fuenteInf: "tabla__rasante", sobreAncho: "0.5" },
                       { id: 12, nombre: "Rasante vs Base", fuenteSup: "tabla__rasante", fuenteInf: "tabla__Base", sobreAncho: "0" }];
    localStorage.setItem('topovias_standalone', JSON.stringify(ps));
    return TVDB.set('topovias_standalone', ps);
  }, tabla);
  await p.reload(); await p.waitForTimeout(800);
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  await (p.click('.tv-tabs button[data-tab=cant]'), p.click('.tv-subvia button[data-sub=vol]')); await p.waitForTimeout(500);
  const totals = await p.$$eval('span', ss => ss.map(s => s.innerText).filter(t => /m³$/.test(t)));
  console.log(tag, 'vol totals on screen', JSON.stringify(totals));
  const ejeCol = await p.$$eval('table', ts => { const t = ts[1]; if (!t) return null; return [...t.querySelectorAll('tbody tr')].slice(0,3).map(tr => [...tr.cells].map(c => c.innerText).join(' | ')); });
  console.log(tag, 'vol2 rows', JSON.stringify(ejeCol));
  await p.screenshot({ path: out + '_vol.png', fullPage: true });
  for (const t of ['resultado','nivel','via','verif','memoria','cant','dibujo']) {
    await p.click(`.tv-tabs button[data-tab=${t}]`); await p.waitForTimeout(200);
  }
  await (p.click('.tv-tabs button[data-tab=via]'), p.click('.tv-subvia button[data-sub=plano]')); await p.waitForTimeout(200);
  await p.screenshot({ path: out + '_plano.png', fullPage: true });
  await p.click('.tv-tabs button[data-tab=resultado]'); await p.waitForTimeout(200);
  await p.screenshot({ path: out + '_tabla.png' });
  // export
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  if (dl) {
    const path = out + '.xlsx'; await dl.saveAs(path);
    const hojas = await leerXlsx(p, path);
    const rows = hojas[0].filas;
    const info = { sheets: hojas.map(h => h.nombre), head: rows.filter(r => r.some(v => v !== '')).slice(0, 5), vol: rows.filter(r => r[0] === 'TOTAL' || r[1] === 'TOTAL GENERAL').map(r => r.slice(0, 4)), f: hojas[0].formulas.slice(0, 4) };
    console.log(tag, 'xlsx', JSON.stringify(info));
  } else console.log(tag, 'no download');
  console.log(tag, errs.join('\n') || 'no errors');
  await b.close();
})();
