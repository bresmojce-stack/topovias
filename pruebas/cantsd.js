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
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  await p.click('.tv-tabs button[data-tab=cant]'); await p.waitForTimeout(200);
  await p.click('.tv-subvia button:has-text("Cantidades")').catch(() => {}); await p.waitForTimeout(300);
  const tb = p.locator('table').last(); await tb.scrollIntoViewIfNeeded(); await tb.screenshot({ path: '../out/cant_sd.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
