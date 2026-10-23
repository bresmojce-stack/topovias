// Dibujo: pellizco con un dedo FUERA del lienzo (en un botón o en la barra de abajo).
// Antes el lienzo solo veía el dedo que cayó en él y lo tomaba como un toque: al soltarlo ponía un punto o
// el punto de una línea donde no iba. Ahora ese pellizco acerca y aleja, y el dedo del lienzo no dibuja.
//   node pellizco.js <index.html>
const { abrirApp, cargarVia } = require('./base');
(async () => {
  const { b, ctx, p, errs } = await abrirApp();
  let fallas = 0, n = 0; const ok = (bien, txt) => { n++; console.log(n + '. ' + (bien ? 'bien  ' : 'FALLA ') + txt); if (!bien) fallas++; };
  const T = { cotaInicio: "100", cotaFin: "", pendiente: "1", distancia: "50", id: 1 };
  const lat = { modo: "transversal", ancho: "3", modoT: "diferencia", diferencia: "0", pendienteT: "", tramos: [T], absInicio: "" };
  const objs = []; for (let i = 0; i < 20; i++) objs.push({ id: i + 1, t: 'p', x: 1000 + (i % 5) * 10, y: 1000 + Math.floor(i / 5) * 10, nom: String(i + 1) });
  const via = { id: 1, obraId: 5, nombre: "Via 1", absInicio: "0", tramos: [T], intermedias: [], capas: [], sobreancho: { izq: "", der: "" },
    lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [],
    dibujos: [{ id: 2, nombre: 'D', sig: 21, objs }] };
  await cargarVia(p, via);
  await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForSelector('.tv-dib-svg'); await p.waitForTimeout(300);
  await p.click('.tv-dib-nav button[data-grupo=ver]'); await p.click('.tv-dib-hoja button[data-herr="@todo"]'); await p.waitForTimeout(200);
  await p.click('.tv-dib-nav button[data-grupo=dibujar]'); await p.click('.tv-dib-hoja button[data-herr="linea"]'); await p.waitForTimeout(200);
  const caja = await (await p.$('.tv-dib-svg')).boundingBox(), cx = caja.x + caja.width / 2, cy = caja.y + caja.height / 2;
  const cdp = await ctx.newCDPSession(p);
  const toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : pts.map(([x, y], i) => ({ x, y, id: i + 1 })) });
  const estado = () => p.evaluate(() => { typeof vaciarGuardado === 'function' && vaciarGuardado();
    const d = JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0];
    return { objs: d.objs.length, lineas: d.objs.filter(o => o.t !== 'p').length, cmd: document.querySelector('.tv-dib-cmd').textContent.replace(/\s+/g, ' ').slice(0, 24),
      escala: document.querySelector('.tv-dib-escala div').textContent.trim(), hoja: !!document.querySelector('.tv-dib-hoja') }; });

  // primer punto de una línea, puesto con el dedo
  await toque('touchStart', [[cx + 30, cy + 10]]); await toque('touchEnd', []); await p.waitForTimeout(300);
  const inicio = await estado();
  ok(/segundo punto/.test(inicio.cmd) && inicio.objs === 20, 'un toque pone el primer punto de la línea (' + inicio.objs + ' objetos, "' + inicio.cmd.trim() + '")');

  // pellizco con los dos dedos en el lienzo: aleja como siempre
  await toque('touchStart', [[cx - 150, cy], [cx + 150, cy]]);
  for (let i = 1; i <= 10; i++) { await toque('touchMove', [[cx - 150 + 12 * i, cy], [cx + 150 - 12 * i, cy]]); await p.waitForTimeout(16); }
  await toque('touchEnd', []); await p.waitForTimeout(400);
  const dos = await estado();
  ok(dos.escala !== inicio.escala && dos.objs === 20, 'con los dos dedos en el lienzo aleja y no dibuja (' + inicio.escala + ' → ' + dos.escala + ')');

  // pellizco con un dedo sobre un botón o sobre la barra de abajo
  const fuera = async (sel, nombre) => {
    const antes = await estado(), bt = await (await p.$(sel)).boundingBox(), bx = bt.x + bt.width / 2, by = bt.y + bt.height / 2;
    const ax = cx - 150, ay = cy - 60;
    await toque('touchStart', [[ax, ay], [bx, by]]);
    for (let i = 1; i <= 10; i++) { await toque('touchMove', [[ax + (bx - ax) * 0.04 * i, ay + (by - ay) * 0.04 * i], [bx - (bx - ax) * 0.02 * i, by - (by - ay) * 0.02 * i]]); await p.waitForTimeout(16); }
    await toque('touchEnd', []); await p.waitForTimeout(400);
    const d = await estado();
    ok(d.objs === antes.objs && d.lineas === 0 && /segundo punto/.test(d.cmd), 'pellizco con un dedo en ' + nombre + ': no dibuja nada (' + d.objs + ' objetos, "' + d.cmd.trim() + '")');
    ok(d.escala !== antes.escala, 'pellizco con un dedo en ' + nombre + ': la vista se aleja (' + antes.escala + ' → ' + d.escala + ')');
    return d;
  };
  await fuera('.tv-dib-deshacer button', 'el botón Deshacer');
  const tras = await fuera('.tv-dib-nav button[data-grupo=editar]', 'la barra de abajo');
  ok(!tras.hoja, 'el dedo de afuera tampoco abre el panel de herramientas');

  // y la línea se sigue pudiendo terminar: el segundo punto queda donde se toca
  await toque('touchStart', [[cx - 60, cy + 40]]); await toque('touchEnd', []); await p.waitForTimeout(400);
  const fin = await estado();
  ok(fin.lineas === 1 && /primer punto/.test(fin.cmd), 'después un toque normal termina la línea (' + fin.lineas + ' línea)');

  console.log(fallas ? fallas + ' falla(s).' : 'Todo bien (pellizco).');
  console.log(errs.join('\n') || 'no errors');
  await b.close();
  process.exit(fallas ? 1 : 0);
})();
