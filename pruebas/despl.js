const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1100);
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: W, height: 900 }, isMobile: W < 600, hasTouch: W < 600 });
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { console.log('dialog: ' + d.message().split('\n')[0]); d.accept(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const proj = await p.evaluate(() => {
    const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()}); const g = Math.PI / 180 * 21;
    return { ...proyVacio(), id: 1, nombre: "Parqs", absInicio: "0", tramos: [T("965.59","","-2","27.5"), T("965.04","","-1.5","31")],
      capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}],
      coordsEje: [{norte:"1000",este:"1000"},{norte:"1000",este:"1027.5"},{norte:String(1000+31*Math.sin(g)),este:String(1027.5+31*Math.cos(g))}],
      lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""},
      lateralDer: {modo:"longitudinal",ancho:"3",absInicio:"",tramos:[T("965.53","","-2","28.6"), T("964.958","964.5","","32.2")]},
      parqueaderos: [
        {id:9,nombre:"P-1",modo:"diferencia",ubicacion:"lateral",lado:"derecho",absInicio:"15",absFin:"40",ancho:"5",sobreAncho:"0.5",diferencia:"0.09",tramos:[T("","","","")],coords:[]},
        {id:8,nombre:"Cab",ubicacion:"inicio",modo:"esquinas",desdeX:"3",desdeLado:"izq",hastaX:"3",hastaLado:"der",fondo:"5",esq:{A:"965.7",B:"965.53",D:"965.65"},tramos:[T("","","","")],coords:[]},
        {id:7,nombre:"Fin",ubicacion:"fin",modo:"diferencia",lado:"izquierdo",desde:"0",hasta:"5",fondo:"4",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
      volumenes: [{ id: 11, nombre: "Base", fuenteSup: "tabla__rasante", fuenteInf: "tabla__base", sobreAncho: "0.5" }] };
  });
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  await p.click('.tv-subvia button[data-sub=parq]'); await p.waitForTimeout(300);
  await p.locator('.tv-planta-ed-btn').click(); await p.waitForTimeout(200);
  await p.screenshot({ path: '../out/despl_parq.png', fullPage: true });
  await p.locator('.tv-despl-cab').first().click(); await p.waitForTimeout(200);
  console.log('abierto:', await p.locator('.tv-despl-cab[aria-expanded=true]').count(), 'de', await p.locator('.tv-despl-cab').count());
  await p.click('.tv-subvia button[data-sub=lat]'); await p.waitForTimeout(300);
  await p.screenshot({ path: '../out/despl_lat.png', fullPage: true });
  console.log('ancho página', await p.evaluate(() => document.documentElement.scrollWidth));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
