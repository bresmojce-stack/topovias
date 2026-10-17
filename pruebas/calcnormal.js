const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, acceptDownloads: true, hasTouch: true, isMobile: movil });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  p.on('dialog', d => d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  // dos obras para que se vea el inicio
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'Carambolo' }, { id: 6, nombre: 'Tamarindo' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999)); localStorage.setItem('topovias_standalone', '[]'); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999)); });
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  console.log('1. inicio:', await p.$$eval('button[data-herramienta]', bs => bs.map(b => b.innerText.split('\n')[0])));
  await p.click('button[data-herramienta=calc]'); await p.waitForTimeout(200);
  console.log('   opciones:', await p.$$eval('.tv-calc-opciones button', bs => bs.map(b => b.innerText).join(' / ')), '| abre en:', await p.$eval('.tv-calc-opciones .activa', b => b.innerText));
  // 2. cuentas escritas
  const cuenta = async e => { await p.fill('.tv-calc-expr', e); await p.press('.tv-calc-expr', 'Enter'); await p.waitForTimeout(80); return p.$eval('.tv-calc-res', d => d.innerText.replace(/\n/g, ' | ')); };
  for (const e of ['2+3×4', '(2+3)×4', '2^10', '√(16)', '√16+1', 'sin(30)', 'cos(60', '3²', '-2^2', '2(3+1)', '2π', '1÷3', '10÷0', '((2+3)', '2+3)', 'Pol(30,40)', 'Pol(-30,-40)', 'Rec(50,53°07\'48.37")', 'Rec(50,90)', 'tan⁻¹(1)', 'Ans×2', '5!', 'log(1000)+ln(1)', '0.1+0.2'])
    console.log('2.', e.padEnd(26), '→', await cuenta(e));
  // 3. con el teclado de la app: Pol( 3 0 , 4 0 ) =
  await p.click('[data-k=AC]');
  for (const k of ['Pol(', '3', '0', ',', '4', '0', ')', '=']) await p.click(`.tv-calc-tecla[data-k="${k}"]`);
  console.log('3. teclas Pol(30,40) =', await p.$eval('.tv-calc-res', d => d.innerText.replace(/\n/g, ' | ')));
  // después de "=", un operador sigue con Ans
  for (const k of ['×', '2', '=']) await p.click(`.tv-calc-tecla[data-k="${k}"]`);
  console.log('   × 2 = (sigue con Ans):', await p.$eval('.tv-calc-expr', i => i.value), '→', await p.$eval('.tv-calc-res', d => d.innerText));
  // grados°minutos'segundos con la tecla
  await p.click('[data-k=AC]');
  const teclaK = k => p.evaluate(k => [...document.querySelectorAll('.tv-calc-tecla')].find(b => b.dataset.k === k).click(), k);
  for (const k of ['sin(', '3', '0', "°'\"", '0', "°'\"", '0', "°'\"", ')', '=']) { await teclaK(k); await p.waitForTimeout(30); }
  console.log('   sin(30°0\'0") =', await p.$eval('.tv-calc-expr', i => i.value), '→', await p.$eval('.tv-calc-res', d => d.innerText));
  // decimales: Todos
  await p.click('.tv-calc-dec:has-text("Todos")'); await cuenta('1÷3'); console.log('4. 1÷3 con todos los decimales:', await p.$eval('.tv-calc-res', d => d.innerText), '| Rec(50,90):', await cuenta('Rec(50,90)'));
  await p.click('.tv-calc-dec:has-text("3")');
  console.log('   historial:', (await p.$$eval('.tv-calc-hist', hs => hs.length)), 'cuentas');
  await p.screenshot({ path: process.argv[3] + '_calc.png', fullPage: true });
  // 5. dibujo libre
  await p.click('button:has-text("Inicio")'); await p.click('button[data-herramienta=dibujo]'); await p.waitForTimeout(300);
  await p.click('button:has-text("Crear el primer dibujo")'); await p.waitForTimeout(300);
  await p.click('.tv-dib-nav button[data-grupo=dibujar]'); await p.click('.tv-dib-hoja button[data-herr="punto"]');
  await p.click('.tv-dib-cmd button:has-text("Escribir")');
  await p.fill('.tv-dib-teclado input[placeholder="1000.000"] >> nth=0', '500'); await p.fill('.tv-dib-teclado input[placeholder="1000.000"] >> nth=1', '700'); await p.click('.tv-dib-teclado button[type=submit]');
  await p.waitForTimeout(300);
  const datos = await p.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone')));
  console.log('5. guardado:', JSON.stringify(datos.map(v => ({ id: v.id, libre: v.libre, dibujos: (v.dibujos || []).map(d => d.nombre + ':' + d.objs.length) }))));
  console.log('   botón deshacer flotante oculto:', !(await p.$('.tv-deshacer')));
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
  console.log('   tras recargar sigue en el dibujo libre:', await p.$eval('main', m => m.innerText.includes('Dibujo libre')), '| objetos:', await p.$$eval('.tv-dib-svg circle[fill="#DC2626"]', c => c.length));
  await p.click('button:has-text("Inicio")'); await p.waitForTimeout(200);
  const ini = await p.$eval('main', m => m.innerText);
  console.log('6. inicio: obras', (ini.match(/Sin vías todavía/g) || []).length, '| no aparece como vía:', !ini.includes('Dibujos libres'), '| conteo:', (ini.match(/\d+ obras · \d+ vías?/) || [])[0]);
  // copia de seguridad incluye los dibujos libres
  const copia = await p.evaluate(() => { const c = crearCopiaSeguridad(HIST.actual.obras, HIST.actual.proyectos); return c.blob.text(); });
  console.log('   copia de seguridad con dibujo libre:', JSON.parse(copia).vias.some(v => v.libre && v.dibujos.length));
  await p.screenshot({ path: process.argv[3] + '_inicio.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
