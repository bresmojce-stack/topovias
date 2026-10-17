const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +process.env.W, height: 700 } });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const pr = { id: 1, obraId: 5, nombre: "EJE 7", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [], bloqueada: true };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
  await p.reload(); await p.waitForSelector('.tv-banner-bloqueo'); await p.waitForTimeout(300);
  await p.click('main input[placeholder="Ej. EJE 7"]'); await p.keyboard.type('x');
  await p.click('main button:has-text("Tramo")').catch(()=>{}); await p.waitForTimeout(200);
  await p.click('main button:has-text("Agregar capa")'); await p.evaluate(() => window.scrollTo(0,0)); await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[3] });
  await b.close();
})();
