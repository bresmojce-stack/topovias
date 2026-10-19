// Semáforo de las vías (tarjetas de la obra): verde terminada, amarillo faltan datos, rojo algo malo; lo pone la
// persona, se guarda en la vía (va a Drive con ella), se quita tocándolo otra vez y también se puede en una vía bloqueada
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: true, isMobile: movil })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({ cotaInicio: "100", cotaFin: "", pendiente: "1", distancia: "50", id: 1 });
  const lat = { modo: "transversal", ancho: "3", modoT: "diferencia", diferencia: "0", pendienteT: "", tramos: [T()], absInicio: "" };
  const V = (id, nombre, extra) => ({ id, obraId: 5, nombre, absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho: { izq: "", der: "" }, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], nivelaciones: [], volumenes: [], ...extra });
  const tb = process.env.TB || '';
  await p.evaluate(([vs, tb]) => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify(vs)); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'Tamarindo' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999));
    if (tb) localStorage.setItem('tv_tema', tb); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'obra', obraId: 5 })); },
    [[V(1, "EJE 1"), V(2, "EJE 2"), V(3, "EJE 3", { bloqueada: true })], tb]);
  await p.reload(); await p.waitForSelector('header.tv-header');
  if (!(await p.locator('.tv-estado-via').count())) await p.locator('main button:has-text("📁 ")').first().click();
  await p.waitForSelector('.tv-estado-via');
  const estados = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone')).map(v => v.nombre + ':' + (v.estado || '-')).join(' '));
  const tarjeta = n => p.locator('[role=button]', { hasText: n });
  await tarjeta('EJE 1').locator('.tv-estado-via[data-estado=ok]').click();
  await tarjeta('EJE 2').locator('.tv-estado-via[data-estado=falta]').click();
  await tarjeta('EJE 3').locator('.tv-estado-via[data-estado=malo]').click();
  await p.waitForTimeout(400);
  console.log('1. marcadas:', await estados(), '| sigue en la obra:', !(await p.locator('.tv-tabs').count()));
  console.log('   sellos:', (await p.$$eval('.tv-estado-sello', s => s.map(x => x.innerText))).join(' | '));
  await p.screenshot({ path: process.argv[3] + '.png' });
  await tarjeta('EJE 2').locator('.tv-estado-via[data-estado=falta]').click(); await p.waitForTimeout(300);
  console.log('2. quitar el amarillo:', await estados());
  await p.reload(); await p.waitForSelector('header.tv-header');
  if (!(await p.locator('.tv-estado-via').count())) await p.locator('main button:has-text("📁 ")').first().click();
  await p.waitForSelector('.tv-estado-via');
  console.log('3. después de recargar:', (await p.$$eval('.tv-estado-via[aria-pressed=true]', s => s.map(x => x.getAttribute('data-estado')))).join(' '));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
