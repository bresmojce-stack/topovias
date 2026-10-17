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
    if (m === 'GET' && url.searchParams.get('alt') === 'media') return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: f.data });
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

  // 1. Equipo A con datos se conecta
  const A = await equipo('A', [via(11, 'EJE 7', 5)], [{ id: 5, nombre: 'Obra Norte' }]);
  await A.click('button.tv-nube'); await A.screenshot({ path: process.argv[3] + '_panel_off.png' });
  await A.click('button:has-text("Conectar con Google")'); await espera(A);
  console.log('1. A conectado:', JSON.stringify(await estado(A)), '\n   Drive:', archivos());
  await A.screenshot({ path: process.argv[3] + '_panel_on.png' });
  await A.click('.tv-panel-nube button[aria-label=Cerrar]');
  // 2. Equipo B vacío (celular) se conecta y recibe todo
  const B = await equipo('B', [], [], 390);
  await B.click('button.tv-nube'); await B.click('button:has-text("Conectar con Google")'); await espera(B);
  console.log('2. B recibe:', JSON.stringify(await estado(B)));
  await B.click('.tv-panel-nube button[aria-label=Cerrar]'); await B.screenshot({ path: process.argv[3] + '_B.png' });
  // 3. B cambia el nombre y agrega una vía; A trae los cambios al volver a la app
  await B.evaluate(() => { HIST.crudo.proyectos(HIST.actual.proyectos.map(v => ({ ...v, nombre: 'EJE 7 (editado en B)' })).concat([{ ...HIST.actual.proyectos[0], id: 22, nombre: 'EJE 8' }])); localStorage.setItem('topovias_standalone__t', String(Date.now())); });
  console.log('   antes de sincronizar B:', JSON.stringify(await B.evaluate(() => ({ e: NUBE.estado, o: NUBE.ocupado, n: drive_n = 0 }))));
  B.on('console', m => console.log('   [B]', m.text()));
  console.log('   llamadas antes', drive.llamadas, archivos());
  await B.evaluate(() => { const o = nubeAvisar; window.nubeAvisar = (e, m) => { console.log('avisar', e, m, new Error().stack.split('\n')[2]); return o(e, m); }; });
  await B.evaluate(() => nubeSincronizar(false)); await espera(B);
  console.log('   llamadas después', drive.llamadas, JSON.stringify(await B.evaluate(() => [NUBE.estado, NUBE.msg])));
  console.log('3. B sube:', (await estado(B)).msg, '| Drive:', archivos());
  await A.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await espera(A);
  console.log('   A trae:', JSON.stringify(await estado(A)));
  // 4. A borra EJE 8 → B lo quita
  await A.evaluate(() => { HIST.crudo.proyectos(HIST.actual.proyectos.filter(v => v.id !== 22)); });
  await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  await B.evaluate(() => nubeSincronizar(false)); await espera(B);
  console.log('4. borrar en A → Drive:', archivos(), '| B:', JSON.stringify((await estado(B)).vias));
  // 5. choque: los dos cambian la misma vía sin sincronizar; B lo hizo después → gana B, y A guarda copia
  await A.evaluate(() => { HIST.crudo.proyectos(HIST.actual.proyectos.map(v => ({ ...v, nombre: 'cambio A' }))); localStorage.setItem('topovias_standalone__t', String(Date.now())); });
  await A.waitForTimeout(30);
  await B.evaluate(() => { HIST.crudo.proyectos(HIST.actual.proyectos.map(v => ({ ...v, nombre: 'cambio B' }))); localStorage.setItem('topovias_standalone__t', String(Date.now())); });
  await B.evaluate(() => nubeSincronizar(false)); await espera(B);
  await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  const copias = await A.evaluate(() => leerCopiasAutomaticas().then(l => l.map(c => c.vias.map(v => v.nombre).join(','))));
  console.log('5. choque → A queda con:', JSON.stringify((await estado(A)).vias), '| copias de A:', JSON.stringify(copias.slice(0, 2)));
  // 6. obra nueva en cada equipo → se juntan
  await A.evaluate(() => HIST.crudo.obras(HIST.actual.obras.concat([{ id: 60, nombre: 'Obra de A' }])));
  await B.evaluate(() => HIST.crudo.obras(HIST.actual.obras.concat([{ id: 70, nombre: 'Obra de B' }])));
  await A.evaluate(() => nubeSincronizar(false)); await espera(A); await B.evaluate(() => nubeSincronizar(false)); await espera(B); await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  console.log('6. obras A:', JSON.stringify((await estado(A)).obras), 'B:', JSON.stringify((await estado(B)).obras));
  // 7. sesión vencida: sin la ventana de Google no hace nada, pide tocar
  const pedidos0 = await A.evaluate(() => window.__pedidos);
  await A.evaluate(() => { const m = nubeMeta(); m.exp = 0; nubeGuardarMeta(m); }); await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  console.log('7. vencida (auto):', JSON.stringify((await estado(A)).est), 'ventanas Google:', await A.evaluate(() => window.__pedidos) - pedidos0);
  await A.click('button.tv-nube'); await A.click('button:has-text("Sincronizar ahora")'); await espera(A);
  console.log('   tocando Sincronizar:', (await estado(A)).est, 'ventanas Google:', await A.evaluate(() => window.__pedidos) - pedidos0);
  await A.screenshot({ path: process.argv[3] + '_A.png' });
  // 8. al reabrir con sesión viva, sincroniza solo
  await A.reload(); await A.waitForSelector('header.tv-header'); await A.waitForTimeout(1200); await espera(A);
  console.log('8. al abrir:', (await estado(A)).est);
  // 9. desconectar
  await A.click('button.tv-nube'); await A.click('button:has-text("Desconectar")'); await A.waitForTimeout(200);
  console.log('9. desconectado:', await A.evaluate(() => localStorage.getItem('topovias_standalone_nube')), (await estado(A)).vias.length, 'vías siguen en el equipo');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
