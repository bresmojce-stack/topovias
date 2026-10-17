const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('dialog ' + d.message()); d.dismiss(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.03",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const pq = { id: 9, nombre: "Parq motos", ubicacion: "inicio", modo: "esquinas", desdeX: "3", desdeLado: "izq", hastaX: "3", hastaLado: "der", fondo: "5",
    esq: { A: "955.300", B: "955.256", C: "955.196", D: "955.240" }, lado: "derecho", sobreAncho: "0", tramos: [T("","","","")], coords: [] };
  const proj = { id: 1, nombre: "Eje 2", absInicio: "0", tramos: [T("955.226","955.19","","3"), T("955.19","955.44","","20.95")], intermedias: [],
    capas: [{nombre:"base",espesor:"0.15",id:1}], lateralIzq: lat, lateralDer: lat, parqueaderos: [pq],
    bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [{ id: 11, nombre: "Base", fuenteSup: "tabla__rasante", fuenteInf: "tabla__Excavación", sobreAncho: "0" }] };
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  const res = await p.evaluate(pr => { const t = generarTabla(pr);
    return { filas: t.filter(r => r.abs <= 0.001).map(r => [r.abs, r.fueraVia, r.cotaLatIzq, r.cotaEje, r.cotaLatDer, r.parqIzqCota, r.parqDerCota, (r.capas||[]).map(c => c.eje)].join(' | ')),
      parqs: proyCalc(pr).parqueaderos.map(q => q.id + ' ' + q.lado + ' ' + q.desde + '-' + q.hasta + ' abs ' + q.absInicio + '..' + q.absFin),
      vol: (v => [v.volTotal, (v.partes||v.secciones||[]).length])(calcVolumenTotal(pr.volumenes[0], pr, t)), areas: calcAreas(pr, t).parqs.map(x => x.nombre + ' ' + x.areaPlano) }; }, proj);
  console.log(JSON.stringify(res, null, 1));
  await p.click('.tv-subvia button[data-sub=parq]'); await p.waitForTimeout(300);
  await p.screenshot({ path: '../out/cab4_editor.png', fullPage: true });
  // traer cota de la vía en B tras calcular
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  await p.click('.tv-tabs button[data-tab=via]'); await p.click('.tv-subvia button[data-sub=parq]'); await p.waitForTimeout(200);
  await p.click('svg g:has(text:text-is("C"))'); await p.waitForTimeout(150);
  await p.click('button:has-text("Cota de la vía")'); await p.waitForTimeout(200);
  console.log('C tras traer:', await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].parqueaderos[0].esq.C));
  await p.click('.tv-subvia button[data-sub=plano]'); await p.waitForTimeout(400);
  const pl = await p.$$('main svg'); if (pl[1]) await pl[1].screenshot({ path: '../out/cab4_planta.png' });
  await p.click('button:has-text("Exportar")'); await p.waitForTimeout(500);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=💾 Guardar en el dispositivo')]);
  await dl.saveAs('../out/cab4.xlsx');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
