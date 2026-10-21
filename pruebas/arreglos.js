const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  // funciones puras
  console.log(await p.evaluate(() => {
    const r = [], calc = e => { try { const x = evaluarExpresion(e, 1); return (x.par ? x.par.tipo + ' ' : '') + Math.round(x.v * 1e6) / 1e6; } catch (er) { return 'ERROR: ' + er.message; } };
    for (const e of ['Pol(3,4)+1', 'Pol(3,4)', '1÷2π', '100÷2π', '2π÷2π', '3(4+1)÷5', '-2^2', '2^3^2', '1.2.3', "2°30", "53°07'48\"", '√(4,9)', '√(16)', '2+3)']) r.push(e + ' → ' + calc(e));
    const sq = { id: 1, t: 'pl', c: true, v: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }] };
    const ar = d => { const x = desfasar(sq, d, 'adentro'); return x ? DIB.area(x.v) : 'no cabe'; };
    r.push('desfase adentro 4 → ' + ar(4) + ' | 5 → ' + ar(5) + ' | 6 → ' + ar(6) + ' | afuera 1 → ' + DIB.area(desfasar(sq, 1, 'afuera').v));
    const tri = triangular([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }]);
    r.push('relleno con punto repetido y alineado: ' + tri.length + ' triángulos, área ' + tri.reduce((s, t) => s + DIB.area(t), 0));
    const ci = { id: 5, t: 'ci', c: { x: 0, y: 0 }, r: 5, col: '#DC2626' }, ln = { id: 6, t: 'l', a: { x: -10, y: 0 }, b: { x: 10, y: 0 } };
    const rc = recortar(ci, [ci, ln], { x: 0, y: -5 }); r.push('recortar círculo: ' + rc.nuevos[0].t + ' color ' + rc.nuevos[0].col);
    const dxf = crearDXF({ objs: [{ id: 1, t: 'eje', v: [{ x: 0, y: 0 }, { x: 50, y: 0 }], abs0: 0, paso: 10 }, { id: 2, t: 'pl', c: true, som: 'rayado', v: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }] }, { id: 3, t: 'l', a: { x: 0, y: 0 }, b: { x: 2000, y: 0 } }] });
    const lineas = dxf.split('\r\n').filter((x, i, a) => x === 'LINE' && a[i - 1] === '0').length;
    r.push('DXF: líneas (marcas del eje + rayado de un cuadro de 1 m junto a una línea de 2 km): ' + lineas);
    return r.join('\n');
  }));
  // guardado: sin IndexedDB y sin espacio en localStorage → no se borra la copia buena
  console.log(await p.evaluate(() => {
    localStorage.setItem('prueba_k', '"copia buena"'); const idbAntes = DATOS.idb; DATOS.idb = false;
    const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'prueba_k') throw new Error('QuotaExceeded'); return orig.call(this, k, v); };
    guardarDato('prueba_k', 'nuevo y grande'); if (typeof vaciarGuardado === 'function') vaciarGuardado(); Storage.prototype.setItem = orig; DATOS.idb = idbAntes;
    return 'sin espacio y sin IndexedDB, queda: ' + localStorage.getItem('prueba_k') + ' | estado: ' + (DATOS.guardado.ok ? 'guardado' : 'NO se pudo guardar (avisa)');
  }));
  // UI: eje + teclado en abscisa, luego deshacer el eje (antes la app quedaba en blanco)
  const T = () => ({ cotaInicio: "100", cotaFin: "", pendiente: "1", distancia: "50", id: 1 });
  const lat = { modo: "transversal", ancho: "3", modoT: "diferencia", diferencia: "0", pendienteT: "", tramos: [T()], absInicio: "" };
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho: { izq: "", der: "" }, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    coordsEje: [{ id: 1, norte: "0", este: "0" }, { id: 2, norte: "0", este: "50" }], dibujos: [{ id: 9, nombre: "D", sig: 3, objs: [{ id: 1, t: "p", x: 0, y: 0, nom: "A" }, { id: 2, t: "p", x: 40, y: 30, nom: "B" }] }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'O' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(400);
  const herr = async (g, id) => { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.click(`.tv-dib-hoja button[data-herr="${id}"]`); await p.waitForTimeout(120); };
  await herr('dibujar', '@eje'); await p.waitForTimeout(1000);
  await herr('dibujar', 'punto'); await p.click('.tv-dib-cmd button:has-text("Escribir")'); await p.click('.tv-dib-teclado button:has-text("Abscisa y desplaz.")');
  await p.click('.tv-dib-deshacer button[data-accion=deshacer]'); await p.waitForTimeout(300);
  console.log('deshacer el eje con el teclado abierto: app viva', !!(await p.$('.tv-dib-svg')), '| teclado dice:', await p.$eval('.tv-dib-teclado', d => d.innerText.includes('Ya no hay eje')).catch(() => 'cerrado'));
  // rectángulo de tamaño cero
  await p.click('.tv-dib-teclado button:has-text("Cerrar")').catch(() => {});
  await herr('dibujar', 'rect');
  const c = await p.$$eval('.tv-dib-svg > g > circle', cs => cs.slice(0, 1).map(x => { const r = x.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }));
  const n0 = await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs.length);
  await p.touchscreen.tap(c[0][0] + 30, c[0][1] - 30); await p.waitForTimeout(150); await p.touchscreen.tap(c[0][0] + 30, c[0][1] - 30); await p.waitForTimeout(200);
  console.log('rectángulo con dos toques en el mismo sitio: objetos', n0, '→', await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs.length), '| aviso:', await p.$eval('.tv-aviso', d => d.innerText).catch(() => ''));
  // pellizco y luego un dedo en Elegir: la vista no vuelve atrás
  await herr('editar', 'elegir');
  const esc = () => p.$eval('.tv-dib-svg', s => (s.parentElement.innerText.match(/([\d.]+) m/) || [])[1]);
  const box = await p.$eval('.tv-dib-svg', s => { const r = s.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const cdp = await ctx.newCDPSession(p), ev = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const antes = await esc();
  await ev('touchStart', [{ x: box.x - 30, y: box.y, id: 1 }, { x: box.x + 30, y: box.y, id: 2 }]);
  for (let d = 40; d <= 140; d += 10) await ev('touchMove', [{ x: box.x - d, y: box.y, id: 1 }, { x: box.x + d, y: box.y, id: 2 }]);
  await ev('touchEnd', [{ x: box.x - 140, y: box.y, id: 1 }]);   // se levanta el dedo 2
  for (let d = 0; d <= 60; d += 10) await ev('touchMove', [{ x: box.x - 140 + d, y: box.y + d, id: 1 }]);
  await ev('touchEnd', []); await p.waitForTimeout(200);
  console.log('pellizco y luego arrastre con un dedo: escala', antes, '→', await esc(), '(no debe volver a', antes + ')');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
