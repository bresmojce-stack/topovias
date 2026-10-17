const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1140, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  await p.evaluate(() => {
    const T = (ci,pe,di) => ({cotaInicio:ci,cotaFin:"",pendiente:pe,distancia:di,id:Math.random()});
    const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T("","","")],absInicio:""};
    const mk = (ini, tr) => { const proy = { absInicio: ini, tramos: tr, intermedias:[], capas:[{nombre:"asfalto",espesor:"0.1"},{nombre:"base",espesor:"0.2"},{nombre:"sub base",espesor:"0.4"}], lateralIzq:lat, lateralDer:lat, parqueaderos:[], sobreancho:{} };
      const t = generarTabla(proy); const d = datosGraficos(proy, t); return svgPerfil(d).svg + svgPlanta(d).svg; };
    document.body.innerHTML = '<div style="background:#fff;width:1100px">' + mk("0", [T("965.39","-1.818","27.5"), T("964.89","2.033","29.18")]) + mk("25.73", [T("964.055","-0.9","88.05")]) + '</div>';
  });
  await p.screenshot({ path: process.argv[3], fullPage: true });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
