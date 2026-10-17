const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch(); const errs = []; const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const r = await p.evaluate(() => {
    const L = (abs, v, est) => ({abs, estacionId: est||null, parqDer:"", der:v, eje:v, izq:v, parqIzq:""});
    const niv = (id, tipo, v) => ({ id, tipo, nombre: tipo, estaciones: [{id:7,nombre:"E1",cotaBM:"100",vistaMas:"1.5"}], lecturas: [0,10,20].map((a,k)=>L(a,v,k?null:7)) });
    const base = { ...proyVacio(), tramos: [{cotaInicio:"100",cotaFin:"",pendiente:"1",distancia:"20",id:1}], capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.15",id:2}],
      lateralIzq: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",tramos:[],absInicio:""}, lateralDer: {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"0",tramos:[],absInicio:""} };
    const tn = pr => { const t = generarTabla(pr); const n = nivelacionTN(pr, t); return n ? n.tipo + "/" + n.id : "ninguna"; };
    return { soloOtra: tn({ ...base, nivelaciones: [niv(1, "otra", "1.2")] }), otraYtn: tn({ ...base, nivelaciones: [niv(1, "otra", "1.2"), niv(2, "tn", "1.0")] }),
      elegidaOtra: tn({ ...base, graficoTN: "1", nivelaciones: [niv(1, "otra", "1.2"), niv(2, "tn", "1.0")] }), viejaSinTipo: tn({ ...base, nivelaciones: [{ ...niv(3, undefined, "1.1") }] }) };
  });
  console.log(JSON.stringify(r)); console.log(errs.join('\n') || 'no errors'); await b.close(); })();
