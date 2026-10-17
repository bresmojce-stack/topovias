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
  const proj = { id: 1, nombre: "Vía parq", absInicio: "0", tramos: [T("965.59","","-2","57.5")], intermedias: [],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2},{nombre:"subbase",espesor:"0.20",id:3,sobreancho:"general"},{nombre:"roca",espesor:"0.30",id:4,sobreancho:"propio",saIzq:"0.3",saDer:"0.3"}],
    sobreancho: { izq: "0.5", der: "0.4" },
    lateralIzq: lat, lateralDer: lat, bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    parqueaderos: [{id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"10",absFin:"25",ancho:"5",sobreAncho:"0.5",saExtremos:"0.3",diferencia:"0.05",tramos:[T("","","","")],coords:[],estructura:"via",capas:[]}],
    cantidades: { capasExcluidas: ["asfalto"] },
    volumenes: [{ id: 11, nombre: "contra subbase", fuenteSup: "tabla__rasante", fuenteInf: "tabla__subbase" }] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); }, proj);
  await p.reload(); await p.waitForTimeout(400);
  await p.click('button:has-text("Cantidades")');
  const conf = await p.$$eval('main .tv-card', cs => cs[0].innerText.replace(/\n+/g, ' / '));
  console.log('Conformación:', conf.slice(0, 420));
  const cant = await p.$$eval('main table tbody tr', trs => trs.map(tr => [...tr.cells].map(c => c.innerText).join(' | ')));
  cant.forEach(c => console.log('   ', c));
  await p.click('button:has-text("Volúmenes")');
  const filas = await p.$$eval('main table tbody tr', trs => trs.slice(0, 8).map(tr => tr.cells[0].innerText + ' ancho ' + tr.cells[tr.cells.length - 3].innerText + ' área ' + tr.cells[tr.cells.length - 2].innerText));
  filas.forEach(f => console.log('   ', f));
  console.log('volumen:', await p.$$eval('main span', ss => ss.map(s => s.innerText).filter(t => /m³$/.test(t))));
  await (p.click('.tv-tabs button[data-tab=via]'), p.click('.tv-subvia button[data-sub=parq]'));
  console.log('editor parq:', await p.innerText('text=/Ancho de trabajo: 5/'));
  await p.selectOption('select:near(:text("Estructura del parqueadero"))', 'propia');
  await p.click('text=Copiar capas de la vía');
  const modos = await p.$$eval('main select', ss => ss.map(s => s.options[s.selectedIndex].text));
  console.log('modos copiados:', JSON.stringify(modos.slice(-4)), '| exterior roca:', await p.$$eval('input[placeholder="0.50"]', i => i.map(x => x.value)));
  await p.screenshot({ path: process.argv[3], fullPage: true });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
