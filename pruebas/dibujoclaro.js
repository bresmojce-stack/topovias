// Dibujo: auto acotar un solo lado, diámetro del círculo, acotar solo lo elegido, descomponer una figura y regenerar la imagen
const { abrirApp, cargarVia, leerVias, cerrar } = require('./base');
(async () => {
  const { b, p, errs, movil } = await abrirApp();
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"50",id:1});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",pendienteT:"",tramos:[T()],absInicio:""};
  const R = (x0, y0, w, hh) => [{ x: x0, y: y0 }, { x: x0 + w, y: y0 }, { x: x0 + w, y: y0 + hh }, { x: x0, y: y0 + hh }];
  const objs0 = [{ id: 1, t: "p", x: 0, y: 0, nom: "A" }, { id: 2, t: "p", x: 40, y: 30, nom: "B" },
    { id: 3, t: "pl", c: true, forma: "rect", v: R(0, 0, 17, 11) },
    { id: 4, t: "l", a: { x: 30, y: 0 }, b: { x: 40, y: 0 } },
    { id: 8, t: "pl", c: false, v: [{ x: 0, y: 20 }, { x: 20, y: 20 }, { x: 20, y: 30 }] },
    { id: 9, t: "ci", c: { x: 55, y: 10 }, r: 5 },
    { id: 10, t: "ar", c: { x: 55, y: 25 }, r: 5, a1: 0, a2: Math.PI }];
  const pr = { id: 1, obraId: 5, nombre: "V", absInicio: "0", tramos: [T()], intermedias: [], capas: [], sobreancho:{izq:"",der:""}, lateralIzq: lat, lateralDer: lat, parqueaderos: [], bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [],
    dibujos: [{ id: 7, nombre: "D", sig: 3, objs: objs0 }] };
  await cargarVia(p, pr);
  await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(500);
  const objs = async () => (await leerVias(p))[0].dibujos[0].objs;
  const dib = async () => (await leerVias(p))[0].dibujos[0];
  const herr = async (g, id) => { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.click(`.tv-dib-hoja button[data-herr="${id}"]`); await p.waitForTimeout(150); };
  const tap = async (x, y) => { if (movil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(150); };
  let M; const mapa = async () => { const c = await p.$$eval('.tv-dib-svg > g > circle', cs => cs.slice(0, 2).map(x => { const r = x.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })); M = { x0: c[0][0], y0: c[0][1], k: (c[1][0] - c[0][0]) / 40 }; };
  const tapW = async (E, N) => { await mapa(); await tap(M.x0 + E * M.k, M.y0 - N * M.k); };
  const aviso = () => p.$eval('.tv-aviso', d => d.innerText).catch(() => '');
  const desc = o => o.t === 'cota' ? 'cota ' + Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y).toFixed(3) + (o.d < 0 ? '(-)' : '(+)') : o.t === 'tx' ? '"' + o.s + '"' : o.t;
  const nuevos = async (n0) => (await objs()).slice(n0).map(desc).join(', ');
  let n0;
  await herr('medir', 'autoacotar');
  // 1. Un lado: solo la medida del lado tocado (el rectángulo 17×11 tiene 4 lados)
  await p.click('.tv-dib-cmd button:has-text("Un lado")');
  n0 = (await objs()).length; await tapW(8, 0.2); console.log('1. un lado del rectángulo:', await nuevos(n0));
  n0 = (await objs()).length; await tapW(17, 5); console.log('2. otro lado:', await nuevos(n0));
  await p.click('.tv-dib-cmd button:has-text("Un lado")');
  // 3. círculo: el diámetro como cota
  n0 = (await objs()).length; await tapW(60, 10); console.log('3. círculo:', await nuevos(n0));
  // 4. acotar solo lo elegido
  await herr('editar', 'seleccionar'); await tapW(60, 10);
  n0 = (await objs()).length; await p.click('.tv-dib-cmd button:has-text("Acotar (1)")'); await p.waitForTimeout(200);
  console.log('4. acotar elegidos (solo el círculo):', await nuevos(n0), '|', await aviso());
  // 5. descomponer: el rectángulo pasa a 4 líneas y deshacer lo vuelve de una vez
  await p.waitForTimeout(900);
  await herr('editar', 'descomponer');
  console.log('5. barra:', await p.$eval('.tv-dib-cmd', d => d.innerText.replace(/\n/g, ' ')));
  const antes = await objs(); await tapW(8, 0.2);
  const des = await objs();
  console.log('   rectángulo:', antes.filter(o => o.t === 'pl' && o.forma === 'rect').length, '→', des.filter(o => o.t === 'pl' && o.forma === 'rect').length,
    '| líneas nuevas:', des.filter(o => o.t === 'l').length - antes.filter(o => o.t === 'l').length, '|', await aviso());
  const largos = des.filter(o => o.t === 'l').slice(-4).map(o => Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y).toFixed(3)).join(' ');
  console.log('   largos:', largos);
  await p.waitForTimeout(900); await p.click('[data-accion=deshacer]'); await p.waitForTimeout(300);
  console.log('6. deshacer: rectángulo de vuelta:', (await objs()).filter(o => o.t === 'pl' && o.forma === 'rect').length, '| líneas:', (await objs()).filter(o => o.t === 'l').length);
  // 7. descomponer con varios elegidos
  await herr('editar', 'seleccionar'); await tapW(8, 0.2); await tapW(10, 20);
  await p.click('.tv-dib-cmd button:has-text("Descomponer")'); await p.waitForTimeout(200);
  console.log('7. descomponer elegidos:', (await objs()).filter(o => o.t === 'pl').length, 'figuras quedan |', (await objs()).filter(o => o.t === 'l').length, 'líneas');
  // 8. regenerar imagen: quita lo que haya quedado de un zoom a medias y vuelve a pintar
  await p.evaluate(() => { const s = document.querySelector('.tv-dib-svg'); s.style.transform = 'translate(40px, 30px) scale(1.7)'; });
  await p.click('[data-accion=regenerar]'); await p.waitForTimeout(300);
  console.log('8. regenerar: transform =', JSON.stringify(await p.$eval('.tv-dib-svg', s => s.style.transform)), '|', await aviso());
  // 9. de lejos las cotas chicas no se amontonan: el texto se esconde cuando no cabe
  await p.evaluate(() => { const s = document.querySelector('.tv-dib-svg'); const r = s.getBoundingClientRect(); for (let i = 0; i < 14; i++) s.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, bubbles: true, cancelable: true })); });
  await p.waitForTimeout(500);
  console.log('9. zoom lejos: textos de cotas visibles =', await p.$$eval('.tv-dib-svg text', ts => ts.filter(t => /^\d+\.\d{3}$/.test(t.textContent)).length));
  await cerrar(b, errs);
})();
