const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const r = await p.evaluate(() => {
    const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:1});
    const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
    const base = { absInicio: "2.5", tramos: [T("100","","1","27.5"), T("","","-1","31")], intermedias: [{valor:"34.6"}], capas: [{nombre:"base",espesor:"0.15"}], lateralIzq: lat, lateralDer: lat, parqueaderos: [],
      nivelaciones: [{ id: 1, nombre: "TN", estaciones: [], lecturas: [{abs: 7.5, eje: "1.2"}, {abs: 15, eje: "1.3"}, {abs: 25, eje: "", izq: "", der: ""}, {abs: 35, eje: " "}, {abs: 45, der: "1.1"}] }] };
    base.tramos[1].cotaInicio = "100.275";
    const ab = pr => generarTabla(pr).map(x => x.abs).join(' ');
    return { p5: ab(base), p10: ab({ ...base, paso: "10" }), p20: ab({ ...base, paso: "20" }), p25: ab({ ...base, paso: "2.5" }) };
  });
  console.log(JSON.stringify(r, null, 1));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
