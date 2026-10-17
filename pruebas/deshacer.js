const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const proj = { id: 1, obraId: 5, nombre: "EJE 7", absInicio: "0", tramos: [T("965.59","","-2","27.5"), T("965.04","","2","30")], intermedias: [],
    capas: [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}], lateralIzq: lat, lateralDer: lat, parqueaderos: [], nivelaciones: [], volumenes: [] };
  await p.evaluate(pr => { localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Obra'}])); localStorage.setItem('topovias_standalone_activo', '1'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'})); localStorage.setItem('topovias_standalone__t', String(Date.now() + 100000)); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 100000)); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
  const barra = async () => (await p.$('.tv-deshacer')) ? 'visible' : 'oculta';
  const dist = () => p.evaluate(() => leerDato('topovias_standalone')[0].tramos.map(t => t.distancia).join(','));
  console.log('al abrir, barra:', await barra());
  // escribir un número completo = un solo paso
  const inputs = await p.$$('main input'); let campo;
  for (const el of inputs) if (await el.inputValue() === '27.5') { campo = el; break; }
  await campo.click({ clickCount: 3 }); await campo.type('31.25', { delay: 60 });
  console.log('después de escribir 31.25:', await dist(), '| barra:', await barra());
  await p.waitForTimeout(1000);
  // borrar el segundo tramo
  const n0 = await p.evaluate(() => leerDato('topovias_standalone')[0].tramos.length);
  const borrar = await p.$$('main button:has-text("✕")'); await borrar[borrar.length - 1].click(); await p.waitForTimeout(300);
  console.log('tramos antes/después de borrar:', n0, await p.evaluate(() => leerDato('topovias_standalone')[0].tramos.length));
  await p.click('.tv-deshacer button:has-text("Deshacer")'); await p.waitForTimeout(300);
  console.log('deshacer 1 → tramos:', await p.evaluate(() => leerDato('topovias_standalone')[0].tramos.length), 'dist:', await dist());
  await p.click('.tv-deshacer button:has-text("Deshacer")'); await p.waitForTimeout(300);
  console.log('deshacer 2 → dist:', await dist(), '| campo muestra:', await campo.inputValue());
  await p.click('.tv-deshacer button[title^="Rehacer"]'); await p.waitForTimeout(300);
  console.log('rehacer → dist:', await dist());
  // Tabla se recalcula tras deshacer
  await p.click('.tv-deshacer button:has-text("Deshacer")'); await p.waitForTimeout(300);
  await p.click('.tv-tabs button[data-tab=resultado]'); await p.waitForTimeout(200);
  console.log('tabla última abscisa:', await p.$$eval('main table tbody tr', trs => trs[trs.length - 1].cells[0].innerText));
  // eliminar la vía desde la obra y recuperarla
  await p.click('.tv-volver'); await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[3] + '_obra.png' });
  const elim = await p.$('main button:has-text("Eliminar")'); if (elim) { await elim.click(); await p.waitForTimeout(300); }
  console.log('vías tras eliminar:', await p.evaluate(() => leerDato('topovias_standalone').length));
  await p.click('.tv-deshacer button:has-text("Deshacer")'); await p.waitForTimeout(300);
  console.log('vías tras deshacer:', await p.evaluate(() => leerDato('topovias_standalone').length), '| en pantalla:', await p.$$eval('main', m => m[0].innerText.includes('EJE 7')));
  await p.screenshot({ path: process.argv[3] + '_recuperada.png' });
  // Ctrl+Z en PC
  await p.click('main button:has-text("Eliminar")').catch(()=>{}); await p.waitForTimeout(300);
  await p.mouse.click(5, 300); await p.keyboard.press('Control+z'); await p.waitForTimeout(300);
  console.log('Ctrl+Z recupera:', await p.evaluate(() => leerDato('topovias_standalone').length));
  // tras recargar, sigue guardado lo último
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  console.log('tras recargar, vías:', await p.evaluate(() => leerDato('topovias_standalone').length), '| barra:', await barra());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
