const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3,0",modoT:"diferencia",diferencia:"-0,06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  // guardado con comas (como habría quedado antes del arreglo)
  const proj = { id: 1, obraId: 5, nombre: "EJE COMAS", absInicio: "0", tramos: [T("965,59","","-2","27,5"), T("","","","")], intermedias: [],
    capas: [{nombre:"asfalto",espesor:"0,05",id:1},{nombre:"base",espesor:"0,15",id:2}], sobreancho: { izq: "0,5", der: "0,4" }, lateralIzq: lat, lateralDer: lat,
    parqueaderos: [], nivelaciones: [], volumenes: [] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); localStorage.setItem('topovias_standalone__t', String(Date.now() + 100000)); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
  const guardado = await p.evaluate(() => { const v = leerDato('topovias_standalone')[0]; return [v.tramos[0].cotaInicio, v.tramos[0].distancia, v.capas[0].espesor, v.sobreancho.izq, v.lateralIzq.ancho, v.lateralIzq.diferencia]; });
  console.log('guardado con comas, al abrir:', JSON.stringify(guardado));
  // escribir con coma, tecla por tecla, en la distancia del segundo tramo
  const inputs = await p.$$('main input');
  let campo = null;
  for (const el of inputs) { const v = await el.inputValue(); if (v === '27.5') { campo = el; break; } }
  await campo.click({ clickCount: 3 }); await campo.press('Backspace');
  await campo.type('30,25', { delay: 30 });
  console.log('campo después de escribir 30,25:', await campo.inputValue());
  // escribir en medio: poner el cursor después del 3 y escribir ",7"
  await campo.click({ clickCount: 3 }); await campo.press('Backspace'); await campo.type('35', { delay: 20 });
  await campo.press('ArrowLeft'); await campo.type(',', { delay: 20 });
  console.log('cursor en medio (3|5 + coma):', await campo.inputValue());
  await p.waitForTimeout(400);
  const final = await p.evaluate(() => leerDato('topovias_standalone')[0].tramos[0].distancia);
  console.log('guardado:', final);
  await p.click('button:has-text("CALCULAR")').catch(() => {}); await p.waitForTimeout(300);
  const t = await p.evaluate(() => { const v = leerDato('topovias_standalone')[0]; const tb = generarTabla(v); return tb.map(r => r.absFormato + ' ' + r.cotaEje).slice(-2); });
  console.log('tabla:', JSON.stringify(t));
  // nombre con coma no numérico no se toca
  await p.click('.tv-tabs button[data-tab=via]'); await p.waitForTimeout(200);
  const nom = (await p.$$('main input'))[0]; await nom.click({ clickCount: 3 }); await nom.type('Base, granular', { delay: 10 });
  console.log('texto con coma no se toca:', await nom.inputValue());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
