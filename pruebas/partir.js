const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1100);
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: W, height: 900 }, isMobile: W < 600, hasTouch: W < 600 });
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { console.log('dialog: ' + d.message().split('\n')[0]); d.accept(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const g = Math.PI / 180 * 21;
  const coords = [{norte:"1000",este:"1000"},{norte:"1000",este:"1007.2"},{norte:String(1000 + 12.8*Math.sin(g)),este:String(1007.2 + 12.8*Math.cos(g))}];
  const latD = {modo:"longitudinal",ancho:"3",absInicio:"",tramos:[T("100","","1","7.5"),T("100.075","100.5","","13.5")]};
  const latI = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",tramos:[T("","","","")],absInicio:""};
  const proj = { id: 1, nombre: "Quiebre", absInicio: "0", tramos: [T("100.1","","1","7.2"), T("100.172","100.4","","12.8")], intermedias: [],
    capas: [{nombre:"base",espesor:"0.15",id:1}], lateralIzq: latI, lateralDer: latD, coordsEje: coords,
    parqueaderos: [], bmEstaciones: [], nivelaciones: [], coordsIzq: [], coordsDer: [], volumenes: [] };
  // 1) cálculo: partir no cambia cotas
  const r = await p.evaluate(pr => {
    const fil = t => new Map(generarTabla(t).filter(x => !x.fueraVia).map(x => [x.abs, [x.cotaLatIzq, x.cotaEje, x.cotaLatDer]]));
    const cmp = (a, b2) => { let m = 0, n = 0; a.forEach((v, k) => { const w = b2.get(k); if (!w) return; n++; v.forEach((c, i) => { if (c !== null && w[i] !== null) m = Math.max(m, Math.abs(c - w[i])); else if (c !== w[i]) m = 99; }); }); return { comunes: n, difMax: +m.toFixed(4) }; };
    const t0 = fil(pr), out = {};
    const e = partirTramo(pr.tramos, 0, "3"); const c = partirCoords(pr.coordsEje, 0, 3 / 7.2);
    const p1 = { ...pr, tramos: e.tramos, coordsEje: c };
    out.eje = { cota: e.cota, tramos: e.tramos.map(t => [t.cotaInicio, t.cotaFin, t.pendiente, t.distancia, !!t.parte]), coords: c.length, cmp: cmp(t0, fil(p1)), nueva: fil(p1).get(3) };
    out.err = [partirTramo(pr.tramos, 0, "7.2").error, partirTramo(pr.tramos, 0, "0").error, partirTramo([{cotaInicio:"100",cotaFin:"",pendiente:"",distancia:""}], 0, "1").error];
    const l = partirTramo(p1.lateralDer.tramos, 1, "5"); const p2 = { ...p1, lateralDer: { ...p1.lateralDer, tramos: l.tramos } };
    out.lat = { cota: l.cota, cmp: cmp(t0, fil(p2)) };
    const li = lateralAPropia(p2, "izq"); const p3 = { ...p2, lateralIzq: li };
    out.propia = { tramos: li.tramos.map(t => [t.cotaInicio, t.cotaFin, t.distancia, !!t.parte]), cmp: cmp(t0, fil(p3)) };
    // recta sin coordenadas, lateral con pendiente transversal
    const q = { ...pr, coordsEje: [], lateralIzq: { ...pr.lateralIzq, modoT: "pendiente", pendienteT: "-2" } };
    const q2 = { ...q, lateralIzq: lateralAPropia(q, "izq") }; out.recta = { tramos: q2.lateralIzq.tramos.map(t => [t.cotaInicio, t.cotaFin, t.distancia]), cmp: cmp(fil(q), fil(q2)) };
    return out;
  }, proj);
  console.log(JSON.stringify(r, null, 1));
  // 2) en pantalla
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  await p.click('.tv-subvia button[data-sub=eje]'); await p.waitForTimeout(250);
  await p.locator('svg polyline[stroke-width="22"]').first().dispatchEvent('click'); await p.waitForTimeout(150);
  await p.fill('.tv-punto-nuevo input', '3'); await p.locator('.tv-planta-ed-btn + div').screenshot({ path: '../out/partir_antes_' + W + '.png' }); await p.click('.tv-punto-nuevo button'); await p.waitForTimeout(200);
  const g1 = await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0]);
  console.log('UI eje tramos:', g1.tramos.length, 'coords:', g1.coordsEje.length, 'panel:', await p.$eval('.tv-planta-ed-btn + div', d => d.innerText.split('\n').slice(-4).join(' / ')));
  await p.locator('input[placeholder="cota, ej. 955.256"]').fill('100.2'); await p.waitForTimeout(300);
  const g2 = await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0]);
  console.log('tras cota 100.2:', JSON.stringify(g2.tramos.slice(0, 2).map(t => [t.cotaInicio, t.cotaFin, t.pendiente, t.distancia])));
  await p.locator('.tv-planta-ed-btn + div').screenshot({ path: '../out/partir_eje_' + W + '.png' });
  await p.click('.tv-subvia button[data-sub=lat]'); await p.waitForTimeout(250);
  await p.locator('svg polyline[stroke-width="6"]').first().dispatchEvent('click'); await p.waitForTimeout(150);
  await p.click('button:has-text("Pasar a rasante propia")'); await p.waitForTimeout(300);
  const g3 = await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0]);
  console.log('lat izq:', g3.lateralIzq.modo, g3.lateralIzq.tramos.length);
  await p.locator('svg polyline[stroke-width="20"]').first().dispatchEvent('click'); await p.waitForTimeout(150);
  await p.fill('.tv-punto-nuevo input', '99'); await p.click('.tv-punto-nuevo button'); await p.waitForTimeout(150);
  console.log('error:', await p.$eval('.tv-punto-nuevo', d => d.innerText.split('\n').pop()));
  await p.fill('.tv-punto-nuevo input', '2'); await p.click('.tv-punto-nuevo button'); await p.waitForTimeout(250);
  const g4 = await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0]);
  console.log('lat izq tras punto:', g4.lateralIzq.tramos.length);
  await p.locator('.tv-planta-ed-btn + div').scrollIntoViewIfNeeded(); await p.locator('.tv-planta-ed-btn + div').screenshot({ path: '../out/partir_lat_' + W + '.png' });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth); console.log('ancho página', sw);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
