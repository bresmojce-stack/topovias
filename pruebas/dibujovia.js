// Dibujo → vía: el eje, los laterales y los parqueaderos del dibujo pasan a la vía (sin cotas), con abscisa 0 elegida e invertir sentido
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, acceptDownloads: true, hasTouch: true, isMobile: movil });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const R = (x0, y0, x1, y1) => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  const objs0 = [
    { id: 1, t: "eje", v: [{ x: 0, y: 0 }, { x: 0, y: 100 }], abs0: 0, paso: 10, nom: "V" },
    { id: 2, t: "l", a: { x: -3, y: 0 }, b: { x: -3, y: 100 }, col: "#2563EB" }, { id: 3, t: "l", a: { x: 3, y: 0 }, b: { x: 3, y: 100 }, col: "#2563EB" },
    { id: 11, t: "pl", c: true, forma: "rect", v: R(-9, 60, -3, 100) }, { id: 12, t: "pl", c: true, forma: "rect", v: R(-5, 40, -3, 50) }, { id: 13, t: "pl", c: true, forma: "rect", v: R(-7, 20, -3, 30) },
    { id: 14, t: "pl", c: true, forma: "rect", v: R(3, 55, 8, 95) }, { id: 15, t: "pl", c: true, forma: "rect", v: R(3, 10, 9, 30) },
    { id: 16, t: "pl", c: true, v: [{ x: -8, y: -10 }, { x: 8, y: -10 }, { x: 8, y: -3 }, { x: 0, y: -3 }, { x: 0, y: 0 }, { x: -8, y: 0 }] }];
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    dibujos: [{ id: 7, nombre: "D", sig: 3, objs: objs0 }] };
  const tb = process.env.TB || ''; await p.evaluate(([pr, tb]) => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'O'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); if (tb) localStorage.setItem('tv_tema', tb); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, [pr, tb]);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(500);
  const objs = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs);
  const dib = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0]);
  const herr = async (g, id) => { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.click(`.tv-dib-hoja button[data-herr="${id}"]`); await p.waitForTimeout(150); };
  const tap = async (x, y) => { if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(150); };
  let M; const mapa = async () => { const c = await p.$$eval('.tv-dib-svg > g > circle', cs => cs.slice(0, 2).map(x => { const r = x.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })); M = { x0: c[0][0], y0: c[0][1], k: (c[1][0] - c[0][0]) / 40 }; };
  const tapW = async (E, N) => { await mapa(); await tap(M.x0 + E * M.k, M.y0 - N * M.k); };
  const aviso = () => p.$eval('.tv-aviso', d => d.innerText).catch(() => '');
  const desc = o => o.t === 'cota' ? 'cota ' + Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y).toFixed(3) + (o.d < 0 ? '(-)' : '(+)') : o.t === 'tx' ? '"' + o.s + '"' : o.t;
  const nuevos = async (n0) => (await objs()).slice(n0).map(desc).join(', ');
  const via = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0]);
  const btn = () => p.click('button:has-text("→ Vía")');
  await btn(); await p.waitForTimeout(300);
  console.log('1. panel:', (await p.$eval('.tv-dib-pasar', d => d.innerText.replace(/\s+/g, ' '))).slice(0, 700));
  await p.click('.tv-dib-pasar button:has-text("Pasar a la vía")'); await p.waitForTimeout(900);
  let v = await via();
  console.log('2. eje:', JSON.stringify(v.coordsEje), '| tramos:', v.tramos.map(x => x.distancia).join(','), '| abs inicio:', v.absInicio);
  console.log('3. laterales:', v.lateralIzq.ancho, v.lateralDer.ancho);
  console.log('4. parqueaderos:', v.parqueaderos.map(q => q.nombre + ' ' + q.lado[0] + ' ' + q.absInicio + '-' + q.absFin + ' w' + q.ancho).join(' | '));
  // 5. otra vez: todo igual, no repite
  await btn(); await p.waitForTimeout(300);
  console.log('5. segunda vez, estados:', await p.$$eval('.tv-dib-pasar span', ss => ss.map(s => s.textContent).filter(t => ['IGUAL', 'NUEVO', 'CAMBIA'].includes(t)).join(',')));
  await p.click('.tv-dib-pasar button:has-text("Pasar a la vía")'); await p.waitForTimeout(600);
  console.log('   parqueaderos tras repetir:', (await via()).parqueaderos.length, '|', await p.$eval('.tv-aviso', d => d.innerText).catch(() => ''));
  // 6. abscisa 0 = 1+000 y se vuelve a pasar reemplazando
  await btn(); await p.waitForTimeout(300);
  await p.fill('.tv-dib-pasar input[data-pv="abs0"]', '1+000'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  await p.selectOption('.tv-dib-pasar select', 'reemplazar');
  await p.click('.tv-dib-pasar button:has-text("Pasar a la vía")'); await p.waitForTimeout(900);
  v = await via();
  console.log('6. abs 0 = 1+000: inicio', v.absInicio, '|', v.parqueaderos.map(q => q.absInicio + '-' + q.absFin).join(' | '));
  // 7. invertir sentido: el eje va de norte a sur, izquierda y derecha se cambian
  await btn(); await p.waitForTimeout(300);
  await p.fill('.tv-dib-pasar input[data-pv="abs0"]', '0+000'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.click('.tv-dib-pasar button:has-text("Invertir sentido")'); await p.waitForTimeout(500);
  await p.selectOption('.tv-dib-pasar select', 'reemplazar');
  await p.click('.tv-dib-pasar button:has-text("Pasar a la vía")'); await p.waitForTimeout(900);
  v = await via();
  console.log('7. invertido: eje', JSON.stringify(v.coordsEje.map(q => q.norte)), '|', v.parqueaderos.map(q => q.lado[0] + ' ' + q.absInicio + '-' + q.absFin + ' w' + q.ancho).join(' | '));
  // 8. un solo Deshacer (el de arriba, de la vía) devuelve el último paso: el eje vuelve de norte a sur... a como estaba antes de invertir
  await p.waitForTimeout(900); await p.click('.tv-tabs button[data-tab=via]'); await p.waitForTimeout(300); await p.click('button:has-text("↶ Deshacer")'); await p.waitForTimeout(500);
  v = await via();
  console.log('8. tras ↶ Deshacer: eje', JSON.stringify(v.coordsEje.map(q => q.norte)), '| parqueaderos', v.parqueaderos.map(q => q.lado[0] + ' ' + q.absInicio + '-' + q.absFin).join(' | '));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
