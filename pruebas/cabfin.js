const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForSelector('header.tv-header');
const r=await p.evaluate(()=>{const T=(ci,cf,pe,di)=>({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
 const lat={modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
 const base={id:1,nombre:"V",absInicio:"100",tramos:[T("100","","-2","20")],intermedias:[],capas:[{nombre:"Asfalto",espesor:"0.05"},{nombre:"Base",espesor:"0.2"}],lateralIzq:lat,lateralDer:lat,nivelaciones:[],volumenes:[]};
 const out={};
 const pr1={...base,parqueaderos:[{id:1,nombre:"F",modo:"diferencia",ubicacion:"fin",lado:"izquierdo",desde:"8.5",hasta:"1",fondo:"-7.5",diferencia:"0.10",pendienteFondo:"-1",sobreAncho:"0.5",saExtremos:"0.3",tramos:[T("","","","")]},
   {id:2,nombre:"L",modo:"diferencia",lado:"izquierdo",absInicio:"105",absFin:"115",ancho:"5",sobreAncho:"0",diferencia:"0.05",tramos:[T("","","","")]}]};
 const t1=generarTabla(pr1); out.fin=t1.map(x=>[x.absFormato,x.fueraVia,x.cotaLatIzq,x.parqIzqCota]); const a=calcAreas(pr1,t1); out.areas=[a.largo,a.via,a.parqs.map(x=>[x.nombre,x.largo,x.ancho,x.largoC,x.area,x.descuentoVia]),a.total];
 const pr2={...base,parqueaderos:[{id:3,nombre:"I",modo:"independiente",ubicacion:"inicio",lado:"derecho",desde:"0",hasta:"6",fondo:"10",tramos:[T("99","","1","")]}]};
 const t2=generarTabla(pr2); out.indep=t2.slice(0,4).map(x=>[x.absFormato,x.parqDerCota]);
 const pr3={...base,parqueaderos:[{id:4,nombre:"X",modo:"diferencia",ubicacion:"inicio",lado:"derecho",desde:"",hasta:"",fondo:"",tramos:[T("","","","")]}]};
 out.incompleto=generarTabla(pr3).length+' '+calcAreas(pr3,generarTabla(pr3)).total;
 return out;});
console.log(JSON.stringify(r));console.log(errs.join('\n')||'no errors');await b.close();})();
