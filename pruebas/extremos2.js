// Casos con sobreancho a lo largo + parqueaderos (columna EXTREMOS del Excel)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const abrirVia = require('./abrir.js');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const PQ = (id, lado, ai, af, extra) => ({id, nombre:"Parq "+id, modo:"diferencia", lado, absInicio:ai, absFin:af, ancho:"5", sobreAncho:"0.5", saExtremos:"0.3", diferencia:"0.05", tramos:[T("","","","")], coords:[], estructura:"via", capas:[], ...extra});
  const base = (nombre, parqs, vols, tramos) => ({ id: 1, obraId: 5, nombre, absInicio: "0", tramos: tramos || [T("965.59","","-2","57.5")], intermedias: [],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2},{nombre:"subbase",espesor:"0.20",id:3,sobreancho:"general"},{nombre:"roca",espesor:"0.30",id:4,sobreancho:"propio",saIzq:"0.3",saDer:"0.25"}],
    sobreancho: { izq: "0.5", der: "0.4" }, lateralIzq: lat, lateralDer: lat, bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    parqueaderos: parqs, volumenes: vols });
  const casos = [
    base("A der en medio", [PQ(9,"derecho","10","25")], [{ id: 11, nombre: "subbase SA largo", fuenteSup: "tabla__rasante", fuenteInf: "tabla__subbase", saLongitudinal: true }]),
    base("B izq desde 0 y der hasta el fin", [PQ(9,"izquierdo","0","20"), PQ(8,"derecho","40","57.5")], [{ id: 11, nombre: "roca SA largo", fuenteSup: "tabla__rasante", fuenteInf: "tabla__roca", saLongitudinal: true }]),
    base("C escrito en volumen", [PQ(9,"derecho","5","30")], [{ id: 11, nombre: "escrito", fuenteSup: "tabla__rasante", fuenteInf: "tabla__base", saIzq: "0.6", saDer: "0.2", saLongitudinal: true }]),
    base("D antiguo un valor", [PQ(9,"derecho","10","25")], [{ id: 11, nombre: "antiguo", fuenteSup: "tabla__rasante", fuenteInf: "tabla__subbase", sobreAncho: "0.4" }]),
    base("E dos PI parq propio", [PQ(9,"derecho","15","45",{estructura:"propia",capas:[{nombre:"subbase",espesor:"0.25",id:1,sobreancho:"propio",saExt:"0.7"}]})], [{ id: 11, nombre: "dos PI", fuenteSup: "tabla__rasante", fuenteInf: "tabla__subbase", saLongitudinal: true }], [T("965.59","","-2","30"), T("","","1.5","27.5")]),
  ];
  for (const [i, pr] of casos.entries()) {
    await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
      localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
      localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
    await p.reload(); await abrirVia(p, pr.nombre);
    await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(200);
    await p.click('.tv-tabs button[data-tab=cant]'); await p.click('.tv-subvia button[data-sub=vol]'); await p.waitForTimeout(200);
    const app = await p.$$eval('main span', ss => ss.map(s => s.innerText).filter(t => /m³$/.test(t)));
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
    const f = process.argv[3] + '_' + i + '.xlsx'; await dl.saveAs(f);
    await p.click('text=Cerrar').catch(() => {});
    console.log(pr.nombre, '| app:', JSON.stringify(app), '|', f);
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
