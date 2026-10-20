const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  // vía plana a 100 m, 50 m, ancho 6, sin capas: volumen = (TN − 100) × 6 × largo
  const proj = { id: 1, obraId: 5, nombre: "VIA", absInicio: "0", tramos: [T("100","","0","50")], intermedias: [], capas: [],
    lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], nivelaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    volumenes: [{ id: 11, nombre: "Corte", fuenteSup: "", fuenteInf: "tabla__rasante" }] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  await p.click('button:has-text("Nivelaciones")'); await p.click('text=+ 🟫 Terreno natural');
  await p.fill('main input[placeholder="ej. 965.000"]', '100'); await p.fill('main input[placeholder="ej. 1.520"]', '1.5'); // AI 101.5
  await p.selectOption('main tbody tr[data-i="0"] select', { index: 1 });
  const fila = i => `main tbody tr[data-i="${i}"]`;
  // lecturas = 0.5 → TN 101.0 (1 m sobre la vía) en LAT DER, EJE, LAT IZQ, de 0 a 30
  for (let i = 0; i <= 6; i++) for (const c of [4, 5, 6]) await p.fill(`${fila(i)} td:nth-child(${c}) input`, '0.5');
  console.log('avance:', (await p.innerText('text=/^Avance:/')), '|', (await p.innerText('text=/Última lectura/')));
  // abscisa visible tras deslizar la tabla a la derecha
  await p.$eval('main table[id^="tv-lect"]', t => t.parentElement.scrollLeft = 400);
  const vis = await p.$eval(`${fila(3)} td:first-child`, td => { const r = td.getBoundingClientRect(); return { x: Math.round(r.left), txt: td.innerText.split('\n')[0] }; });
  console.log('abscisa visible al deslizar:', JSON.stringify(vis), '| fecha fila 0:', await p.$eval(`${fila(0)} td:nth-child(3)`, td => "col3:"+td.innerText));
  await p.screenshot({ path: process.argv[3] + '_niv.png' });
  // ir a donde quedé
  await p.$eval('main', m => window.scrollTo(0, 0));
  await p.click('text=↓ Ir a donde quedé'); await p.waitForTimeout(800);
  console.log('ir a donde quedé → foco en fila:', await p.evaluate(() => { const a = document.activeElement; const tr = a && a.closest('tr'); return tr ? tr.getAttribute('data-i') + ' ' + tr.cells[0].innerText.split('\n')[0] : 'nada'; }));
  // fila activa: cartel y columna
  await p.focus(`${fila(2)} td:nth-child(4) input`); await p.waitForTimeout(100);
  console.log('cartel:', await p.$eval('.tv-lect-cartel', e => e.hidden + ' | ' + e.textContent));
  console.log('encabezados:', await p.$$eval('main table.tv-lect thead th', t => t.map(x => x.textContent).join(',')));
  console.log('th activo:', await p.$eval('main table.tv-lect thead th:nth-child(4)', e => getComputedStyle(e).backgroundColor), '| fila activa td:', await p.$eval(`${fila(2)} td:nth-child(3)`, e => getComputedStyle(e).backgroundColor));
  await p.screenshot({ path: process.argv[3] + '_activa.png' });
  await p.$eval(`${fila(2)} td:nth-child(4) input`, e => e.blur()); await p.waitForTimeout(100);
  console.log('cartel tras salir hidden:', await p.$eval('.tv-lect-cartel', e => e.hidden));
  // cartera en Excel
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=📋 Cartera en Excel').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '_cartera.xlsx'); console.log('cartera:', dl.suggestedFilename());
  await p.click('text=Cerrar');
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
