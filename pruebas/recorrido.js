// Recorre todas las pantallas con un tema (TB=claro|oscuro|agua|fuego|aire|tierra) y un ancho (W); TACTIL=1 para tablet (W=820).
// Capturas en ../out/rec_<TB>_<W>_<n>.png; revisa que nada desborde y que cambiar de tema no toque los datos.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const W = +(process.env.W || 390), TB = process.env.TB || 'oscuro', movil = W < 600, H = +(process.env.H || (movil ? 844 : 900)), tactil = movil || !!process.env.TACTIL;
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: W, height: H }, isMobile: tactil, hasTouch: tactil }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 150)); });
  p.on('dialog', d => d.dismiss());
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
  const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
  const L = (abs, v, est) => ({abs, estacionId: est||null, parqDer:"", der:v, eje:v, izq:v, parqIzq:""});
  const proj = { id: 1, obraId: 5, nombre: "EJE 5", absInicio: "0", tramos: [T("100.5","","-1","20"), T("100.3","","1.2","30")], intermedias: [],
    capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.15",id:2},{nombre:"Sub-base",espesor:"0.20",id:3}],
    lateralIzq: lat, lateralDer: {...lat}, bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [],
    parqueaderos: [{id:9,nombre:"P-1",modo:"diferencia",ubicacion:"lateral",lado:"derecho",absInicio:"15",absFin:"40",ancho:"5",sobreAncho:"0.5",diferencia:"0.09",tramos:[T("","","","")],coords:[]}],
    nivelaciones: [{ id: 5, tipo: "tn", nombre: "TN", estaciones: [{id:7,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}], lecturas: [0,10,20,30,40,50].map((a,k)=>L(a,"1.1",k?null:7)) }],
    volumenes: [{ id: 11, nombre: "Base", fuenteSup: "tabla__rasante", fuenteInf: "tabla__Base", sobreAncho: "0.5" }],
    sardinel: { activo: true, corona: "0.15", pata: "0.20", altura: "0.45", revelado: "0.15", lados: { izq: true, der: true, ini: true, fin: true }, sin: [], ejecutado: [{ id: 2, lado: "izq", desde: "0", hasta: "20", fecha: "2026-10-10" }] },
    bitacora: [{ id: 3, fecha: "2026-10-16", texto: "Se fundió el sardinel izquierdo 0+000 a 0+020.", fotos: [], creada: "2026-10-16" }],
    dibujos: [{ id: 7, nombre: "Plano", sig: 9, objs: [{ id: 1, t: "l", a: { x: 0, y: 0 }, b: { x: 20, y: 5 } }, { id: 2, t: "l", a: { x: 0, y: 5 }, b: { x: 20, y: 10 }, col: "#DC2626" },
      { id: 3, t: "ci", c: { x: 10, y: -5 }, r: 4 }, { id: 4, t: "cota", a: { x: 0, y: -12 }, b: { x: 20, y: -12 }, d: 2 }, { id: 5, t: "p", x: 25, y: 0, nom: "BM1" }, { id: 6, t: "pl", v: [{x:30,y:0},{x:40,y:0},{x:40,y:8},{x:30,y:8}], c: true, col: "#0F172A" }] }] };
  await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:"Obra Tamarindo"}])); localStorage.setItem('topovias_standalone__t', String(Date.now()+99999)); localStorage.setItem('topovias_standalone_obras__t', String(Date.now()+99999)); }, proj);
  await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
  if (await p.locator('text=‹ Obras').count()) await p.click('text=‹ Obras');
  await p.click('[data-tema-btn=' + TB + ']'); await p.waitForTimeout(200);
  let n = 0; const foto = async (nom, full) => { n++; await p.waitForTimeout(250); await p.screenshot({ path: `../out/rec_${TB}_${W}_${String(n).padStart(2,'0')}_${nom}.png`, fullPage: !!full });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth); if (sw > W + 1) errs.push('desborda ' + nom + ' ' + sw); };
  await foto('inicio');
  await p.click('text=Obra Tamarindo'); await foto('obra');
  await p.click('text=EJE 5'); await p.waitForTimeout(300);
  await p.click('button:has-text("CALCULAR")'); await foto('cotas');
  await p.click('.tv-subvia button:has-text("replanteo")').catch(() => {}); await foto('replanteo');
  await p.click('.tv-tabs button[data-tab=via]');
  for (const sub of ['estr', 'eje', 'lat', 'parq', 'sard', 'plano']) { await p.click(`.tv-subvia button[data-sub=${sub}]`); await p.waitForTimeout(250);
    if (sub === 'parq' || sub === 'lat') for (const bt of await p.$$('.tv-despl-cab[aria-expanded=false]')) await bt.click();
    await foto(sub); }
  await p.click('.tv-tabs button[data-tab=nivel]'); await foto('nivel');
  await p.click('.tv-tabs button[data-tab=cant]'); await foto('volumenes');
  await p.click('.tv-subvia button:has-text("Cantidades")').catch(() => {}); await foto('cantidades');
  await p.click('.tv-tabs button[data-tab=dibujo]'); await p.waitForTimeout(500); await foto('dibujo');
  await p.click('.tv-tabs button[data-tab=verif]'); await foto('calculadora');
  await p.click('.tv-tabs button[data-tab=memoria]'); await foto('bitacora');
  await p.click('button:has-text("Exportar")'); await foto('exportar');
  await p.keyboard.press('Escape').catch(() => {});
  // cambiar de tema desde la barra: no se pierde nada
  const antes = await p.evaluate(() => localStorage.getItem('topovias_standalone'));
  await p.locator('[data-accion=tema]').first().dispatchEvent('click'); await p.waitForTimeout(200);
  const despues = await p.evaluate(() => localStorage.getItem('topovias_standalone'));
  console.log('tema tras botón:', await p.evaluate(() => document.documentElement.dataset.tema), '| datos iguales:', antes === despues);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
