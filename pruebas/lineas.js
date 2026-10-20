// Dibujo: tipos de línea (discontinua, punteada…) al editar una línea o figura, en varios objetos, en pantalla y en el DXF
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
    { id: 4, t: "l", a: { x: 30, y: 0 }, b: { x: 40, y: 0 } },
    { id: 8, t: "pl", c: false, v: [{ x: 0, y: 20 }, { x: 20, y: 20 }, { x: 20, y: 30 }] },
    { id: 9, t: "ci", c: { x: 55, y: 10 }, r: 5 },
    { id: 10, t: "ar", c: { x: 55, y: 25 }, r: 5, a1: 0, a2: Math.PI }];
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
  const chip = k => p.click(`.tv-dib-panel button[data-linea="${k}"]`);
  const dash = id => p.evaluate(() => [...document.querySelectorAll('.tv-dib-svg [stroke-dasharray]')].map(e => e.getAttribute('stroke-dasharray')).filter(x => x !== '3 3').join(' | '));
  // 1. elegir el rectángulo y ponerle línea discontinua
  await herr('editar', 'elegir'); await tapW(8, 0.2); await p.waitForTimeout(200);
  console.log('1. tipos ofrecidos:', await p.$$eval('.tv-dib-panel button[data-linea]', bs => bs.map(b => b.title).join(', ')));
  await chip('disc'); await p.waitForTimeout(900);
  let o = (await objs()).find(x => x.id === 3);
  console.log('2. rectángulo tipo:', o.tipo, '| guion en pantalla:', await p.$$eval('.tv-dib-svg polygon', ps => ps.map(x => x.getAttribute('stroke-dasharray')).filter(Boolean).join(' | ')));
  // 3. cambiar a punteada y volver a continua
  await chip('punt'); await p.waitForTimeout(900); console.log('3. punteada:', (await objs()).find(x => x.id === 3).tipo);
  await chip('cont'); await p.waitForTimeout(900); console.log('4. continua: tipo =', (await objs()).find(x => x.id === 3).tipo);
  // 5. línea suelta y círculo
  await tapW(35, 0); await p.waitForTimeout(200); await chip('centro'); await p.waitForTimeout(900); await p.click('.tv-dib-panel > div:first-child button'); await p.waitForTimeout(200);
  await tapW(55, 15); await p.waitForTimeout(200); await chip('trazop'); await p.waitForTimeout(900);
  console.log('5. línea:', (await objs()).find(x => x.id === 4).tipo, '| círculo:', (await objs()).find(x => x.id === 9).tipo);
  // 6. varios elegidos de una vez (rectángulo, polilínea abierta y arco)
  await herr('editar', 'seleccionar'); await tapW(8, 0.2); await tapW(10, 20); await tapW(55, 30);
  await p.click('.tv-dib-cmd button:has-text("Color")'); await p.waitForTimeout(200);
  await chip('fant'); await p.waitForTimeout(900);
  console.log('6. varios:', (await objs()).filter(x => [3, 8, 10].includes(x.id)).map(x => x.tipo).join(', '));
  // 7. descomponer conserva el tipo
  await herr('editar', 'descomponer'); await tapW(8, 0.2); await p.waitForTimeout(300);
  console.log('7. líneas del rectángulo descompuesto:', (await objs()).filter(x => x.t === 'l' && x.tipo === 'fant').length);
  // 8. DXF: tipos definidos y usados
  await p.waitForTimeout(900);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DXF")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  const dxf = require('fs').readFileSync(await dl.path(), 'utf8').split(/\r?\n/);
  const lt = []; for (let i = 0; i < dxf.length - 1; i += 2) if (dxf[i].trim() === '2' && ['CONTINUOUS', 'DASHED', 'DOT', 'DASHDOT', 'CENTER', 'PHANTOM'].includes(dxf[i + 1].trim())) lt.push(dxf[i + 1].trim());
  const usados = []; for (let i = 0; i < dxf.length - 1; i += 2) if (dxf[i].trim() === '6') usados.push(dxf[i + 1].trim());
  const cuenta = a => Object.entries(a.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {})).map(([k, v]) => k + '×' + v).join(' ');
  console.log('8. DXF tipos definidos:', [...new Set(lt)].join(' '), '| usados por objetos:', cuenta(usados.filter(x => x !== 'CONTINUOUS')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
