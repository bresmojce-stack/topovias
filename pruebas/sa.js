const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const proj = { ...{}, id: 1, nombre: "Vía SA", absInicio: "0", tramos: [T("965.59","","-2","57.5")], intermedias: [],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2},{nombre:"subbase",espesor:"0.20",id:3},{nombre:"roca",espesor:"0.30",id:4}],
    lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    cantidades: { capasExcluidas: ["asfalto"] },
    volumenes: [{ id: 11, nombre: "contra subbase", fuenteSup: "tabla__rasante", fuenteInf: "tabla__subbase" },
                { id: 12, nombre: "contra base", fuenteSup: "tabla__rasante", fuenteInf: "tabla__base" },
                { id: 13, nombre: "escrito 1+1", fuenteSup: "tabla__rasante", fuenteInf: "tabla__base", saIzq: "1", saDer: "1" },
                { id: 14, nombre: "antiguo 0.5", fuenteSup: "tabla__rasante", fuenteInf: "tabla__base", sobreAncho: "0.5" }] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); }, proj);
  await p.reload(); await p.waitForTimeout(400);
  const cotasAntes = await p.evaluate(() => generarTabla(JSON.parse(localStorage.getItem('topovias_standalone'))[0]).map(r => r.cotaEje + '/' + r.cotaLatDer).join(','));
  // UI: sobreancho general y modos por capa
  await p.click('.tv-tabs button[data-tab=via]');
  await p.fill('input[placeholder="ej. 0.50"]', '0.50'); await p.fill('input[placeholder="ej. 0.40"]', '0.40');
  console.log('ancho de trabajo:', await p.innerText('text=/Ancho de trabajo/'));
  const sels = await p.$$('select:near(:text("Sobreancho"))');
  const selCapa = n => p.$$eval('main select', (ss, n) => ss.map((s, i) => i), n);
  const selects = await p.$$('.tv-card:has-text("Capas de Estructura") select');
  // capas: 0 asfalto, 1 base, 2 subbase, 3 roca
  await selects[2].selectOption('general');
  await selects[3].selectOption('propio');
  await p.fill('input[placeholder="0.50"]', '0.3'); await p.fill('input[placeholder="0.40"]', '0.3');
  await p.screenshot({ path: process.argv[3], fullPage: true });
  await p.click('button:has-text("CALCULAR")');
  const cotasDespues = await p.evaluate(() => generarTabla(JSON.parse(localStorage.getItem('topovias_standalone'))[0]).map(r => r.cotaEje + '/' + r.cotaLatDer).join(','));
  console.log('cotas sin cambios por el sobreancho:', cotasAntes === cotasDespues);
  await p.click('button:has-text("Volúmenes")');
  const vols = await p.$$eval('main span', ss => ss.map(s => s.innerText).filter(t => /m³$/.test(t)));
  const anchos = await p.$$eval('main div', ds => ds.map(d => d.innerText).filter(t => /^Ancho de cálculo/.test(t)));
  console.log('volúmenes:', JSON.stringify(vols)); anchos.forEach(a => console.log('   ', a));
  await p.click('button:has-text("Cantidades")');
  const cant = await p.$$eval('main table tbody tr', trs => trs.map(tr => [...tr.cells].map(c => c.innerText).join(' | ')));
  cant.forEach(c => console.log('   ', c));
  console.log('conformación:', (await p.innerText('text=/^Vía: /')));
  await p.click('.tv-tabs button[data-tab=resultado]');
  console.log('área en planta (plano) en Tabla:', await p.innerText('text=/^Área en planta/ >> xpath=..'));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
