const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch(); const errs = []; const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const pr = await p.evaluate(T0 => ({ ...proyVacio(), id: 1, nombre: "V", tramos: [{cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"20",id:1}],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.15",id:2},{nombre:"excavacion",espesor:"0.30",id:3}],
    lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",tramos:[],absInicio:""}, lateralDer: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",tramos:[],absInicio:""} }));
  await p.evaluate(pr => (localStorage.setItem('topovias_standalone', JSON.stringify([pr])), localStorage.setItem('topovias_standalone_activo', JSON.stringify(pr.id)), localStorage.setItem('topovias_standalone_nav', JSON.stringify({vista:'via'}))), pr);
  await p.reload(); await p.waitForSelector('header.tv-header');
  await p.click('.tv-subvia button[data-sub=estr]'); await p.waitForTimeout(200);
  console.log('aviso:', await p.locator('text=es la excavación').count());
  const cols = await p.evaluate(() => generarTabla(JSON.parse(localStorage.getItem('topovias_standalone'))[0])[0].capas.map(c => c.nombre + (c.esExcavacion ? '*' : '')));
  console.log('columnas:', cols.join(', '));
  await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
  console.log('cantidades:', await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('topovias_standalone'))[0]; return calcCantidades(pr, generarTabla(pr)).items.map(i => i.nombre + ' ' + i.valor).join(' | '); }));
  console.log(errs.join('\n') || 'no errors'); await b.close(); })();
