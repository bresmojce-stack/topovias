const { chromium } = require('/opt/node-tools/node_modules/playwright');
async function leerXlsx(p, path) {
  return p.evaluate(async b64 => {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    return wb.worksheets.map(ws => { const filas = []; ws.eachRow({ includeEmpty: true }, (row, r) => { const f = []; row.eachCell({ includeEmpty: true }, (c, k) => { let v = c.value; if (v && typeof v === 'object' && 'result' in v) v = v.result; f[k - 1] = v == null ? '' : v; }); filas[r - 1] = f; }); return { filas: Array.from(filas, f => f || []) }; });
  }, require('fs').readFileSync(path).toString('base64'));
}
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: W, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const proj = { id: 1, nombre: "EJE 7", absInicio: "0", tramos: [T("100","","-1","100")], intermedias: [],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.20",id:2}], lateralIzq: lat, lateralDer: {...lat},
    parqueaderos: [{id:9,nombre:"Parq A",modo:"diferencia",lado:"derecho",absInicio:"40",absFin:"60",ancho:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]},
      {id:10,nombre:"Cab",modo:"diferencia",ubicacion:"inicio",lado:"izquierdo",desde:"0",hasta:"3",fondo:"5",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
    sardinel: { activo: true, corona: "0.15", pata: "0.20", altura: "0.45", revelado: "0.15", lados: { izq: true, der: true, ini: true, fin: true },
      sin: [{ id: 1, lado: "izq", desde: "55", hasta: "70", motivo: "empalme Vía 2" }],
      ejecutado: [{ id: 2, lado: "izq", desde: "0", hasta: "30", fecha: "2026-10-10" }, { id: 3, lado: "der", desde: "0", hasta: "50", fecha: "2026-10-12" },
        { id: 4, lado: "pq:9", desde: "40", hasta: "50", fecha: "2026-10-14" }, { id: 5, lado: "izq", desde: "20", hasta: "60", fecha: "2026-10-15" }] },
    bmEstaciones: [{id:1,cotaBM:"101",vistaMas:"1.5",absDesde:"-10",absHasta:"200"}], nivelaciones: [], coordsEje: [], volumenes: [] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('topovias_standalone'))[0]; const s = calcSardinel(pr); const t = generarTabla(pr);
    return { lados: s.lados.map(l => [l.nombre, l.total, l.ejec, l.falta]), total: s.total, ejec: s.ejec, area: s.areaSec, vol: s.vol, tramos: s.tramos.map(t => t.ml),
      cor: t.filter(x => [-5, 0, 30, 50, 60, 100].includes(x.abs)).map(x => [x.absFormato, JSON.stringify(x.corona), 'latI', x.cotaLatIzq, 'latD', x.cotaLatDer, 'pD', x.parqDerCota]) }; });
  console.log(JSON.stringify(r, null, 0).replace(/\],\[/g, '],\n ['));
  await (p.click('.tv-tabs button[data-tab=via]'), p.click('.tv-subvia button[data-sub=sard]')); await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[3] + '_tab.png', fullPage: true });
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(400);
  await p.screenshot({ path: process.argv[3] + '_cotas.png' });
  await p.click('.tv-subvia button[data-sub=lec]'); await p.waitForTimeout(200);
  await p.selectOption('select:near(:text("Capa a leer"))', '__corona__').catch(e => errs.push('sel ' + e.message));
  await p.waitForTimeout(200);
  const lect = await p.evaluate(() => { const tb = [...document.querySelectorAll('table')].pop(); return [...tb.querySelectorAll('tr')].slice(0, 6).map(tr => tr.innerText.replace(/\s+/g, ' ')); });
  console.log('lecturas corona:', JSON.stringify(lect));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  const path = process.argv[3] + '.xlsx'; await dl.saveAs(path);
  const todas = (await leerXlsx(p, path))[0].filas.filter(r => r.some(v => v !== ''));
  const i0 = todas.findIndex(r => r[0] === 'SARDINEL (METROS LINEALES)');
  todas.slice(i0, i0 + 16).forEach(r => console.log('  xlsx', JSON.stringify(r.filter(v => v !== ''))));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
