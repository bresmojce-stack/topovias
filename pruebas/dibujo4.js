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
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const R = (x0, y0, w, hh) => [{ x: x0, y: y0 }, { x: x0 + w, y: y0 }, { x: x0 + w, y: y0 + hh }, { x: x0, y: y0 + hh }];
  const objs0 = [{ id: 1, t: "p", x: 0, y: 0, nom: "A" }, { id: 2, t: "p", x: 40, y: 30, nom: "B" },
    { id: 3, t: "pl", c: true, forma: "rect", v: R(0, 0, 17, 11) },
    // 4 líneas desordenadas (y una al revés) que forman un rectángulo de 10 × 5
    { id: 4, t: "l", a: { x: 30, y: 0 }, b: { x: 40, y: 0 } }, { id: 5, t: "l", a: { x: 30, y: 5 }, b: { x: 40, y: 5 } },
    { id: 6, t: "l", a: { x: 40, y: 0 }, b: { x: 40, y: 5 } }, { id: 7, t: "l", a: { x: 30, y: 5 }, b: { x: 30, y: 0 } },
    // polilínea abierta (borde) para desfase a la derecha
    { id: 8, t: "pl", c: false, v: [{ x: 0, y: 20 }, { x: 20, y: 20 }, { x: 20, y: 30 }] }];
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    dibujos: [{ id: 7, nombre: "D", sig: 3, objs: objs0 }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'O'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(500);
  const objs = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs);
  const herr = async (g, id) => { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.click(`.tv-dib-hoja button[data-herr="${id}"]`); await p.waitForTimeout(150); };
  const tap = async (x, y) => { if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(150); };
  let M; const mapa = async () => { const c = await p.$$eval('.tv-dib-svg > g > circle', cs => cs.slice(0, 2).map(x => { const r = x.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })); M = { x0: c[0][0], y0: c[0][1], k: (c[1][0] - c[0][0]) / 40 }; };
  const tapW = async (E, N) => { await mapa(); await tap(M.x0 + E * M.k, M.y0 - N * M.k); };
  const area = v => Math.abs(v.reduce((s, a, i) => { const q = v[(i + 1) % v.length]; return s + a.x * q.y - q.x * a.y; }, 0)) / 2;
  const r3 = v => Math.round(v * 1000) / 1000;
  const aviso = () => p.$eval('.tv-aviso', d => d.innerText).catch(() => '');
  let n0;
  // A. desfase del rectángulo
  await herr('dibujar', 'desfase');
  n0 = (await objs()).length; await tapW(8, 0.2); let nv = (await objs()).slice(n0);
  console.log('A. afuera 0.50:', nv.map(o => o.c + ' área ' + r3(area(o.v))).join(), '|', await aviso());
  await p.click('.tv-dib-cmd button:has-text("Adentro")'); n0 = (await objs()).length; await tapW(8, 0.2); nv = (await objs()).slice(n0);
  console.log('   adentro 0.50:', nv.map(o => 'área ' + r3(area(o.v))).join());
  await p.click('.tv-dib-cmd button:has-text("Ambos")'); await p.fill('.tv-dib-campo', '1'); n0 = (await objs()).length; await tapW(8, 0.2); nv = (await objs()).slice(n0);
  console.log('   ambos 1.00:', nv.map(o => 'área ' + r3(area(o.v))).join(' y '));
  // borde abierto: afuera = derecha (al sur en el primer tramo que va al este)
  await p.click('.tv-dib-cmd button:has-text("Afuera")'); await p.fill('.tv-dib-campo', '0.5'); n0 = (await objs()).length; await tapW(10, 20); nv = (await objs()).slice(n0);
  console.log('   borde abierto, afuera 0.50:', JSON.stringify(nv[0] && nv[0].v.map(q => [r3(q.x), r3(q.y)])));
  await p.waitForTimeout(900);
  // B. unir las 4 líneas
  await herr('editar', 'unir');
  for (const [E, N] of [[35, 0], [40, 2.5], [35, 5], [30, 2.5]]) await tapW(E, N);
  await p.click('.tv-dib-cmd button:has-text("Unir")'); await p.waitForTimeout(200);
  const lineas = (await objs()).filter(o => o.t === 'l').length, unida = (await objs()).slice(-1)[0];
  console.log('B. unir: quedan líneas', lineas, '| figura cerrada', unida.c, 'área', r3(area(unida.v)), '|', await aviso());
  await p.waitForTimeout(900);
  // C. medida rápida: línea de 10 m a 90° desde A, y polilínea 10 m a 90° + 5 m a 0°
  await herr('dibujar', 'linea'); await tapW(0, 0);
  await p.fill('.tv-dib-rapido input >> nth=0', '10'); await p.fill('.tv-dib-rapido input >> nth=1', '90'); await p.press('.tv-dib-rapido input >> nth=1', 'Enter'); await p.waitForTimeout(200);
  const L = (await objs()).slice(-1)[0]; console.log('C. línea rápida:', L.t, JSON.stringify([L.a, L.b]));
  await herr('dibujar', 'polilinea'); await tapW(40, 30);
  await p.fill('.tv-dib-rapido input >> nth=0', '10'); await p.fill('.tv-dib-rapido input >> nth=1', '90'); await p.click('.tv-dib-rapido button');
  await p.fill('.tv-dib-rapido input >> nth=0', '5,5'); await p.fill('.tv-dib-rapido input >> nth=1', '0'); await p.click('.tv-dib-rapido button');
  await p.click('.tv-dib-cmd button:has-text("Terminar")'); await p.waitForTimeout(200);
  const PL = (await objs()).slice(-1)[0]; console.log('   polilínea rápida:', JSON.stringify(PL.v.map(q => [r3(q.x), r3(q.y)])));
  // D. lupa con el dedo
  if (movil) {
    await p.click('.tv-dib-nav button[data-grupo=ver]'); await p.click('.tv-dib-hoja button[data-herr="@todo"]'); await p.waitForTimeout(200);
    await herr('dibujar', 'linea'); await mapa();
    const cdp = await ctx.newCDPSession(p), x = M.x0 + 17 * M.k, y = M.y0 - 11 * M.k;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x + 3, y: y + 3, id: 1 }] }); await p.waitForTimeout(150);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 2, y: y + 2, id: 1 }] }); await p.waitForTimeout(150);
    console.log('   DBG toque', Math.round(x), Math.round(y), 'svg', JSON.stringify(await p.$eval('.tv-dib-svg', s => { const r = s.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); })), 'scrollY', await p.evaluate(() => scrollY), 'elemento', await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.tagName + '.' + e.className.baseVal + e.className); }, [x, y]));
    console.log('   DBG cmd:', await p.$eval('.tv-dib-cmd', d => d.innerText.replace(/\n/g, ' ')), '| marca imán:', !!(await p.$('.tv-dib-svg rect[stroke="#F59E0B"]')));
    const conLupa = await p.$('.tv-dib-lupa'); await p.screenshot({ path: process.argv[3] + '_lupa.png' });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(150);
    console.log('D. lupa con el dedo:', !!conLupa, '| al soltar desaparece:', !(await p.$('.tv-dib-lupa')));
  }
  await p.screenshot({ path: process.argv[3] + '.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
