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
    const ap = q.match(/appProperties has \{ key='f' and value='([^']+)' \}/); if (ap) l = l.filter(f => f.appProperties && f.appProperties.f === ap[1]);
    return responder(route, 200, { files: l.map(pub) });
  }
  if (path === '/drive/v3/files' && m === 'POST') {
    const b = JSON.parse(req.postData()); const id = nuevoId();
    drive.files[id] = { id, name: b.name, folder: true, parent: (b.parents || [])[0], t: Date.now() }; return responder(route, 200, { id });
  }
  let mm = path.match(/^\/drive\/v3\/files\/(\w+)$/);
  if (mm) {
    const f = drive.files[mm[1]]; if (!f) return responder(route, 404, {});
    if (m === 'GET' && url.searchParams.get('alt') === 'media') { drive.bajadasMedia = (drive.bajadasMedia || 0) + 1; return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': f.bin ? 'image/jpeg' : 'application/json' }, body: f.bin || f.data }); }
    if (m === 'GET' && url.searchParams.get('fields') && url.searchParams.get('fields').includes('parents')) return responder(route, 200, { ...pub(f), parents: [f.parent] });
    if (m === 'GET') return responder(route, 200, pub(f));
    if (m === 'PATCH') { Object.assign(f, JSON.parse(req.postData())); f.t = Date.now(); return responder(route, 200, pub(f)); }
  }
  mm = path.match(/^\/upload\/drive\/v3\/files(?:\/(\w+))?$/);
  if (mm) {
    const ct = req.headers()['content-type'], b = ct.match(/boundary=(.+)$/)[1];
    const buf = req.postDataBuffer(), txt = buf.toString('latin1');
    const partes = txt.split('--' + b).filter(x => x.trim() && x.trim() !== '--').map(x => x.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, ''));
    const meta = JSON.parse(Buffer.from(partes[0], 'latin1').toString('utf8'));
    const esFoto = meta.mimeType === 'image/jpeg', data = esFoto ? null : Buffer.from(partes[1], 'latin1').toString('utf8');
    const bin = esFoto ? Buffer.from(partes[1], 'latin1') : null;
    let f = mm[1] ? drive.files[mm[1]] : null;
    if (!f) { const id = nuevoId(); f = drive.files[id] = { id, parent: meta.parents[0] }; }
    Object.assign(f, { name: meta.name, appProperties: meta.appProperties, data, bin, t: Date.now() });
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


  const A = await equipo('A', [via(11, 'Carrera 120 sur', 5)], [{ id: 5, nombre: 'Obra Norte' }]);
  await A.click('button.tv-nube'); await A.click('button:has-text("Conectar con Google")'); await espera(A); await A.click('.tv-panel-nube button[aria-label=Cerrar]');
  const abrirVia = async (P, id) => { await P.evaluate(i => { localStorage.setItem('topovias_standalone_activo', JSON.stringify(i)); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); }, id); await P.reload(); await P.waitForSelector('.tv-tabs'); await P.waitForTimeout(500); await espera(P); };
  await abrirVia(A, 11);
  // A toma 2 fotos en la bitácora
  await A.click('.tv-tabs button[data-tab=memoria]'); await A.click('button:has-text("+ Agregar anotación")');
  await A.fill('textarea', 'Fotos del fallo');
  await (await A.$$('input[type=file]'))[1].setInputFiles(['../out/foto0.jpg', '../out/foto1.jpg']); await A.waitForTimeout(1500);
  await A.click('button:has-text("Guardar")'); await A.waitForTimeout(300);
  await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  const fotos = Object.values(drive.files).filter(f => !f.trashed && f.bin);
  const carpFotos = Object.values(drive.files).find(f => f.folder && f.name === 'Fotos');
  console.log('1. A subió:', (await estado(A)).msg, '| fotos en Drive:', fotos.length, '| en carpeta Fotos:', fotos.every(f => f.parent === carpFotos.id), '| tamaños:', fotos.map(f => f.bin.length).join(','));
  await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  console.log('   2ª sync no repite:', Object.values(drive.files).filter(f => !f.trashed && f.bin).length, 'fotos |', (await estado(A)).msg);
  // B se conecta: recibe la vía; las fotos se bajan al abrir la bitácora
  const B = await equipo('B', [], []);
  await B.click('button.tv-nube'); await B.click('button:has-text("Conectar con Google")'); await espera(B); await B.click('.tv-panel-nube button[aria-label=Cerrar]');
  await abrirVia(B, 11);
  const antes = drive.bajadasMedia || 0;
  await B.click('.tv-tabs button[data-tab=memoria]'); await B.waitForTimeout(1500);
  const vistas = await B.$$eval('img[alt=foto]', i => i.filter(x => x.naturalWidth > 0).map(x => x.naturalWidth + 'x' + x.naturalHeight));
  console.log('2. B ve las fotos:', JSON.stringify(vistas), '| bajadas de Drive al abrir:', (drive.bajadasMedia || 0) - antes);
  await B.reload(); await B.waitForSelector('.tv-tabs'); await B.click('.tv-tabs button[data-tab=memoria]'); await B.waitForTimeout(800);
  console.log('   tras recargar B, ya las tiene guardadas:', await B.$$eval('img[alt=foto]', i => i.filter(x => x.naturalWidth > 0).length));
  // A quita una foto: la foto va a la papelera de Drive (después de 15 min de subida → se simula envejeciéndola)
  await A.click('.tv-bit-item button:has-text("Editar")'); await A.click('button[title="Quitar foto"]'); await A.click('button:has-text("Guardar")'); await A.waitForTimeout(300);
  Object.values(drive.files).forEach(f => { if (f.bin) f.t -= 20 * 60000; });
  await A.evaluate(() => nubeSincronizar(false)); await espera(A);
  console.log('3. tras quitar una en A: fotos vivas en Drive', Object.values(drive.files).filter(f => !f.trashed && f.bin).length, '| en papelera', Object.values(drive.files).filter(f => f.trashed && f.bin).length);
  console.log('   archivos de vías:', archivos());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
