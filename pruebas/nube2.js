const { chromium } = require('/opt/node-tools/node_modules/playwright');
// Drive simulado (compartido por los dos "equipos")
const drive = { files: {}, n: 0, llamadas: 0 };
const nuevoId = () => 'f' + (++drive.n);
function responder(route, status, body) {
  return route.fulfill({ status, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', 'Content-Type': 'application/json' }, body: body === undefined ? '' : JSON.stringify(body) });
}
async function manejarDrive(route) {
  const req = route.request(), url = new URL(req.url()), m = req.method();
  if (m === 'OPTIONS') return responder(route, 204);
  drive.llamadas++;
  if (!/Bearer tok/.test(req.headers()['authorization'] || '')) return responder(route, 401, { error: 'no' });
  const path = url.pathname;
  if (path === '/drive/v3/about') return responder(route, 200, { user: { emailAddress: 'prueba@gmail.com' } });
  const pub = f => ({ id: f.id, name: f.name, modifiedTime: new Date(f.t).toISOString(), appProperties: f.appProperties, trashed: f.trashed });
  if (path === '/drive/v3/files' && m === 'GET') {
    const q = url.searchParams.get('q') || '';
    let l = Object.values(drive.files).filter(f => !f.trashed);
    const nm = q.match(/name='([^']+)'/); if (nm) l = l.filter(f => f.name === nm[1] && f.folder);
    const par = q.match(/'([^']+)' in parents/); if (par) l = l.filter(f => f.parent === par[1]);
    return responder(route, 200, { files: l.map(pub) });
  }
  if (path === '/drive/v3/files' && m === 'POST') {
    const b = JSON.parse(req.postData()); const id = nuevoId();
    drive.files[id] = { id, name: b.name, folder: true, t: Date.now() }; return responder(route, 200, { id });
  }
  let mm = path.match(/^\/drive\/v3\/files\/(\w+)$/);
  if (mm) {
    const f = drive.files[mm[1]]; if (!f) return responder(route, 404, {});
    if (m === 'GET' && url.searchParams.get('alt') === 'media') { if (drive.lento) await new Promise(r => setTimeout(r, drive.lento)); return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: f.data }); }
    if (m === 'GET') return responder(route, 200, pub(f));
    if (m === 'PATCH') { Object.assign(f, JSON.parse(req.postData())); f.t = Date.now(); return responder(route, 200, pub(f)); }
  }
  mm = path.match(/^\/upload\/drive\/v3\/files(?:\/(\w+))?$/);
  if (mm) {
    const ct = req.headers()['content-type'], b = ct.match(/boundary=(.+)$/)[1];
    const partes = req.postData().split('--' + b).filter(x => x.trim() && x.trim() !== '--').map(x => x.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, ''));
    const meta = JSON.parse(partes[0]), data = partes[1];
    let f = mm[1] ? drive.files[mm[1]] : null;
    if (!f) { const id = nuevoId(); f = drive.files[id] = { id, parent: meta.parents[0] }; }
    Object.assign(f, { name: meta.name, appProperties: meta.appProperties, data, t: Date.now() });
    return responder(route, 200, { id: f.id, modifiedTime: new Date(f.t).toISOString() });
  }
  return responder(route, 404, { error: 'ruta ' + m + ' ' + path });
}
const GIS = `window.google = { accounts: { oauth2: { initTokenClient: c => ({ requestAccessToken: o => { window.__pedidos = (window.__pedidos||0)+1; setTimeout(() => c.callback({ access_token: 'tok', expires_in: 3600 }), 50); } }), revoke: (t, f) => f && f() } } };`;
const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
const via = (id, nombre, obraId) => ({ id, obraId, nombre, absInicio: "0", tramos: [T("100","","-2","30")], intermedias: [], capas: [{nombre:"Asfalto",espesor:"0.05",id:1}], lateralIzq: lat, lateralDer: lat, parqueaderos: [], nivelaciones: [{ id: 5, nombre: "TN", estaciones: [{id: 7, nombre: "E1", cotaBM: "100", vistaMas: "1.5"}], lecturas: [{abs:0, estacionId:7, eje:"0.5"}] }], volumenes: [], coordsEje: [], dibujos: [{ id: 1, nombre: "Dibujo 1", objs: [{ t: "l", a: {x:0,y:0}, b: {x:5,y:5}, id: 3 }] }] });
(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function equipo(nombre, vias, obras, W) {
    const ctx = await b.newContext({ viewport: { width: W || 1280, height: 900 } });
    await ctx.route('https://www.googleapis.com/**', manejarDrive);
    await ctx.route('https://accounts.google.com/gsi/client', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: GIS }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(nombre + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
    await p.evaluate(([v, o]) => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify(v)); localStorage.setItem('topovias_standalone_obras', JSON.stringify(o)); localStorage.setItem('topovias_standalone__t', String(Date.now())); localStorage.setItem('topovias_standalone_obras__t', String(Date.now())); }, [vias, obras]);
    await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(400);
    return p;
  }
  const estado = p => p.evaluate(() => ({ est: NUBE.estado, msg: NUBE.msg, vias: HIST.actual.proyectos.map(v => v.nombre + (v.nivelaciones ? '[' + v.nivelaciones.length + 'niv,' + (v.dibujos||[]).length + 'dib]' : '')), obras: HIST.actual.obras.map(o => o.nombre) }));
  const espera = async p => { await p.waitForFunction(() => !NUBE.ocupado && NUBE.estado !== 'sincronizando'); await p.waitForTimeout(100); };
  const archivos = () => Object.values(drive.files).filter(f => !f.trashed && !f.folder).map(f => f.name).sort().join(' | ');


  const n = p => p.evaluate(() => HIST.actual.proyectos.map(v => v.nombre).join(','));
  const A = await equipo('A', [via(11, 'EJE 7', 5)], [{ id: 5, nombre: 'Obra Norte' }]);
  await A.click('button.tv-nube'); await A.click('button:has-text("Conectar con Google")'); await espera(A); await A.click('.tv-panel-nube button[aria-label=Cerrar]');
  const B = await equipo('B', [], []);
  await B.click('button.tv-nube'); await B.click('button:has-text("Conectar con Google")'); await espera(B); await B.click('.tv-panel-nube button[aria-label=Cerrar]');
  // 1. A cambia EJE 7 y lo sube; B, con Drive lento, escribe en otra vía mientras sincroniza
  await A.evaluate(() => { HIST.crudo.proyectos(HIST.actual.proyectos.map(v => ({ ...v, nombre: 'EJE 7 desde A' }))); localStorage.setItem('topovias_standalone__t', String(Date.now())); });
  await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  await B.evaluate(() => HIST.crudo.proyectos(HIST.actual.proyectos.concat([{ ...HIST.actual.proyectos[0], id: 33, nombre: 'VIA NUEVA B' }])));
  drive.lento = 1500;
  const prom = B.evaluate(() => nubeSincronizar(false));
  await B.waitForTimeout(500);
  await B.evaluate(() => HIST.crudo.proyectos(HIST.actual.proyectos.map(v => v.id === 33 ? { ...v, nombre: 'VIA NUEVA B (escrita durante la sync)' } : v)));
  await prom; drive.lento = 0;
  console.log('1. tras la sync con edición encima, B:', await n(B), '|', (await estado(B)).msg);
  await B.waitForTimeout(4500); await espera(B);
  console.log('   y al repetir sola:', await n(B), '| Drive:', archivos());
  // 2. deshacer después de que llegó algo de otro equipo
  console.log('2. pasos para deshacer en B tras sincronizar:', await B.evaluate(() => HIST.atras.length));
  // 3. carpeta TopoVías borrada en Drive: no se borra nada aquí, se sube todo
  Object.values(drive.files).forEach(f => { f.trashed = true; });
  await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  console.log('3. carpeta borrada → A conserva:', await n(A), '| Drive nuevo:', archivos());
  // 3b. error de red al revisar la carpeta: no crea otra ni borra
  const nArch = Object.keys(drive.files).length;
  await A.route('https://www.googleapis.com/drive/v3/files/*', r => r.request().url().includes('fields=id,trashed') ? r.fulfill({ status: 503, headers: { 'Access-Control-Allow-Origin': '*' }, body: '{}' }) : r.fallback());
  await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  console.log('3b. error 503 →', (await estado(A)).est, (await estado(A)).msg, '| archivos nuevos en Drive:', Object.keys(drive.files).length - nArch, '| A:', await n(A));
  await A.unroute('https://www.googleapis.com/drive/v3/files/*');
  // 4. dos ventanas del mismo equipo
  const A2 = await A.context().newPage(); A2.on('pageerror', e => errs.push('A2: ' + e.message));
  await A2.goto('file://' + process.argv[2]); await A2.waitForSelector('header.tv-header'); await A2.waitForTimeout(1500);
  await A2.evaluate(() => HIST.crudo.proyectos(HIST.actual.proyectos.concat([{ ...HIST.actual.proyectos[0], id: 44, nombre: 'VIA en ventana 2' }])));
  await A.waitForTimeout(400);
  const aviso = await A.$('.tv-otra-ventana');
  await A.evaluate(() => HIST.crudo.proyectos(HIST.actual.proyectos.filter(v => v.id !== 44).concat([{ ...HIST.actual.proyectos[0], id: 45, nombre: 'escrita en ventana vieja' }])));
  console.log('4. ventana vieja: aviso', !!aviso, '| guardado en el equipo:', await A2.evaluate(() => JSON.parse(localStorage.getItem('topovias_standalone')).map(v => v.nombre).join(',')));
  await A.screenshot({ path: process.argv[3] + '_otra.png' });
  await A2.close();
  // 5. datos dañados guardados (null) → la app abre igual
  const C = await equipo('C', [null, via(77, 'BUENA', 5), 'texto'], [{ id: 5, nombre: 'Obra' }, null]);
  console.log('5. datos dañados → abre:', !!(await C.$('header.tv-header')), '| vías:', await n(C));
  // 6. restaurar un archivo con entradas dañadas
  console.log('6. leerCopiaSeguridad filtra:', await C.evaluate(() => JSON.stringify(leerCopiaSeguridad(JSON.stringify({ app: 'TopoVias', obras: [null, { id: 1 }], vias: [null, 3, { id: 2, nombre: 'ok' }] })).vias)));
  // 7. si algo revienta al mostrar: pantalla de rescate, no en blanco
  await C.evaluate(() => { const p = HIST.actual.proyectos; HIST.crudo.proyectos(p.map(v => ({ ...v, tramos: 5 }))); });
  await C.waitForTimeout(300);
  await C.evaluate(() => { localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); localStorage.setItem('topovias_standalone_activo', '77'); });
  await C.reload(); await C.waitForTimeout(1200);
  await C.click('text=BUENA').catch(() => {}); await C.waitForTimeout(500);
  console.log('7. pantalla:', (await C.evaluate(() => document.body.innerText)).slice(0, 120).replace(/\n/g, ' | '));
  await C.screenshot({ path: process.argv[3] + '_fallo.png' });
  console.log(errs.filter(e => !/tramos|not a function|is not iterable|map is not/.test(e)).join('\n') || 'no errors'); await b.close();
})();
