const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const objs0 = [{ id: 1, t: "p", x: 0, y: 0, nom: "A" }, { id: 2, t: "p", x: 40, y: 30, nom: "B" }, { id: 3, t: "l", a: { x: 0, y: 0 }, b: { x: 40, y: 30 } },
    { id: 4, t: "pl", c: true, som: "rayado", v: [{ x: 50, y: 0 }, { x: 70, y: 0 }, { x: 70, y: 10 }, { x: 50, y: 10 }] }];
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [], dibujos: [{ id: 7, nombre: "D", sig: 3, objs: objs0 }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'O'}])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999));
    localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via',obraId:5})); }, pr);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(500);
  const c = await p.$$eval('.tv-dib-svg > g > circle', cs => cs.slice(0, 2).map(x => { const r = x.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }));
  const k = (c[1][0] - c[0][0]) / 40, S = (E, N) => [c[0][0] + E * k, c[0][1] - N * k];
  await p.click('.tv-dib-nav button[data-grupo=editar]'); await p.click('.tv-dib-hoja button[data-herr="borrar"]');
  await p.mouse.move(...S(20, 15)); await p.waitForTimeout(150);
  const estado = async () => ({ halo: await p.$eval('.tv-dib-halo line, .tv-dib-halo polygon', e => e.getAttribute('stroke')).catch(() => null), cursor: !!(await p.$('.tv-dib-cursor')), css: await p.$eval('.tv-dib-svg', s => s.style.cursor) });
  console.log('1. Borrar, mouse sobre la línea:', JSON.stringify(await estado()));
  await p.screenshot({ path: process.argv[3] + '_borrar.png', clip: { x: S(-5, 35)[0], y: S(-5, 35)[1], width: 90 * k, height: 45 * k } });
  await p.mouse.move(...S(20, 25)); await p.waitForTimeout(150); console.log('2. mouse lejos de todo:', JSON.stringify(await estado()));
  await p.click('.tv-dib-nav button[data-grupo=editar]'); await p.click('.tv-dib-hoja button[data-herr="elegir"]');
  await p.mouse.move(...S(60, 5)); await p.waitForTimeout(150); console.log('3. Elegir, mouse dentro del rectángulo:', JSON.stringify(await estado()), '| sigue rayado:', await p.$eval('.tv-dib-svg polygon[fill^="url(#tv-rayado"]', () => true).catch(() => false));
  await p.screenshot({ path: process.argv[3] + '_elegir.png', clip: { x: S(-5, 35)[0], y: S(-5, 35)[1], width: 90 * k, height: 45 * k } });
  await p.click('.tv-dib-nav button[data-grupo=dibujar]'); await p.click('.tv-dib-hoja button[data-herr="linea"]');
  await p.mouse.move(...S(20, 15)); await p.waitForTimeout(150); console.log('4. Línea (pide puntos): halo', JSON.stringify(await estado()));
  await p.mouse.move(1270, 890); await p.waitForTimeout(100); console.log('5. mouse fuera del lienzo:', JSON.stringify(await estado()));
  // borrar con un clic sobre la línea resaltada
  await p.click('.tv-dib-nav button[data-grupo=editar]'); await p.click('.tv-dib-hoja button[data-herr="borrar"]');
  await p.mouse.click(...S(20, 15)); await p.waitForTimeout(200);
  await p.click('.tv-dib-nav button[data-grupo=editar]'); await p.click('.tv-dib-hoja button[data-herr="recortar"]'); await p.mouse.move(...S(60, 0)); await p.waitForTimeout(150); console.log('5b. Recortar no resalta:', JSON.stringify(await estado()));
  await p.click('.tv-dib-nav button[data-grupo=editar]'); await p.click('.tv-dib-hoja button[data-herr="borrar"]'); await p.mouse.click(...S(60, 0)); await p.waitForTimeout(200);
  console.log('6. tras clic en Borrar:', await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone'))[0].dibujos[0].objs.map(o => o.t).join()));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
