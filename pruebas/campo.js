const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const proj = { ...{}, id: 1, obraId: 5, nombre: "EJE 7", absInicio: "0", tramos: [T("965.59","","-2","27.5"), T("965.04","","2","30")], intermedias: [{valor:"34.6"}],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}], lateralIzq: lat, lateralDer: lat,
    parqueaderos: [{id:9,nombre:"Parq",modo:"diferencia",lado:"derecho",absInicio:"10",absFin:"25",ancho:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")],coords:[]}],
    bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], volumenes: [] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  await p.click('button:has-text("Nivelaciones")');
  await p.click('text=+ 🟫 Terreno natural');
  const filas = await p.$$eval('main table:first-of-type tbody tr', trs => trs.map(tr => tr.cells[0].innerText + ' ' + [...tr.querySelectorAll('input')].map(i => i.disabled ? '·' : '▢').join('')));
  console.log('FORMATO GENERADO (abscisa: parqDer latDer eje latIzq parqIzq; ▢=se toma, ·=no aplica):'); filas.forEach(f => console.log('   ' + f));
  // día 1: estación 1 desde 0+000, lecturas hasta 0+020
  const inps = await p.$$('main input[placeholder="ej. 965.000"]'); await inps[0].fill('966'); await (await p.$$('main input[placeholder="ej. 1.520"]'))[0].fill('1.5');
  await p.selectOption('main tbody tr:nth-child(1) select', { index: 1 });
  for (const [i, v] of [[1, '1.70'], [2, '1.80'], [3, '1.90'], [4, '2.00'], [5, '2.10']]) await p.fill(`main table:first-of-type tbody tr:nth-child(${i}) td:nth-child(5) input`, v);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  await p.click('button:has-text("Nivelaciones")');
  const tras = await p.$$eval('main table:first-of-type tbody tr', trs => trs.slice(0, 6).map(tr => tr.cells[0].innerText + ' eje=' + (tr.cells[4].querySelector('input') || {}).value));
  console.log('día 1 guardado tras recargar:', JSON.stringify(tras));
  // día 2: nueva estación desde 0+025
  await p.click('text=+ Agregar estación');
  const cbm = await p.$$('main input[placeholder="ej. 965.000"]'); await cbm[1].fill('965.2'); await (await p.$$('main input[placeholder="ej. 1.520"]'))[1].fill('1.4');
  const fila25 = await p.$$eval('main table:first-of-type tbody tr', trs => trs.findIndex(tr => tr.cells[0].innerText.startsWith('0+025')));
  await p.selectOption(`main table:first-of-type tbody tr:nth-child(${fila25 + 1}) select`, { index: 2 });
  await p.fill(`main table:first-of-type tbody tr:nth-child(${fila25 + 1}) td:nth-child(5) input`, '1.30');
  const cotas = await p.$$eval('main table:nth-of-type(2) tbody tr', trs => trs.slice(0, 9).map(tr => tr.cells[0].innerText + ' AI ' + tr.cells[1].innerText + ' eje ' + tr.cells[4].innerText));
  console.log('cotas calculadas:', JSON.stringify(cotas));
  console.log('campos de la estación:', await p.$$eval('main .tv-card, main div', d => [...new Set([...document.querySelectorAll('main label, main span')].map(x => x.innerText).filter(t => /NOMBRE|COTA BM|VISTA|AI|FECHA/i.test(t)))].slice(0, 8)));
  await p.screenshot({ path: process.argv[3], fullPage: true });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
