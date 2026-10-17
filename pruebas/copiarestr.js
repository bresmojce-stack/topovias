const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 1280);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = () => ({cotaInicio:"100",cotaFin:"",pendiente:"-1",distancia:"50",id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T()],absInicio:""};
  const base = { absInicio: "0", tramos: [T()], intermedias: [], lateralIzq: lat, lateralDer: lat, parqueaderos: [], nivelaciones: [], volumenes: [], coordsEje: [] };
  const vias = [{ ...base, id: 1, obraId: 5, nombre: "EJE 1", capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.20",id:2,sobreancho:"general"}], sobreancho: { izq: "0.5", der: "0.5" } },
    { ...base, id: 2, obraId: 5, nombre: "EJE 2", capas: [{nombre:"",espesor:"",id:9}] },
    { ...base, id: 3, obraId: 6, nombre: "CALLE X", capas: [{nombre:"Concreto",espesor:"0.18",id:1}] }];
  await p.evaluate(v => { localStorage.setItem('topovias_standalone', JSON.stringify(v)); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:'Norte'},{id:6,nombre:'Sur'}])); localStorage.setItem('topovias_standalone_activo', '2'); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); }, vias);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(500);
  const sel = p.locator('.tv-copiar-estructura select');
  console.log('opciones:', JSON.stringify(await sel.locator('option').allInnerTexts()));
  await sel.selectOption('1'); await p.click('.tv-copiar-estructura button');
  await p.waitForTimeout(300);
  console.log('EJE 2 ahora:', await p.evaluate(() => { const v = JSON.parse(localStorage.getItem('topovias_standalone')).find(x => x.id === 2); return JSON.stringify({ capas: v.capas.map(c => c.nombre + ' ' + c.espesor + ' ' + (c.sobreancho||'')), sa: v.sobreancho }); }));
  await p.locator('.tv-copiar-estructura').scrollIntoViewIfNeeded(); await p.screenshot({ path: process.argv[3] + '.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
