const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  console.log(await p.evaluate(() => {
    const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di});
    const lat = {modo:"transversal",ancho:"3",modoT:"pendiente",pendienteT:"-2",tramos:[],absInicio:""};
    const t = generarTabla({ absInicio: "25.73", tramos: [T("964.055","","-0.9","88.05")], intermedias: [], capas: [], lateralIzq: lat, lateralDer: lat, parqueaderos: [] });
    const r = resolverTramo(T("965","964","2",""));
    return 'abscisas: ' + t.map(x => x.absFormato).join(', ') + '\nlat der con bombeo -2%: ' + t[0].cotaEje + ' → ' + t[0].cotaLatDer + '\ncotas bajan pero pendiente +2%: ' + JSON.stringify(r);
  }));
  await b.close();
})();
