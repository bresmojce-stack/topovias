// Excavación en sitio: TN 101, rasante 100, estructura 0.05+0.15+0.30 (fondo teórico 99.5), ancho 6 m.
// Excavación en sitio nivelada 0–30 a 99.4.
// Esperado: Corte 1 = 1.5×6×50 = 450; Corte 2 = 0.1×6×30 = 18; total 468.
//           Relleno de roca: cota roca 99.8 − 99.4 = 0.4×6×30 = 72.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +(process.env.W||1280), height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const abs = []; for (let a = 0; a <= 50; a += 5) abs.push(a);
  const lect = (hasta, l) => abs.filter(a => a <= hasta).map((a, i) => ({ abs: a, sub: 0, estacionId: i === 0 ? 1 : null, der: l, eje: l, izq: l, fecha: "2026-10-13" }));
  const est = { id: 1, nombre: "Est. 1", cotaBM: "101", vistaMas: "1", fecha: "2026-10-13" };
  const proj = { id: 1, obraId: 5, nombre: "EJE PRUEBA", absInicio: "0", tramos: [T("100","","0","50")], intermedias: [],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2},{nombre:"roca",espesor:"0.30",id:3}],
    sobreancho: { izq: "", der: "" }, lateralIzq: lat, lateralDer: lat, parqueaderos: [],
    bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    nivelaciones: [
      { id: 21, tipo: "tn", nombre: "Terreno natural", estaciones: [est], lecturas: lect(50, "1.000") },
      { id: 22, tipo: "excavacion", nombre: "Excavación en sitio", estaciones: [est], lecturas: lect(30, process.env.SITIO || "2.600") } ],
    volumenes: [
      { id: 31, tipo: "excavacion", nombre: "Excavación", fuenteSup: "nivel__21", fuenteTeorica: "tabla__Excavación", fuenteInf: "nivel__22", materialRelleno: "Rajón" },
      { id: 32, tipo: "relleno", nombre: "Relleno de roca", fuenteInf: "nivel__22", fuenteSup: "tabla__roca", concepto: "" } ] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); return TVDB.set('topovias_standalone', [pr]); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
  await (p.click('.tv-tabs button[data-tab=cant]'), p.click('.tv-subvia button[data-sub=vol]')); await p.waitForTimeout(200);
  const grandes = await p.$$eval('main span', ss => ss.map(s => s.innerText).filter(t => /m³$/.test(t)));
  console.log('totales en pantalla:', JSON.stringify(grandes));
  const notas = await p.$$eval('main div', ds => ds.map(d => d.innerText).filter(t => /^Calculado donde|− .*Calculado donde/.test(t)));
  notas.forEach(n => console.log('  ' + n));
  await p.screenshot({ path: process.argv[3] + '_vol.png', fullPage: true });
  // crear una excavación nueva con el botón: debe quedar con TN, fondo teórico y excavación en sitio puestos
  await p.click('button:has-text("+ ⛏️ Excavación")'); await p.waitForTimeout(200);
  const grandes2 = await p.$$eval('main span', ss => ss.map(s => s.innerText).filter(t => /m³$/.test(t)));
  console.log('con nueva excavación por botón:', JSON.stringify(grandes2));
  // Nivelaciones: tipos
  await p.click('button:has-text("Nivelaciones")'); await p.waitForTimeout(200);
  const tipos = await p.$$eval('main select', ss => ss.filter(s => [...s.options].some(o => o.text === 'Excavación en sitio') && s.options.length === 3).map(s => s.options[s.selectedIndex].text));
  console.log('tipos de nivelación:', JSON.stringify(tipos));
  await p.screenshot({ path: process.argv[3] + '_niv.png' });
  // Cantidades
  await (p.click('.tv-tabs button[data-tab=cant]'), p.click('.tv-subvia button[data-sub=lista]')); await p.waitForTimeout(200);
  const cant = await p.$$eval('main', m => m[0].innerText.split('\n').filter(t => /Excavaci|Roca|roca/.test(t)).slice(0, 8));
  console.log('cantidades:', JSON.stringify(cant));
  // Plano: leyenda con excavación en sitio
  await (p.click('.tv-tabs button[data-tab=via]'), p.click('.tv-subvia button[data-sub=plano]')); await p.waitForTimeout(300);
  console.log('leyenda exc. en sitio:', await p.$$eval('main span', ss => ss.some(s => s.innerText.startsWith('Excavación en sitio'))));
  await p.screenshot({ path: process.argv[3] + '_plano.png' });
  await (p.click('.tv-tabs button[data-tab=cant]'), p.click('.tv-subvia button[data-sub=vol]')); await p.waitForTimeout(200);
  p.on('console', m => { if (m.type()==='error') console.log('console:', m.text()); });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Exportar")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.xlsx'); console.log('excel:', dl.suggestedFilename());
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
