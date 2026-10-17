const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const errs = [];
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const base = { absInicio: "0", tramos: [T("965.59","","-2","57.5")], intermedias: [], lateralIzq: lat, lateralDer: lat, bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [] };
  const capas = [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2},{nombre:"subbase",espesor:"0.20",id:3,sobreancho:"general"},{nombre:"roca",espesor:"0.30",id:4,sobreancho:"propio",saIzq:"0.3",saDer:"0.25"}];
  const parq = (extra) => ({id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"10",absFin:"25",ancho:"5",sobreAncho:"0.5",saExtremos:"0.3",diferencia:"0.05",tramos:[T("","","","")],coords:[],estructura:"via",capas:[], ...extra});
  const casos = [
    { ...base, id: 1, nombre: "A sobreanchos", capas, sobreancho: { izq: "0.5", der: "0.4" }, parqueaderos: [parq({})], cantidades: { capasExcluidas: ["asfalto"] },
      volumenes: [{ id: 11, nombre: "relleno", fuenteSup: "tabla__base", fuenteInf: "tabla__subbase", concepto: "base" }, { id: 12, nombre: "Exc", fuenteSup: "tabla__rasante", fuenteInf: "tabla__Excavación" }] },
    { ...base, id: 2, nombre: "B parq propia", capas, sobreancho: { izq: "0.5", der: "0.4" },
      parqueaderos: [parq({ lado: "izquierdo", estructura: "propia", capas: [{nombre:"Concreto",espesor:"0.15",id:5,sobreancho:"general"},{nombre:"base",espesor:"0.10",id:6},{nombre:"roca",espesor:"0.2",id:7,sobreancho:"propio",saExt:"0.35"}] })],
      volumenes: [] },
    { ...base, id: 3, nombre: "C area manual", capas, sobreancho: { izq: "0.5", der: "0.4" }, parqueaderos: [parq({})],
      cantidades: { areaManual: "719.98", extras: [{ id: 1, nombre: "Geotextil" }] }, volumenes: [{ id: 13, nombre: "Exc", fuenteSup: "tabla__rasante", fuenteInf: "tabla__roca" }] },
    { ...base, id: 4, nombre: "D sin nada", capas: [{nombre:"base",espesor:"0.15",id:2}], parqueaderos: [], volumenes: [] }
  ];
  for (const c of casos) {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(c.nombre + ' ' + e.message));
    p.on('dialog', d => { errs.push('dialog ' + d.message()); d.dismiss(); });
    await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
    await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); return TVDB.set('topovias_standalone', [pr]); }, c);
    await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
    await dl.saveAs(process.argv[3] + '_' + c.id + '.xlsx');
    await p.close();
  }
  console.log(errs.join('\n') || 'exportados sin errores');
  await b.close();
})();
