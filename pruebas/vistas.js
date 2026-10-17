const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, m] of [[1280, 900, false], [390, 844, true]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
    const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
    const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
    const est = { id: 1, nombre: "Est. 1", cotaBM: "967", vistaMas: "1", fecha: "2026-10-13" };
    const tabla0 = [0,5,10,15,20,25,27.5,30,35,40,45,50,55,57.5];
    const proj = { id: 1, obraId: 5, nombre: "EJE 7", absInicio: "0", tramos: [T("965.59","","-2","27.5"), T("965.04","","2","30")], intermedias: [],
      capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2},{nombre:"subbase",espesor:"0.2",id:3,sobreancho:"general"}], sobreancho:{izq:"0.5",der:"0.5"}, lateralIzq: lat, lateralDer: lat,
      parqueaderos: [{id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"10",absFin:"25",ancho:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
      nivelaciones: [{ id: 21, tipo: "tn", nombre: "Terreno natural", estaciones: [est], lecturas: tabla0.map((a,i) => ({abs:a, sub:0, estacionId: i?null:1, der:"1.2", eje:"1.1", izq:"1.25", parqDer: a>=10&&a<=25?"1.3":"", fecha:"2026-10-13"})) }],
      volumenes: [{ id: 31, tipo: "excavacion", nombre: "Excavación", fuenteSup: "nivel__21", fuenteTeorica: "tabla__Excavación", fuenteInf: "", materialRelleno: "" }] };
    await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Carambolo'}])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); localStorage.setItem('topovias_standalone__t', String(Date.now() + 100000)); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 100000)); }, proj);
    await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
    for (const t of ['resultado','plano','nivel','vol','cant','parq']) {
      await p.click(`.tv-tabs button[data-tab=${t}]`); await p.waitForTimeout(400);
      await p.screenshot({ path: `${process.argv[3]}_${w}_${t}.png`, fullPage: false });
    }
    await p.click('.tv-volver'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${process.argv[3]}_${w}_obra.png` });
    console.log(w, errs.join('\n') || 'no errors');
  }
  await b.close();
})();
