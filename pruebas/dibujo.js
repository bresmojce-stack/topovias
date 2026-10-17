const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, acceptDownloads: true, hasTouch: true, isMobile: movil });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  const dlg = []; p.on('dialog', d => { dlg.push(d.message().slice(0, 60)); d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const pr = { id: 1, obraId: 5, nombre: "Via 1", absInicio: "0", tramos: [T()], intermedias: [], capas: [{nombre:"base",espesor:"0.15",id:1}], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Carambolo'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  const guardado = () => p.evaluate(() => (JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos || []));
  const objs = async () => (await guardado())[0].objs;
  await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(200);
  await p.click('button:has-text("Crear el primer dibujo")'); await p.waitForTimeout(400);
  console.log('1. dibujos:', JSON.stringify((await guardado()).map(d => d.nombre)), '| alto lienzo:', await p.$eval('.tv-dib-svg', s => Math.round(s.getBoundingClientRect().height)));
  const herr = async (g, id) => { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.click(`.tv-dib-hoja button[data-herr="${id}"]`); await p.waitForTimeout(100); };
  const tap = async (x, y) => { if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(120); };
  // 2. puntos por coordenadas
  await herr('dibujar', 'punto');
  await p.click('.tv-dib-cmd button:has-text("Escribir")');
  for (const [n, e] of [['1000', '1000'], ['1030', '1040']]) {
    await p.fill('.tv-dib-teclado input[placeholder="1000.000"] >> nth=0', n); await p.fill('.tv-dib-teclado input[placeholder="1000.000"] >> nth=1', e);
    await p.click('.tv-dib-teclado button[type=submit]'); await p.waitForTimeout(150);
  }
  await p.click('.tv-dib-teclado button:has-text("Cerrar")');
  await p.click('.tv-dib-nav button[data-grupo=ver]'); await p.click('.tv-dib-hoja button[data-herr="@todo"]'); await p.waitForTimeout(150);
  console.log('2. puntos:', JSON.stringify((await objs()).map(o => o.nom + ' ' + o.y + ',' + o.x)));
  // mapa mundo→pantalla a partir de los dos puntos dibujados
  let pts, k;
  const mapa = async () => { pts = await p.$$eval('.tv-dib-svg circle[fill="#DC2626"]', cs => cs.map(c => { const r = c.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })); k = (pts[1][0] - pts[0][0]) / 40; };
  await mapa();
  const S = (E, N) => [pts[0][0] + (E - 1000) * k, pts[0][1] - (N - 1000) * k];
  console.log('   escala px/m:', k.toFixed(2), '| Y coincide:', Math.abs((pts[0][1] - pts[1][1]) / 30 - k) < 0.05);
  // 3. línea tocando cerca (4 px) de los puntos: el imán la pega exacta
  await herr('dibujar', 'linea');
  await tap(pts[0][0] + 4, pts[0][1] - 3); await tap(pts[1][0] - 3, pts[1][1] + 4);
  const L = (await objs()).find(o => o.t === 'l');
  console.log('3. línea:', JSON.stringify(L && [L.a, L.b]));
  // 4. distancia de P1 al punto medio (imán medio)
  await herr('medir', 'distancia');
  console.log('   scroll antes de 4:', await p.evaluate(() => window.scrollY)); await mapa();
  await tap(...S(1000, 1000)); await tap(...S(1020 + 0.1, 1015 - 0.1));
  console.log('4. P1 → medio:', await p.$eval('.tv-dib-panel', d => d.innerText.replace(/\n/g, ' | ')));
  await p.click('.tv-dib-panel button:has-text("cota")');
  // 5. rectángulo 17 × 11 con polilínea escrita (N,E y luego ΔN,ΔE)
  await herr('dibujar', 'polilinea');
  await p.click('.tv-dib-cmd button:has-text("Escribir")');
  await p.fill('.tv-dib-teclado input >> nth=0', '1003'); await p.fill('.tv-dib-teclado input >> nth=1', '1005'); await p.click('.tv-dib-teclado button[type=submit]');
  await p.click('.tv-dib-teclado button:has-text("ΔN")');
  for (const [dn, de] of [['0', '17'], ['11', '0'], ['0', '-17']]) { await p.fill('.tv-dib-teclado input >> nth=0', dn); await p.fill('.tv-dib-teclado input >> nth=1', de); await p.click('.tv-dib-teclado button[type=submit]'); await p.waitForTimeout(80); }
  await p.click('.tv-dib-teclado button:has-text("Cerrar")');
  await p.click('.tv-dib-cmd button:has-text("Cerrar")'); await p.waitForTimeout(150);
  const pl = (await objs()).find(o => o.t === 'pl');
  console.log('5. polilínea cerrada:', pl && pl.c, pl && pl.v.length, 'vértices');
  await mapa();
  // 6. área tocando dentro del rectángulo
  await herr('medir', 'area');
  await tap(...S(1012, 1006));
  console.log('6. área:', await p.$eval('.tv-dib-panel', d => d.innerText.replace(/\n/g, ' | ')));
  await mapa();
  // 7. distancia entre los dos cruces de la línea con el rectángulo (imán intersección)
  await herr('medir', 'distancia');
  await tap(...S(1005 + 0.15, 1003.75 + 0.1)); await tap(...S(1018.6667 - 0.1, 1014 - 0.15));
  console.log('7. entre cruces:', await p.$eval('.tv-dib-panel', d => d.innerText.split('\n').slice(0, 5).join(' | ')), '(esperado', Math.hypot(1018.6666667 - 1005, 1014 - 1003.75).toFixed(3) + ')');
  // 8. acotar el lado de abajo del rectángulo
  await herr('medir', 'acotar');
  await mapa(); await tap(...S(1005, 1003)); await tap(...S(1022, 1003)); await tap(...S(1013, 1001));
  const cotas = (await objs()).filter(o => o.t === 'cota');
  console.log('8. cotas:', cotas.map(c => Math.hypot(c.b.x - c.a.x, c.b.y - c.a.y).toFixed(3) + ' sep ' + c.d.toFixed(2)).join(' ; '));
  // 9. elegir la línea
  await herr('editar', 'elegir');
  await mapa(); await tap(...S(1016, 1012));
  console.log('9. elegida:', await p.$eval('.tv-dib-panel', d => d.innerText.split('\n').slice(0, 3).join(' | ')));
  // 10. borrar una cota y deshacer
  await p.waitForTimeout(1000); const n0 = (await objs()).length;
  await herr('editar', 'borrar'); await tap(...S(1013, 1001));
  const n1 = (await objs()).length; await p.waitForTimeout(300);
  console.log('    botones barra:', await p.$$eval('.tv-dib-cmd button', bs => bs.map(b => b.innerText + '|' + b.querySelector('svg')?.innerHTML.slice(0, 30))));
  console.log('    HIST atras:', await p.evaluate(() => HIST.atras.length));
  await p.click('.tv-dib-deshacer button[data-accion=deshacer]'); await p.waitForTimeout(200);
  console.log('    HIST atras después:', await p.evaluate(() => HIST.atras.length), 'adelante', await p.evaluate(() => HIST.adelante.length));
  console.log('10. objetos:', n0, '→ borrar', n1, '→ deshacer', (await objs()).length);
  // 11. zoom con dos dedos (CDP) y con la rueda
  const esc = () => p.$eval('.tv-dib-svg', s => (s.parentElement.innerText.match(/([\d.]+) m/) || [])[1]);
  const caja = await p.$eval('.tv-dib-svg', s => { const r = s.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const antes = await esc();
  const cdp = await ctx.newCDPSession(p);
  const toque = (type, d) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: caja.x - d, y: caja.y, id: 1 }, { x: caja.x + d, y: caja.y, id: 2 }] });
  await toque('touchStart', 30); for (let d = 40; d <= 150; d += 10) await toque('touchMove', d); await toque('touchEnd', 0); await p.waitForTimeout(150);
  const despues = await esc();
  console.log('11. pellizco: escala', antes, '→', despues, '| objetos no cambiaron:', (await objs()).length);
  if (!movil) { await p.mouse.move(caja.x, caja.y); await p.mouse.wheel(0, 600); await p.waitForTimeout(150); console.log('    rueda: escala', await esc()); }
  // 12. buscar punto
  await p.click('.tv-dib-nav button[data-grupo=ver]'); await p.click('.tv-dib-hoja button[data-herr="@buscar"]');
  await p.fill('.tv-dib-buscar input', 'P2');
  console.log('12. búsqueda P2:', await p.$$eval('.tv-dib-pt', d => d.map(x => x.innerText.replace(/\n/g, ' '))));
  await p.click('.tv-dib-pt button'); await p.waitForTimeout(150);
  const c2 = await p.$eval('.tv-dib-marca', c => { const r = c.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  console.log('    marca en el centro del lienzo:', Math.abs(c2[0] - caja.x) < 3 && Math.abs(c2[1] - caja.y) < 3);
  await p.screenshot({ path: process.argv[3] + '_dib.png' });
  await p.click('.tv-dib-nav button[data-grupo=ver]'); await p.click('.tv-dib-hoja button[data-herr="@todo"]'); await p.waitForTimeout(150);
  await herr('medir', 'area'); await p.waitForTimeout(50); await mapa(); await tap(...S(1012, 1006)); await p.waitForTimeout(150);
  await p.screenshot({ path: process.argv[3] + '_todo.png' });
  // 13. DXF
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DXF")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.dxf'); console.log('13. DXF:', dl.suggestedFilename());
  await p.click('text=Cerrar').catch(() => {});
  // 14. segundo dibujo y vía bloqueada
  await p.click('.tv-dibujo button:has-text("Nuevo")'); await p.waitForTimeout(200);
  console.log('14. dibujos:', JSON.stringify((await guardado()).map(d => d.nombre + ':' + d.objs.length)));
  await p.click('.tv-acciones button:has-text("Bloquear")'); await p.waitForTimeout(200);
  await herr('dibujar', 'punto'); await tap(caja.x, caja.y);
  console.log('    bloqueada → aviso:', await p.$eval('.tv-aviso', d => d.innerText).catch(() => 'NO'), '| objetos dibujo 2:', (await guardado())[1].objs.length);
  console.log('    diálogos:', JSON.stringify(dlg));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
