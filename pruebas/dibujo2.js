// Fase 2 del dibujo: figuras, círculo, arco, medir ángulo/radio, editar con números, mover/copiar/girar, recortar, extender, sombrear, pluma, DXF
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, acceptDownloads: true, hasTouch: true, isMobile: movil });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  p.on('dialog', d => d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const pr = { id: 1, obraId: 5, nombre: "Via 1", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    dibujos: [{ id: 77, nombre: "Prueba", sig: 3, objs: [{ id: 1, t: "p", x: 1000, y: 1000, nom: "P1" }, { id: 2, t: "p", x: 1040, y: 1030, nom: "P2" }, { id: 3, t: "l", a: { x: 1000, y: 1000 }, b: { x: 1040, y: 1030 } }] }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Carambolo'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(400);
  const objs = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs);
  const nuevo = async n0 => (await objs()).slice(n0);
  const herr = async (g, id) => { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.click(`.tv-dib-hoja button[data-herr="${id}"]`); await p.waitForTimeout(100); };
  const tap = async (x, y) => { if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(150); };
  const panel = () => p.$eval('.tv-dib-panel', d => d.innerText.replace(/\n/g, ' | ')).catch(() => '(sin panel)');
  let pts, k; const mapa = async () => { pts = await p.$$eval('.tv-dib-svg circle[fill="#DC2626"]', cs => cs.slice(0, 2).map(c => { const r = c.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })); k = (pts[1][0] - pts[0][0]) / 40; };
  const S = (E, N) => [pts[0][0] + (E - 1000) * k, pts[0][1] - (N - 1000) * k];
  const tapW = async (E, N) => { await mapa(); await tap(...S(E, N)); };
  const verTodo = async () => { await p.click('.tv-dib-nav button[data-grupo=ver]'); await p.click('.tv-dib-hoja button[data-herr="@todo"]'); await p.waitForTimeout(150); await mapa(); };
  const escribir = async (modo, campos) => {
    if (!(await p.$('.tv-dib-teclado'))) await p.click('.tv-dib-cmd button:has-text("Escribir")');
    if (modo) await p.click(`.tv-dib-teclado button:has-text("${modo}")`);
    for (const [ph, v] of campos) await p.fill(`.tv-dib-teclado input[placeholder="${ph.split('#')[0]}"]${ph.includes('#') ? ' >> nth=' + ph.split('#')[1] : ''}`, v);
    await p.click('.tv-dib-teclado button[type=submit]'); await p.waitForTimeout(150);
  };
  const cerrarTeclado = async () => { const c = await p.$('.tv-dib-teclado button:has-text("Cerrar")'); if (c) await c.click(); };
  const area = v => Math.abs(v.reduce((s, a, i) => { const q = v[(i + 1) % v.length]; return s + a.x * q.y - q.x * a.y; }, 0)) / 2;
  const r3 = v => Math.round(v * 1000) / 1000;
  let n0;
  // A. rectángulo escrito: esquina N,E + ancho y alto
  n0 = (await objs()).length; await herr('dibujar', 'rect');
  await escribir('Norte, Este', [['1000.000#0', '1003'], ['1000.000#1', '1005']]);
  await escribir('Ancho y alto', [['17.000', '17'], ['11.000', '11']]);
  let o = (await nuevo(n0))[0]; console.log('A. rectángulo:', o.forma, 'área', r3(area(o.v)), JSON.stringify(o.v.map(q => [r3(q.y), r3(q.x)])));
  // B. cuadrado (lado 10, azimut 90) y triángulo (5, 4, 3)
  n0 = (await objs()).length; await herr('dibujar', 'cuadrado');
  await escribir('Norte, Este', [['1000.000#0', '1050'], ['1000.000#1', '1050']]); await escribir('Lado y azimut', [['10.000', '10']]);
  await herr('dibujar', 'triangulo');
  await escribir('Norte, Este', [['1000.000#0', '1050'], ['1000.000#1', '1000']]); await escribir('Los 3 lados', [['5.000', '5'], ['4.000', '4'], ['3.000', '3']]);
  const [cu, tr] = await nuevo(n0);
  console.log('B. cuadrado área', r3(area(cu.v)), '| triángulo área', r3(area(tr.v)), 'vértice', JSON.stringify([r3(tr.v[2].y), r3(tr.v[2].x)]));
  // C. círculo centro + radio escrito; D. arco por 3 puntos escritos
  n0 = (await objs()).length; await herr('dibujar', 'circulo');
  await escribir('Norte, Este', [['1000.000#0', '1020'], ['1000.000#1', '1020']]); await escribir('Radio', [['5.000', '8']]);
  await herr('dibujar', 'arco');
  await escribir('Norte, Este', [['1000.000#0', '1000'], ['1000.000#1', '1060']]); await escribir(null, [['1000.000#0', '1010'], ['1000.000#1', '1070']]); await escribir(null, [['1000.000#0', '1000'], ['1000.000#1', '1080']]);
  await cerrarTeclado();
  const [ci, ar] = await nuevo(n0);
  console.log('C. círculo', JSON.stringify(ci.c), 'r', ci.r, '| D. arco centro', JSON.stringify({ x: r3(ar.c.x), y: r3(ar.c.y) }), 'r', r3(ar.r), 'a1', r3(ar.a1), 'a2', r3(ar.a2));
  await verTodo();
  // E. radio y cuerda
  await herr('medir', 'radio'); await tapW(1028, 1020); console.log('E. círculo:', await panel());
  await tapW(1070, 1010); console.log('   arco:', await panel());
  // F. área de un círculo tocando adentro
  await herr('medir', 'area'); await tapW(1021, 1023); console.log('F. área círculo:', (await panel()).split(' | ').slice(0, 5).join(' | '));
  // G. ángulo entre la línea P1-P2 y el lado de abajo del rectángulo
  await herr('medir', 'angulo'); await tapW(1036, 1027); await tapW(1015, 1003); console.log('G. ángulo:', await panel());
  // H. editar con números: ancho del rectángulo 17 → 20
  await herr('editar', 'elegir'); await tapW(1012, 1003.0);
  console.log('H. elegido:', (await panel()).split(' | ').slice(0, 3).join(' | '));
  const campoAncho = await p.$('.tv-dib-panel input');
  await campoAncho.fill('20'); await campoAncho.press('Enter'); await p.waitForTimeout(200);
  const rect = (await objs()).find(q => q.forma === 'rect'); console.log('   ancho 20 → área', r3(area(rect.v)));
  await campoAncho.fill('17').catch(() => {}); const c2 = await p.$('.tv-dib-panel input'); await c2.fill('17'); await c2.press('Enter'); await p.waitForTimeout(200);
  await p.click('.tv-dib-panel button:has(svg) >> nth=0').catch(() => {});
  // I. paralela a 2 m de la línea P1-P2, hacia arriba
  n0 = (await objs()).length; await herr('dibujar', 'paralela');
  await p.fill('.tv-dib-campo', '2'); await tapW(1036, 1027); await tapW(1030, 1040);
  const par = (await nuevo(n0))[0];
  const dLinea = q => Math.abs(3 * q.x - 4 * q.y + 1000) / 5;
  console.log('I. paralela:', par && par.t, 'distancia a la línea', r3(dLinea(par.a)), r3(dLinea(par.b)));
  await p.click('.tv-dib-deshacer button[data-accion=deshacer]'); await p.waitForTimeout(900);   // deshacer la paralela
  // J. recortar la línea P1-P2 dentro del rectángulo
  await herr('editar', 'recortar'); await tapW(1012, 1009);
  const lineas = (await objs()).filter(q => q.t === 'l').map(q => r3(Math.hypot(q.b.x - q.a.x, q.b.y - q.a.y)));
  console.log('J. recortar → tramos:', JSON.stringify(lineas));
  await p.waitForTimeout(900);
  // K. extender: línea nueva que llega cerca del rectángulo
  await herr('dibujar', 'linea');
  await escribir('Norte, Este', [['1000.000#0', '1008'], ['1000.000#1', '990']]); await escribir('Norte, Este', [['1000.000#0', '1008'], ['1000.000#1', '1000']]); await cerrarTeclado();
  await herr('editar', 'extender'); await tapW(999.5, 1008);
  let ext = (await objs()).find(q => q.t === 'l' && q.a.y === 1008); console.log('K. extender hasta el rectángulo → fin E', r3(ext.b.x));
  await p.fill('.tv-dib-campo', '2.5'); await tapW(1004.8, 1008);
  ext = (await objs()).find(q => q.t === 'l' && q.a.y === 1008); console.log('   y 2.5 m más → fin E', r3(ext.b.x));
  await p.waitForTimeout(900);
  // L. mover el círculo 50 m al norte (ΔN 50)
  await herr('editar', 'mover'); await tapW(1028, 1020); await p.click('.tv-dib-cmd button:has-text("Siguiente")');
  await escribir('Norte, Este', [['1000.000#0', '1020'], ['1000.000#1', '1020']]);
  await escribir('ΔN, ΔE', [['30.000', '50'], ['40.000', '0']]); await cerrarTeclado();
  console.log('L. mover → centro', JSON.stringify((await objs()).find(q => q.t === 'ci').c));
  await p.waitForTimeout(900);
  // M. copiar el cuadrado dos veces (20 m al este y 40 m al este)
  n0 = (await objs()).length; await verTodo();
  await herr('editar', 'copiar'); await tapW(1055, 1055); await p.click('.tv-dib-cmd button:has-text("Siguiente")');
  await escribir('Norte, Este', [['1000.000#0', '1050'], ['1000.000#1', '1050']]);
  await escribir('ΔN, ΔE', [['30.000', '0'], ['40.000', '20']]); await escribir('ΔN, ΔE', [['30.000', '0'], ['40.000', '40']]); await cerrarTeclado();
  await p.click('.tv-dib-cmd button:has-text("Terminar")');
  console.log('M. copias:', JSON.stringify((await nuevo(n0)).map(q => q.forma + '@E' + q.v[0].x + ' área ' + r3(area(q.v)))));
  await p.waitForTimeout(900);
  // N. girar el rectángulo 90° sobre su primera esquina
  await herr('editar', 'girar'); await tapW(1012, 1003); await p.click('.tv-dib-cmd button:has-text("Siguiente")');
  await escribir('Norte, Este', [['1000.000#0', '1003'], ['1000.000#1', '1005']]); await cerrarTeclado();
  await p.fill('.tv-dib-campo', '90'); await p.click('.tv-dib-cmd button:has-text("Girar")'); await p.waitForTimeout(200);
  const rg = (await objs()).find(q => q.forma === 'rect'); console.log('N. girar 90° →', JSON.stringify(rg.v.map(q => [r3(q.y), r3(q.x)])), 'área', r3(area(rg.v)));
  await p.waitForTimeout(900);
  // O. sombrear: rectángulo rayado, triángulo relleno
  await verTodo(); await herr('dibujar', 'sombrear');
  await tapW(1000, 1012); await p.click('.tv-dib-cmd button:has-text("Relleno")'); await tapW(1002.8, 1051);
  console.log('O. sombreados:', JSON.stringify((await objs()).filter(q => q.som).map(q => q.forma + ':' + q.som)));
  // P. pluma libre
  n0 = (await objs()).length; await herr('dibujar', 'pluma');
  await mapa(); const [x0, y0] = S(1030, 1060);
  if (movil) { const cdp = await ctx.newCDPSession(p); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] }); for (let i = 1; i <= 30; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + i * 4, y: y0 + Math.sin(i / 4) * 25, id: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  else { await p.mouse.move(x0, y0); await p.mouse.down(); for (let i = 1; i <= 30; i++) await p.mouse.move(x0 + i * 4, y0 + Math.sin(i / 4) * 25); await p.mouse.up(); }
  await p.waitForTimeout(200);
  const fh = (await nuevo(n0))[0]; console.log('P. pluma:', fh && fh.t, fh && fh.v.length + ' puntos (simplificado de 31)');
  await verTodo(); await p.screenshot({ path: process.argv[3] + '_f2.png' });
  // Q. DXF
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DXF")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.dxf'); console.log('Q. DXF guardado');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
