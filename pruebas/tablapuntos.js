// Tabla de puntos (Dibujar): pegar desde Excel, consecutivos y nombres propios, filas malas (rojo, no se dibujan,
// quedan en la tabla) y avisos (ámbar, sí se dibujan), polilínea en orden, un solo deshacer, todo en una fila en el celular
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
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    dibujos: [{ id: 7, nombre: "D", sig: 3, objs: [{ id: 1, t: "p", x: 1063860, y: 863100, nom: "P1" }, { id: 2, t: "p", x: 1063900, y: 863140, nom: "P2" }] }] };
  const tb = process.env.TB || ''; await p.evaluate(([pr, tb]) => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'O'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); if (tb) localStorage.setItem('tv_tema', tb); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, [pr, tb]);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(500);
  const dib = () => p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0]);
  const aviso = () => p.$eval('.tv-aviso', d => d.innerText).catch(() => '');
  // 1. funciones puras: números y pegado
  console.log('1. numTabla:', await p.evaluate(() => ["863104.065", "863104,065", " -12.5 ", "12,5m", "1.063.872", "", "abc"].map(numTabla).join(' | ')));
  console.log('   pegar:', await p.evaluate(() => JSON.stringify(pegarTablaPuntos("PUNTO\tNORTE\tESTE\nA1\t10.5\t20.5\n7 863100.1 1063800.2\n100.1;200.2;3.5\nB,1.5,2.5\n\n"))));
  // 2. abrir la tabla y pegar desde Excel (encabezado, sin nombre, nombre propio, un norte con un dígito de menos, texto, repetidos, cotas)
  await p.click('.tv-dib-nav button[data-grupo=dibujar]'); await p.click('.tv-dib-hoja button[data-herr="@tabla"]'); await p.waitForTimeout(200);
  console.log('2. abierta:', await p.$eval('.tv-dib-tabla', d => d.innerText.split('\n').slice(0, 2).join(' / ')).catch(() => 'NO'));
  await p.click('.tv-dib-tabla button:has-text("Pegar desde Excel")');
  const txt = ["PUNTO\tNORTE\tESTE\tCOTA", "\t863104.065\t1063872.155\t1201.5", "\t863106.890\t1063871.145\t", "BM1\t863126.620\t1063864.110\t1203.25", "\t863125.480\t1063861.330\tx",
    "\t86312.540\t1063866.890\t", "\t863120,5\t10638a7\t", "BM1\t863130.000\t1063870.000\t", "\t863100\t1063860\t"].join('\n');
  await p.fill('.tv-dib-tabla textarea', txt); await p.click('.tv-dib-tabla button:has-text("Agregar a la tabla")'); await p.waitForTimeout(200);
  console.log('   aviso:', await aviso());
  console.log('   filas:', await p.$$eval('.tv-dib-tabla .tv-tabla-celda', c => c.length), '| rojas:', await p.$$eval('.tv-tabla-mala', c => c.length), '| ámbar:', await p.$$eval('.tv-tabla-aviso', c => c.length));
  const lista = await p.$eval('.tv-dib-tabla', d => d.innerText.split('\n').filter(l => /^[✕⚠]/.test(l)));
  lista.forEach(l => console.log('   ', l));
  console.log('   botón:', await p.$eval('.tv-dib-tabla button:has-text("Dibujar todos")', x => x.innerText));
  console.log('   Norte/Este cortados:', await p.$$eval('.tv-dib-tabla input[aria-label^="Norte"], .tv-dib-tabla input[aria-label^="Este"]', c => c.filter(i => i.scrollWidth > i.clientWidth + 1).length), process.env.MEDIR ? await p.$$eval('.tv-dib-tabla input[aria-label$=" fila 1"]', c => c.map(i => i.clientWidth + '/' + i.scrollWidth).join(' ')) + ' panel ' + await p.$eval('.tv-dib-tabla', d => d.clientWidth) : '');
  console.log('   nombre sugerido fila 1:', await p.$eval('.tv-dib-tabla input[aria-label="Nombre fila 1"]', i => i.placeholder));
  await p.screenshot({ path: process.argv[3] + '_tabla.png' });
  // 3. dibujar: un solo paso, polilínea en orden, sig, lo malo queda con su nombre
  const n0 = (await dib()).objs.length;
  await p.click('.tv-dib-tabla button:has-text("Dibujar todos")'); await p.waitForTimeout(400);
  const d1 = await dib(), nuevos = d1.objs.slice(n0);
  console.log('3. nuevos:', nuevos.map(o => o.t === 'p' ? o.nom + (o.z !== undefined ? '(z!)' : '') : o.t + ' ' + o.v.length + (o.c ? ' cerrada' : ' abierta')).join(', '), '| sig:', d1.sig);
  console.log('   aviso:', await aviso());
  console.log('   quedan en la tabla:', await p.$$eval('.tv-dib-tabla input[aria-label^="Nombre fila"]', c => c.map(i => i.value).join(', ')).catch(() => 'tabla cerrada'));
  await p.screenshot({ path: process.argv[3] + '_dibujado.png' });
  // 4. corregir la fila que quedó y dibujarla: conserva su nombre
  await p.fill('.tv-dib-tabla input[aria-label="Norte fila 1"]', '863112.540'); await p.waitForTimeout(100);
  await p.fill('.tv-dib-tabla input[aria-label="Norte fila 2"]', '863120.5'); await p.fill('.tv-dib-tabla input[aria-label="Este fila 2"]', '1063867');
  console.log('4. botón:', await p.$eval('.tv-dib-tabla button:has-text("Dibujar todos")', x => x.innerText));
  const n1 = (await dib()).objs.length; await p.click('.tv-dib-tabla button:has-text("Dibujar todos")'); await p.waitForTimeout(400);
  const d2 = await dib(); console.log('   nuevos:', d2.objs.slice(n1).map(o => o.t === 'p' ? o.nom : o.t).join(', '), '| tabla abierta:', !!(await p.$('.tv-dib-tabla')), '| sig:', d2.sig);
  // 5. deshacer quita lo último de una vez (los 2 puntos y su línea)
  await p.click('[data-accion=deshacer]'); await p.waitForTimeout(300);
  console.log('5. deshacer quita', d2.objs.length - (await dib()).objs.length, 'objetos');
  // 6. cerrar figura con nombres propios, letra V desde 1
  await p.click('.tv-dib-nav button[data-grupo=dibujar]'); await p.click('.tv-dib-hoja button[data-herr="@tabla"]'); await p.waitForTimeout(200);
  await p.click('.tv-dib-tabla button:has-text("Escribir cada nombre")');
  for (const [i, n, e, nm] of [[1, '863200', '1063900', 'E1'], [2, '863210', '1063900', ''], [3, '863210', '1063910', 'E3']]) {
    if (nm) await p.fill(`.tv-dib-tabla input[aria-label="Nombre fila ${i}"]`, nm);
    await p.fill(`.tv-dib-tabla input[aria-label="Norte fila ${i}"]`, n); await p.fill(`.tv-dib-tabla input[aria-label="Este fila ${i}"]`, e);
  }
  await p.click('.tv-dib-tabla label:has-text("Cerrar la figura")');
  console.log('6. avisos:', (await p.$eval('.tv-dib-tabla', d => d.innerText.split('\n').filter(l => /^[✕⚠]/.test(l)))).join(' / '));
  const n2 = (await dib()).objs.length; await p.click('.tv-dib-tabla button:has-text("Dibujar todos")'); await p.waitForTimeout(400);
  const d3 = await dib(); console.log('   nuevos:', d3.objs.slice(n2).map(o => o.t === 'p' ? o.nom : o.t + ' ' + o.v.length + (o.c ? ' cerrada' : ' abierta')).join(', '), '| sig:', d3.sig);
  console.log('   recordado:', await p.evaluate(() => localStorage.getItem('topovias_standalone_dibTablaOp')));
  // 7. botón de arriba (junto a DXF) y todo en una fila: cada fila de la tabla ocupa una sola altura de casilla
  console.log('7. barra de arriba cabe:', await p.$eval('button[title^="Tabla de puntos"]', b => { const f = b.parentElement; return f.scrollWidth <= f.clientWidth + 1; }));
  await p.click('button[title^="Tabla de puntos"]'); await p.waitForTimeout(200);
  console.log('   filas en una línea:', await p.$$eval('.tv-dib-tabla input[aria-label^="Nombre fila"]', c => c.every(i => { const n = i.parentElement.querySelector('input[aria-label^="Este"]'); return n && Math.abs(n.getBoundingClientRect().top - i.getBoundingClientRect().top) < 2; })), '| columna de cota:', await p.$$eval('.tv-dib-tabla input[aria-label^="Cota"]', c => c.length));
  await p.click('.tv-dib-tabla button[aria-label="Cerrar"]');
  await p.screenshot({ path: process.argv[3] + '_final.png' });
  console.log('errores:', errs.length ? errs : 'ninguno');
  await b.close();
})();
