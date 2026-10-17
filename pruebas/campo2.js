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
  for (let i = 0; i <= 6; i++) for (const c of [4, 5, 6]) await p.fill(`${fila(i)} td:nth-child(${c + 1}) input`, '0.5');
  console.log('avance:', (await p.innerText('text=/^Avance:/')), '|', (await p.innerText('text=/Última lectura/')));
  // abscisa visible tras deslizar la tabla a la derecha
  await p.$eval('main table[id^="tv-lect"]', t => t.parentElement.scrollLeft = 400);
  const vis = await p.$eval(`${fila(3)} td:first-child`, td => { const r = td.getBoundingClientRect(); return { x: Math.round(r.left), txt: td.innerText.split('\n')[0] }; });
  console.log('abscisa visible al deslizar:', JSON.stringify(vis), '| fecha fila 0:', await p.$eval(`${fila(0)} td:nth-child(3)`, td => td.innerText));
  await p.screenshot({ path: process.argv[3] + '_niv.png' });
  // ir a donde quedé
  await p.$eval('main', m => window.scrollTo(0, 0));
  await p.click('text=↓ Ir a donde quedé'); await p.waitForTimeout(800);
  console.log('ir a donde quedé → foco en fila:', await p.evaluate(() => { const a = document.activeElement; const tr = a && a.closest('tr'); return tr ? tr.getAttribute('data-i') + ' ' + tr.cells[0].innerText.split('\n')[0] : 'nada'; }));
  // volumen con 0–30 nivelado
  const volumen = async () => { await p.click('button:has-text("Volúmenes")'); await p.waitForTimeout(200);
    const tot = await p.$$eval('main span', ss => ss.map(s => s.innerText).filter(t => /m³$/.test(t)));
    const nota = await p.$$eval('main div', ds => ds.map(d => d.innerText).filter(t => /Calculado donde|^Sin volumen|^Selecciona/.test(t)).slice(-1)[0]);
    await p.click('button:has-text("Nivelaciones")'); return tot.join(' ') + ' | ' + nota; };
  await p.click('button:has-text("Volúmenes")');
  console.log('sin elegir terreno natural:', await p.$$eval('main div', ds => ds.map(d => d.innerText).filter(t => /^Selecciona/.test(t))[0]));
  await p.selectOption('main select >> nth=1', { index: 1 });
  await p.click('button:has-text("Nivelaciones")');
  console.log('A. nivelado 0–30 (esperado 1×6×30 = 180):', await volumen());
  // hueco: se nivela 40–50 pero no 35 → no debe unir 30 con 40
  for (const i of [8, 9, 10]) for (const c of [4, 5, 6]) await p.fill(`${fila(i)} td:nth-child(${c + 1}) input`, '0.5');
  console.log('B. + 40–50 con hueco en 35 (esperado 180 + 60 = 240):', await volumen());
  // lectura extra en 0+020: la 1ª cierra 15–20 (TN 101) y la 2ª abre 20–25 con TN 102 (lectura −0.5)
  await p.click(`${fila(4)} td:first-child button`);
  const filaExtra = await p.$$eval('main tbody tr', trs => trs.findIndex(tr => tr.cells[0].innerText.includes('(2)')));
  for (const c of [4, 5, 6]) await p.fill(`main tbody tr:nth-child(${filaExtra + 1}) td:nth-child(${c + 1}) input`, '-0.5');
  // y en 0+025 también TN 102 para que 20–25 sea a 2 m: 25 → lectura -0.5
  for (const c of [4, 5, 6]) await p.fill(`main tbody tr[data-i="${filaExtra + 1}"] td:nth-child(${c + 1}) input`, '-0.5');
  // esperado: 0–20: 1×6×20=120; 20–25: 2×6×5=60; 25–30: (2+1)/2×6×5=45; 40–50: 60 → 285
  console.log('C. lectura extra en 0+020 (esperado 285):', await volumen());
  // cartera en Excel
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=📋 Cartera en Excel').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '_cartera.xlsx'); console.log('cartera:', dl.suggestedFilename());
  await p.click('text=Cerrar');
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
