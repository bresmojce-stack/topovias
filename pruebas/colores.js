const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, acceptDownloads: true, hasTouch: true, isMobile: movil });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const objs0 = [{ id: 1, t: "p", x: 0, y: 0, nom: "A" }, { id: 2, t: "p", x: 40, y: 30, nom: "B" }, { id: 3, t: "l", a: { x: 0, y: 0 }, b: { x: 40, y: 30 } },
    { id: 4, t: "pl", c: true, forma: "rect", som: "rayado", v: [{ x: 50, y: 0 }, { x: 70, y: 0 }, { x: 70, y: 10 }, { x: 50, y: 10 }] },
    { id: 5, t: "ci", c: { x: 20, y: -20 }, r: 6, som: "relleno" }, { id: 6, t: "cota", a: { x: 50, y: 0 }, b: { x: 70, y: 0 }, d: -3 }];
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    dibujos: [{ id: 7, nombre: "Colores", sig: 3, objs: objs0 }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'O'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(500);
  const objs = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs);
  const herr = async (g, id) => { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.click(`.tv-dib-hoja button[data-herr="${id}"]`); await p.waitForTimeout(150); };
  const tap = async (x, y) => { if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(150); };
  // mapa: puntos A (0,0) y B (40,30)
  let M; const mapa = async () => { const c = await p.$$eval('.tv-dib-svg > g > circle', cs => cs.slice(0, 2).map(x => { const r = x.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })); M = { x0: c[0][0], y0: c[0][1], k: (c[1][0] - c[0][0]) / 40 }; };
  const tapW = async (E, N) => { await mapa(); await tap(M.x0 + E * M.k, M.y0 - N * M.k); };
  const ponerColor = async (E, N, color) => { await tapW(E, N); await p.click(`.tv-dib-panel button[data-color="${color}"]`); await p.waitForTimeout(150); await p.click('.tv-dib-panel button:has(svg) >> nth=0'); };
  await herr('editar', 'elegir');
  await ponerColor(20, 15, '#DC2626');       // línea roja
  await ponerColor(60, 5, '#16A34A');        // rectángulo rayado verde
  await ponerColor(20, -20, '#2563EB');      // círculo relleno azul
  await ponerColor(60, -3, '#EA580C');       // cota naranja
  const o = await objs();
  console.log('1. colores guardados:', JSON.stringify(o.map(x => x.t + ':' + (x.col || 'auto'))));
  console.log('   en pantalla: línea', await p.$eval('.tv-dib-svg line[stroke="#DC2626"]', () => 'roja').catch(() => 'NO'),
    '| rayado verde', await p.$eval('.tv-dib-svg polygon[fill="url(#tv-rayado-16A34A)"]', () => 'sí').catch(() => 'NO'),
    '| relleno azul', await p.$eval('.tv-dib-svg circle[fill="rgba(37,99,235,0.32)"]', () => 'sí').catch(() => 'NO'),
    '| cota naranja', await p.$eval('.tv-dib-svg text[fill="#EA580C"]', t => t.textContent).catch(() => 'NO'));
  // 2. color para lo nuevo: morado
  await p.click('button[title="Color de lo que dibujes"]'); await p.click('.tv-dib-colores button[data-color="#7C3AED"]');
  await herr('dibujar', 'linea'); await tapW(0, 20); await tapW(30, 20);
  await p.click('button[title="Color de lo que dibujes"]'); await p.click('.tv-dib-colores button[data-color="auto"]');
  await tapW(0, 25); await tapW(30, 25);
  const nuevas = (await objs()).slice(6);
  console.log('2. líneas nuevas:', JSON.stringify(nuevas.map(x => x.col || 'auto')));
  // 3. quitar color (Auto) a la línea roja
  await herr('editar', 'elegir'); await ponerColor(20, 15, 'auto');
  console.log('3. línea vuelve a auto:', !(await objs())[2].col);
  await ponerColor(20, 15, '#DC2626');
  await p.screenshot({ path: process.argv[3] + '.png' });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DXF")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.dxf');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
