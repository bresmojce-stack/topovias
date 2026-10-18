// Explicaciones plegadas ("ⓘ Cómo funciona…"): salen cerradas, se abren al tocarlas y cada equipo recuerda cómo quedaron.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const abrirVia = require('./abrir.js');
(async () => { const b = await chromium.launch(); const errs = [];
 const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
 p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
 await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
 const T = (ci,pe,di) => ({cotaInicio:ci,cotaFin:"",pendiente:pe,distancia:di,id:Math.random()});
 const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","")],absInicio:""};
 const pr = { id: 1, obraId: 5, nombre: "EJE 5", absInicio: "0", tramos: [T("100.5","-1","20")], intermedias: [], capas: [{nombre:"Asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.15",id:2}],
   lateralIzq: lat, lateralDer: lat, bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], parqueaderos: [], nivelaciones: [], volumenes: [] };
 await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:"Obra Tamarindo"}])); localStorage.setItem('tv_tema', 'claro'); }, pr);
 await p.reload(); await abrirVia(p, 'EJE 5');
 const vis = t => p.locator('text=' + t).first().isVisible().catch(() => false);
 console.log('Estructura cerrada → se ve la explicación:', await vis('La Rasante es la cota de acabado'), '| botón:', await vis('ⓘ Cómo funciona la estructura'));
 await p.screenshot({ path: '../out/ayuda_cerrada.png', fullPage: true });
 await p.click('text=ⓘ Cómo funciona la estructura'); await p.waitForTimeout(200);
 console.log('al tocar → se ve:', await vis('La Rasante es la cota de acabado'), '| y "Orden":', await vis('Orden: primero la capa'));
 await p.screenshot({ path: '../out/ayuda_abierta.png', fullPage: true });
 await p.reload(); await abrirVia(p, 'EJE 5');
 console.log('tras volver a abrir la app sigue abierta:', await vis('La Rasante es la cota de acabado'));
 console.log('sobreancho plegado:', !(await vis('El sobreancho solo agranda')), '| botón:', await vis('ⓘ Qué es el sobreancho'));
 await p.click('.tv-subvia button[data-sub=lat]'); await p.waitForTimeout(200);
 console.log('laterales: signos plegados:', !(await vis('indica que baja respecto al eje')), '| botón:', await vis('ⓘ Signos de los laterales'));
 await p.click('text=ⓘ Signos de los laterales'); console.log('  al tocar:', await vis('indica que baja respecto al eje'));
 await p.click('.tv-tabs button[data-tab=cant]'); await p.click('.tv-subvia button[data-sub=vol]'); await p.waitForTimeout(200);
 console.log('volúmenes: método plegado:', !(await vis('Método: áreas promedio')), '| botón:', await vis('ⓘ Cómo se calculan los volúmenes'));
 await p.screenshot({ path: '../out/ayuda_vol.png', fullPage: true });
 // sin almacenamiento la app sigue funcionando
 const ctx2 = await b.newContext(); const p2 = await ctx2.newPage(); const e2 = [];
 p2.on('pageerror', e => e2.push(e.message));
 await p2.addInitScript(() => { const s = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'tv_ayuda') throw new Error('lleno'); return s.call(this, k, v); }; });
 await p2.goto('file://' + process.argv[2]); await p2.waitForSelector('header.tv-header');
 console.log('si no se puede guardar la preferencia, errores:', e2.length ? e2 : 'ninguno');
 console.log(errs.join('\n') || 'no errors'); await b.close(); })();
