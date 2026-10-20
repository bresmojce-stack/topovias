// Dibujo: lista de puntos (Ver): coordenadas, esconder, mostrar, color, nombre y DXF sin lo escondido
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
  const objs0 = [{ id: 1, t: "p", x: 0, y: 0, nom: "A" }, { id: 2, t: "p", x: 40, y: 30, nom: "B" }, { id: 11, t: "p", x: 10, y: 5, nom: "P3" }, { id: 12, t: "p", x: 20, y: 15, nom: "P4" }, { id: 13, t: "p", x: 30, y: 8, nom: "P10" },
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
  const pts = () => p.$$eval('.tv-dib-svg > g > circle', cs => cs.length).catch(() => -1);
  const visibles = () => p.evaluate(() => [...document.querySelectorAll('.tv-dib-svg circle')].filter(c => c.getAttribute('fill') && c.getAttribute('r') === '4.5').length);
  await herr('ver', '@puntos');
  console.log('1. filas:', await p.$$eval('.tv-dib-lista .tv-dib-pt', fs => fs.length), '|', await p.$eval('.tv-dib-lista', d => d.innerText.split('\n')[0]));
  console.log('2. orden y coordenadas:', await p.$$eval('.tv-dib-lista .tv-dib-pt', fs => fs.map(f => f.querySelector('input[data-nombre]').value + ' ' + f.innerText.replace(/\s+/g, ' ').match(/N [\d.-]+ E [\d.-]+/)[0]).join(' ; ')));
  const antes = await visibles();
  // 3. elegir P3 y P4 y esconderlos
  const fila = nom => p.locator('.tv-dib-lista .tv-dib-pt', { has: p.locator(`input[data-nombre]`) }).filter({ has: p.locator(`input[value="${nom}"]`) });
  for (const nom of ['P3', 'P4']) await p.locator(`.tv-dib-lista .tv-dib-pt:has(input[value="${nom}"]) input[type=checkbox]`).check();
  await p.click('.tv-dib-lista button:has-text("Esconder (2)")'); await p.waitForTimeout(300);
  console.log('3. escondidos:', (await objs()).filter(o => o.oculto).map(o => o.nom).join(','), '| puntos dibujados antes/después:', antes, '→', await visibles(), '|', await p.$eval('.tv-dib-lista', d => d.innerText.split('\n')[0]));
  // 4. lo escondido no se toca en el dibujo (P4 está en 20,15)
  await p.click('.tv-dib-lista button[title="Cerrar"]'); await herr('editar', 'elegir'); await tapW(20, 15); await p.waitForTimeout(200);
  console.log('4. tocar un punto escondido abre panel:', await p.locator('.tv-dib-panel').count());
  // 5. DXF sin lo escondido
  await p.waitForTimeout(900);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DXF")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  const dxf = require('fs').readFileSync(await dl.path(), 'utf8').split(/\r?\n/); const tx = []; for (let i = 0; i < dxf.length - 1; i += 2) if (dxf[i] === '1') tx.push(dxf[i + 1]);
  console.log('5. DXF nombres de puntos:', tx.filter(t => /^(A|B|P\d+)$/.test(t)).join(','));
  await p.click('text=Cerrar').catch(() => {}); await p.waitForTimeout(300);
  // 6. volver a la lista: color a P10 y renombrar B
  await herr('ver', '@puntos');
  await p.locator('.tv-dib-lista .tv-dib-pt:has(input[value="P10"]) input[type=checkbox]').check();
  await p.click('.tv-dib-lista button:has-text("Color (")'); await p.click('.tv-dib-lista [data-color="#2563EB"]'); await p.waitForTimeout(300);
  await p.fill('.tv-dib-lista input[data-nombre="2"]', 'BM-1'); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  const o = await objs();
  console.log('6. color P10:', o.find(x => x.id === 13).col, '| nombre del 2:', o.find(x => x.id === 2).nom);
  // 7. mostrar todos y filtro
  await p.click('.tv-dib-lista button:has-text("Mostrar todos")'); await p.waitForTimeout(300);
  console.log('7. escondidos ahora:', (await objs()).filter(x => x.oculto).length, '| puntos dibujados:', await visibles());
  await p.fill('.tv-dib-lista input[placeholder^="Filtrar"]', 'P1'); await p.waitForTimeout(200);
  console.log('8. filtro "P1":', await p.$$eval('.tv-dib-lista .tv-dib-pt', fs => fs.map(f => f.querySelector('input[data-nombre]').value).join(',')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
