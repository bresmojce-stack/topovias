const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 800 } });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  // arco superior (0→180°: hacia el norte) y arco de un cuarto (270°→360°: abajo a la derecha)
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    dibujos: [{ id: 7, nombre: "A", sig: 1, objs: [{ id: 1, t: "ar", c: { x: 0, y: 0 }, r: 10, a1: 0, a2: Math.PI }, { id: 2, t: "ar", c: { x: 30, y: 0 }, r: 10, a1: 1.5 * Math.PI, a2: 2 * Math.PI }] }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'O'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(500);
  const cajas = await p.$$eval('.tv-dib-svg path', ps => ps.map(x => { const r = x.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }));
  // centro del primer arco en pantalla: punto medio de sus extremos (está en el borde inferior de la caja si el arco va hacia arriba)
  console.log('cajas [x,y,ancho,alto]:', JSON.stringify(cajas));
  console.log('arco 1 va hacia el norte (alto ≈ mitad del ancho):', Math.abs(cajas[0][3] - cajas[0][2] / 2) < 3);
  console.log('arco 2 (cuarto abajo a la derecha) más bajo que el arco 1:', cajas[1][1] > cajas[0][1] + cajas[0][3] - 3);
  await p.screenshot({ path: process.argv[3] }); await b.close();
})();
