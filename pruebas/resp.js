// Recorre todas las pestañas en varios tamaños de pantalla y reporta desbordes
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const file = process.argv[2], out = process.argv[3];
const SIZES = [['cel', 390, 844], ['tablet', 820, 1180], ['pc', 1440, 900]];
const TABS = ['Vía','Parqueaderos','Cotas y lecturas','Plano','Nivelaciones','Volúmenes','Cantidades','Calculadora','Memoria'];
(async () => {
  const b = await chromium.launch();
  for (const [name, w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: name !== 'pc', hasTouch: name !== 'pc' });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + file); await p.waitForSelector('header.tv-header');
    const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
    const proj = { id: 1, nombre: "EJE 7", absInicio: "0", tramos: [T("965.390","","-1.820","27.5"), T("964.890","965.500","","30")], intermedias: [],
      capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.20",id:2},{nombre:"Subbase",espesor:"0.30",id:3}],
      lateralIzq: {modo:"transversal",ancho:"3",modoT:"pendiente",diferencia:"",pendienteT:"-2",tramos:[T("","","","")],absInicio:""},
      lateralDer: {modo:"longitudinal",ancho:"3.5",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("965.33","","-1.82","57.5")],absInicio:""},
      parqueaderos: [{id:9,nombre:"Parq A",modo:"independiente",lado:"derecho",absInicio:"10",absFin:"25",ancho:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("965.3","","-1","15")],coords:[],estructura:"propia",capas:[{nombre:"Concreto",espesor:"0.15",id:5}]}],
      bmEstaciones: [{id:1,cotaBM:"966",vistaMas:"1.5",absDesde:"0",absHasta:"60"}],
      nivelaciones: [{ id: 5, nombre: "TN", estaciones: [{id: 7, nombre: "Est. 1", cotaBM: "966", vistaMas: "1.5"}], lecturas: [] }],
      coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [{ id: 11, nombre: "Excavación", fuenteSup: "tabla__rasante", fuenteInf: "tabla__Base", sobreAncho: "0.5" }] };
    await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
    await p.reload(); await p.waitForTimeout(400);
    const report = [];
    for (const t of TABS) {
      await p.click(`.tv-tabs button:has-text("${t}")`); await p.waitForTimeout(150);
      if (t === 'Vía') { const c = await p.$('text=Usar coordenadas'); if (c) await c.click(); }
      const m = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        // elementos que se salen del ancho de la pantalla, sin contar los que están dentro de un contenedor con scroll propio
        const inScroller = el => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a).overflowX; if (s === 'auto' || s === 'scroll') return true; } return false; };
        const over = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1 && !inScroller(el); })
          .slice(0, 3).map(el => el.tagName + '.' + (el.innerText || '').slice(0, 25).replace(/\s+/g, ' '));
        const tabsBar = document.querySelector("nav.tv-tabs").getBoundingClientRect();
        const header = document.querySelector("header.tv-header").getBoundingClientRect();
        const smallInputs = [...document.querySelectorAll('input,select')].filter(i => parseFloat(getComputedStyle(i).fontSize) < 16).length;
        const svg = document.querySelector('svg'); 
        return { pageW: document.documentElement.scrollWidth, vw, over, tabsH: Math.round(tabsBar.height), headerH: Math.round(header.height), smallInputs, svgW: svg ? Math.round(svg.getBoundingClientRect().width) : null };
      });
      report.push(t + ': ' + JSON.stringify(m));
      await p.screenshot({ path: `${out}_${name}_${t.replace(/[^a-z]/gi,'')}.png` });
    }
    console.log('== ' + name + ' ' + w + 'x' + h); report.forEach(r => console.log('  ' + r));
    if (errs.length) console.log('  ERRORES', errs);
    await p.close();
  }
  await b.close();
})();
