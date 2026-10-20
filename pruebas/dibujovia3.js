// Dibujo → vía: "Marcar parqueadero con el dedo" sobre el dibujo real de EJE 3: 4 toques, lectura en vivo (lado, abscisas y ancho) y entra a la lista
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
    const D = JSON.parse(require('fs').readFileSync(__dirname + '/eje3_dxf.json', 'utf8'));
  const objs0 = [{ id: 1, t: "p", x: 1063870, y: 863100, nom: "R1" }, { id: 2, t: "p", x: 1063900, y: 863150, nom: "R2" }];
  D.pl.forEach((q, i) => objs0.push({ id: 100 + i, t: "pl", c: false, v: q.v.map(([x, y]) => ({ x, y })), ...(q.dash ? { tipo: "punt", col: "#DC2626" } : {}) }));
  D.ln.forEach((q, i) => objs0.push({ id: 200 + i, t: "l", a: { x: q[0][0], y: q[0][1] }, b: { x: q[1][0], y: q[1][1] } }));
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
  let n0;
  const via = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0]);
  await p.click('button:has-text("→ Vía")'); await p.waitForTimeout(300);
  console.log('1. sin eje marcado:', (await p.$eval('.tv-dib-pasar', d => d.innerText.replace(/\s+/g, ' '))).slice(0, 420));
  // el eje es la polilínea roja punteada (la de 8 puntos de 42.857 m)
  const filas = await p.$$eval('.tv-dib-pasar [data-eje-abs]', is => is.map(i => i.parentNode.innerText.replace(/\s+/g, ' ')));
  console.log('2. candidatas:', filas.join(' || '));
  const idx = filas.findIndex(f => /8 puntos · 42\.8/.test(f));
  await p.locator('.tv-dib-pasar [data-eje-abs]').nth(idx).fill('0+000');
  await p.locator('.tv-dib-pasar button:has-text("Usar como eje")').nth(idx).click(); await p.waitForTimeout(500);
  console.log('3. con eje:', (await p.$eval('.tv-dib-pasar', d => d.innerText.replace(/\s+/g, ' '))));
  // marcar un parqueadero nuevo a la derecha, de 0+017 a 0+024 y de 3 a 6.5 m del eje (ancho 3.5 sobre el borde de 3 m)
  const E = await p.evaluate(() => { const eje = JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs.find(o => o.t === 'eje'); return [[17, 3], [24, 3], [24, 6.5], [17, 6.5]].map(([a, d]) => EJE.punto(eje, a, d)); });
  await p.click('.tv-dib-pasar button:has-text("Marcar parqueadero")'); await p.waitForTimeout(300);
  console.log('3. barra:', await p.$eval('.tv-dib-cmd', d => d.innerText.replace(/\n/g, ' ')).then(x => x.slice(0, 120)));
  const mapa2 = async () => { const c = await p.$$eval('.tv-dib-svg > g > circle', cs => cs.slice(0, 2).map(x => { const r = x.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }));
    return { k: (c[1][0] - c[0][0]) / (1063900 - 1063870), x0: c[0][0], y0: c[0][1] }; };
  for (let i = 0; i < E.length; i++) { const M = await mapa2(); const X = M.x0 + (E[i].x - 1063870) * M.k, Y = M.y0 - (E[i].y - 863100) * M.k; await tap(X, Y);
    if (i >= 2) console.log('4.' + i + ' en vivo con ' + (i + 1) + ' puntos:', (await p.$eval('.tv-dib-cmd', d => d.innerText.replace(/\n/g, ' '))).replace(/\s+/g, ' ').slice(0, 160)); }
  await p.click('.tv-dib-cmd button:has-text("Listo")'); await p.waitForTimeout(500);
  const txt = (await p.$eval('.tv-dib-pasar', d => d.innerText.replace(/\s+/g, ' ')));
  console.log('5. panel de vuelta, parqueaderos:', (txt.match(/PARQUEADEROS \((\d+)\)/) || [])[1]);
  const nuevo = await p.$$eval('.tv-dib-pasar [data-pv$="|ai"]', is => is.map(i => i.value));
  console.log('   abscisas iniciales:', nuevo.join(' '));
  await p.click('.tv-dib-pasar button:has-text("Pasar a la vía")'); await p.waitForTimeout(900);
  const v = await via();
  console.log('6. parqueaderos en la vía:', v.parqueaderos.map(q => q.lado[0] + ' ' + q.absInicio + '-' + q.absFin + ' w' + q.ancho).join(' | '));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
