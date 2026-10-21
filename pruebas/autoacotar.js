// Auto acotar y cuadro de coordenadas (Medir): cotas y textos de cada tipo, opciones, cuadro con puntos, deshacer, mover, DXF
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
  console.log('0. barra:', await p.$eval('.tv-dib-cmd', d => d.innerText.replace(/\n/g, ' ')));
  n0 = (await objs()).length; await tapW(8, 0.2); console.log('1. rectángulo 17×11:', await nuevos(n0));
  n0 = (await objs()).length; await tapW(35, 0); console.log('2. línea 10:', await nuevos(n0));
  n0 = (await objs()).length; await tapW(10, 20); console.log('3. polilínea 20+10:', await nuevos(n0));
  n0 = (await objs()).length; await tapW(60, 10); console.log('4. círculo r5:', await nuevos(n0));
  n0 = (await objs()).length; await tapW(55, 30); console.log('5. arco r5 media vuelta:', await nuevos(n0));
  await p.click('.tv-dib-cmd button:has-text("Área")'); await p.click('.tv-dib-cmd button:has-text("Lados")');
  n0 = (await objs()).length; await tapW(8, 0.2); console.log('6. sin Área ni Lados:', await nuevos(n0));
  console.log('   recordado:', await p.evaluate(() => localStorage.getItem('topovias_standalone_dibAcotar')));
  await p.click('.tv-dib-cmd button:has-text("Área")'); await p.click('.tv-dib-cmd button:has-text("Lados")');
  await p.waitForTimeout(900);
  // deshacer: quita lo último de una vez
  n0 = (await objs()).length; await p.click('[data-accion=deshacer]'); await p.waitForTimeout(300); console.log('7. deshacer quita', n0 - (await objs()).length, 'objetos');
  // acotar todo
  n0 = (await objs()).length; await p.click('.tv-dib-cmd button:has-text("Acotar todo")'); await p.waitForTimeout(200); console.log('8. acotar todo:', (await objs()).length - n0, 'nuevos |', await aviso());
  await p.click('[data-accion=deshacer]'); await p.waitForTimeout(900);
  // cuadro de coordenadas del rectángulo: el vértice (0,0) ya es el punto A
  await herr('medir', 'cuadro');
  console.log('9. barra:', await p.$eval('.tv-dib-cmd', d => d.innerText.replace(/\n/g, ' ')));
  n0 = (await objs()).length; await tapW(17, 5);
  const os = await objs(), cu = os.find(o => o.t === 'cuadro');
  console.log('   nuevos:', os.slice(n0).map(o => o.t === 'p' ? o.nom : o.t).join(', '), '| sig:', (await dib()).sig, '|', await aviso());
  console.log('   enc:', cu.enc.join(' | ')); cu.filas.forEach(f => console.log('   ', f.join(' | '))); console.log('   pie:', cu.pie);
  // polilínea abierta con letra V desde 1 y rumbo
  await p.click('.tv-dib-cmd button:has-text("Rumbo")');
  await p.fill('.tv-dib-cmd .tv-dib-campo >> nth=0', 'V'); await p.fill('.tv-dib-cmd .tv-dib-campo >> nth=1', '1');
  await p.waitForTimeout(900);
  n0 = (await objs()).length; await tapW(10, 20);
  const os2 = await objs(), cu2 = os2.filter(o => o.t === 'cuadro').pop();
  console.log('10. abierta V1..:', os2.slice(n0).map(o => o.t === 'p' ? o.nom : o.t).join(', '), '| campo desde ahora:', await p.$eval('.tv-dib-cmd .tv-dib-campo >> nth=1', i => i.value).catch(() => '?'));
  console.log('   enc:', cu2.enc.join(' | ')); cu2.filas.forEach(f => console.log('   ', f.join(' | '))); console.log('   pie:', cu2.pie);
  await p.screenshot({ path: process.argv[3] + '_cuadro.png' });
  // elegir el cuadro y moverlo con Seleccionar → Mover
  await p.waitForTimeout(900);
  await herr('editar', 'elegir'); await mapa();
  const c1 = (await objs()).filter(o => o.t === 'cuadro').pop();
  await tap(M.x0 + (c1.p.x + 0.5) * M.k, M.y0 - (c1.p.y - c1.fh * 1.5) * M.k);
  console.log('11. elegido:', await p.$eval('.tv-dib-panel', d => d.innerText.split('\n').slice(0, 4).join(' / ')).catch(() => 'nada'));
  await p.click('.tv-dib-panel button:has-text("Mover")'); await p.waitForTimeout(150);
  await tap(M.x0 + c1.p.x * M.k, M.y0 - c1.p.y * M.k); await tap(M.x0 + (c1.p.x + 25) * M.k, M.y0 - c1.p.y * M.k);
  const c2 = (await objs()).filter(o => o.t === 'cuadro').pop(); console.log('   movido 25 m al este:', (c2.p.x - c1.p.x).toFixed(3), (c2.p.y - c1.p.y).toFixed(3));
  await p.screenshot({ path: process.argv[3] + '_movido.png' });
  // DXF
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DXF")').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.dxf');
  const dxf = require('fs').readFileSync(process.argv[3] + '.dxf', 'utf8').split('\r\n');
  const textos = []; for (let i = 0; i < dxf.length - 1; i += 2) if (dxf[i] === '1') textos.push(dxf[i + 1]);
  console.log('12. DXF textos:', textos.filter(t => /Área|Area|Perím|Perim|R |PUNTO|AZIMUT|%%d|m2/.test(t)).slice(0, 12).join(' / '));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[3] + '.png' });
  await cerrar(b, errs);
})();
