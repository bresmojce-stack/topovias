const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, acceptDownloads: true, hasTouch: true, isMobile: movil });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  let respuesta = null; const dlg = [];
  p.on('dialog', d => { dlg.push(d.message().slice(0, 50)); d.accept(d.type() === 'prompt' ? (respuesta !== null ? respuesta : d.defaultValue()) : undefined); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const pr = { id: 1, obraId: 5, nombre: "Via 1", absInicio: "5", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    coordsEje: [{ id: 1, norte: "1000", este: "1000" }, { id: 2, norte: "1000", este: "1100" }, { id: 3, norte: "1050", este: "1100" }],
    dibujos: [{ id: 77, nombre: "Replanteo", sig: 1, objs: [] }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Carambolo'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(400);
  const objs = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs);
  const herr = async (g, id) => { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.click(`.tv-dib-hoja button[data-herr="${id}"]`); await p.waitForTimeout(150); };
  const tap = async (x, y) => { if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(150); };
  const panel = () => p.$eval('.tv-dib-panel', d => d.innerText.replace(/\n/g, ' | ')).catch(() => '(sin panel)');
  const aviso = () => p.$eval('.tv-aviso', d => d.innerText).catch(() => '');
  // mundo → pantalla usando los dos primeros PI del eje dibujado
  let M; const mapa = async () => { const pts = await p.$eval('.tv-dib-svg polyline[stroke="#BE185D"], .tv-dib-svg polyline[stroke="#F59E0B"]', e => e.getAttribute('points').split(' ').map(s => s.split(',').map(Number)));
    const r = await p.$eval('.tv-dib-svg', s => { const b = s.getBoundingClientRect(); return [b.x, b.y]; }); const k = (pts[1][0] - pts[0][0]) / 100; M = { x0: r[0] + pts[0][0], y0: r[1] + pts[0][1], k }; };
  const tapW = async (E, N) => { await mapa(); await tap(M.x0 + (E - 1000) * M.k, M.y0 - (N - 1000) * M.k); };
  const escribir = async (modo, campos) => {
    if (!(await p.$('.tv-dib-teclado'))) await p.click('.tv-dib-cmd button:has-text("Escribir")');
    if (modo) await p.click(`.tv-dib-teclado button:has-text("${modo}")`);
    for (const [ph, v] of campos) await p.fill(`.tv-dib-teclado input[placeholder="${ph.split('#')[0]}"]${ph.includes('#') ? ' >> nth=' + ph.split('#')[1] : ''}`, v);
    const dis = await p.$eval('.tv-dib-teclado button[type=submit]', b => b.disabled);
    if (dis) console.log('   DBG3 deshabilitado:', await p.$$eval('.tv-dib-teclado input', is => is.map(i => i.placeholder + '=' + i.value)), await p.$eval('.tv-dib-teclado', d => d.innerText.replace(/\n/g, ' | ')));
    await p.click('.tv-dib-teclado button[type=submit]', { timeout: 3000 }); await p.waitForTimeout(150);
  };
  const cerrarTeclado = async () => { const c = await p.$('.tv-dib-teclado button:has-text("Cerrar")'); if (c) await c.click(); };
  // 1. traer el eje de la vía
  await herr('dibujar', '@eje'); await p.waitForTimeout(300);
  const e = (await objs()).find(o => o.t === 'eje');
  console.log('1. eje:', e && e.v.length + ' PI, abs0 ' + e.abs0 + ', paso ' + e.paso, '| aviso:', await aviso());
  // 2. abscisa y desplazamiento de puntos escritos
  await herr('medir', 'abscisa');
  await escribir('Norte, Este', [['1000.000#0', '1003'], ['1000.000#1', '1050']]); console.log('2. (N1003,E1050):', await panel());
  await escribir('Norte, Este', [['1000.000#0', '1020'], ['1000.000#1', '1103']]); console.log('   (N1020,E1103):', await panel());
  await cerrarTeclado();
  // tocando: punto sobre el eje en la abscisa 0+085 (E1080), con el imán de abscisa en 0+080? (marcas cada 10 desde 0+010)
  await tapW(1075, 1000.3); console.log('   tocado cerca de E1075 (marca 0+080):', (await panel()).split(' | ').slice(0, 5).join(' | '));
  await p.click('.tv-dib-panel button:has-text("Dejar punto")'); await p.waitForTimeout(150);
  console.log('   punto dejado:', JSON.stringify((await objs()).filter(o => o.t === 'p').map(o => o.nom + ' ' + o.y + ',' + o.x)));
  // 3. poner un punto por abscisa y desplazamiento
  await herr('dibujar', 'punto');
  await p.click('.tv-dib-cmd button:has-text("Escribir")'); await p.click('.tv-dib-teclado button:has-text("Abscisa y desplaz.")');
  await p.fill('.tv-dib-teclado input[placeholder="0+045.320"]', '0+125'); await p.fill('.tv-dib-teclado input[placeholder="3.150"]', '-2');
  console.log('   DBG campos:', await p.$$eval('.tv-dib-teclado input', is => is.map(i => i.placeholder + '=' + i.value)), await p.$eval('.tv-dib-teclado', d => d.innerText.replace(/\n/g, ' | ')));
  await escribir(null, [['0+045.320', '0+125'], ['3.150', '-2']]);
  await p.fill('.tv-dib-teclado input[placeholder="0+045.320"]', '55,5'); await p.fill('.tv-dib-teclado input[placeholder="3.150"]', '1.5');
  console.log('   DBG2 campos:', await p.$$eval('.tv-dib-teclado input', is => is.map(i => i.placeholder + '=' + i.value)), await p.$eval('.tv-dib-teclado', d => d.innerText.replace(/\n/g, ' | ')));
  await escribir(null, [['0+045.320', '55,5'], ['3.150', '1.5']]);
  await p.fill('.tv-dib-teclado input[placeholder="0+045.320"]', '0+200'); await p.fill('.tv-dib-teclado input[placeholder="3.150"]', '0');
  console.log('3. por abscisa:', JSON.stringify((await objs()).filter(o => o.t === 'p').slice(1).map(o => o.nom + ' N' + o.y + ' E' + o.x)), '| 0+200 fuera:', await p.$eval('.tv-dib-teclado', d => d.innerText.includes('fuera del eje')));
  await cerrarTeclado();
  // 4. estacar el eje cada 20 m
  let n0 = (await objs()).length;
  await herr('dibujar', 'estacar'); await p.fill('.tv-dib-campo', '20'); await tapW(1030, 1000);
  let nuevos = (await objs()).slice(n0); console.log('4. estacar eje cada 20:', nuevos.length, JSON.stringify(nuevos.map(o => o.nom)), '|', await aviso());
  // 5. línea de 40 m dividida en 4 partes
  await herr('dibujar', 'linea');
  await escribir('Norte, Este', [['1000.000#0', '1030'], ['1000.000#1', '1000']]); await escribir('Norte, Este', [['1000.000#0', '1030'], ['1000.000#1', '1040']]); await cerrarTeclado();
  n0 = (await objs()).length;
  await herr('dibujar', 'estacar'); await p.click('.tv-dib-cmd button:has-text("Partes")'); await p.fill('.tv-dib-campo', '4'); await tapW(1013, 1030);
  nuevos = (await objs()).slice(n0); console.log('5. línea en 4 partes:', JSON.stringify(nuevos.map(o => o.nom + '@E' + o.x)), '|', await aviso());
  await p.waitForTimeout(900);
  // 6. paralela al eje a 3.5 m (borde de vía, al sur)
  n0 = (await objs()).length;
  await herr('dibujar', 'paralela'); await p.fill('.tv-dib-campo', '3.5'); await tapW(1060, 1000);
  console.log('   DBG6 barra:', await p.$eval('.tv-dib-cmd', d => d.innerText.replace(/\n/g, ' ')), '| aviso', await aviso(), '| M', JSON.stringify(M)); await p.screenshot({ path: process.argv[3] + '_dbg6.png' });
  await tapW(1060, 997.5);
  nuevos = (await objs()).slice(n0); console.log('6. paralela del eje:', nuevos[0] && nuevos[0].t, JSON.stringify(nuevos[0] && nuevos[0].v.map(q => [q.y, q.x])));
  await p.waitForTimeout(900);
  // 7. editar el eje: abscisa inicial 0+100
  await herr('editar', 'elegir'); await tapW(1050, 1000);
  console.log('7. panel eje:', (await panel()).split(' | ').slice(0, 4).join(' | '));
  const inp = await p.$$('.tv-dib-panel input'); await inp[1].fill('0+100'); await inp[1].press('Enter'); await p.waitForTimeout(200);
  console.log('   abs0 →', (await objs()).find(o => o.t === 'eje').abs0, '| final:', (await panel()).match(/Abscisa final \| ([^|]+)/)[1]);
  await p.click('.tv-dib-panel button:has(svg) >> nth=0');
  // 8. polilínea → eje
  await herr('dibujar', 'polilinea');
  await escribir('Norte, Este', [['1000.000#0', '960'], ['1000.000#1', '1000']]); await escribir('Norte, Este', [['1000.000#0', '960'], ['1000.000#1', '1060']]); await cerrarTeclado();
  await p.click('.tv-dib-cmd button:has-text("Terminar")'); await p.waitForTimeout(200);
  await herr('editar', 'elegir'); await tapW(1030, 960); respuesta = '2+000';
  await p.click('.tv-dib-panel button:has-text("Usar como eje")'); await p.waitForTimeout(200);
  console.log('8. polilínea → eje:', JSON.stringify((await objs()).filter(o => o.t === 'eje').map(o => o.abs0)));
  await p.click('.tv-dib-nav button[data-grupo=ver]'); await p.click('.tv-dib-hoja button[data-herr="@todo"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: process.argv[3] + '_f3.png' });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DXF")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.dxf'); console.log('9. DXF guardado');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
