// La planta con forma real (coordenadas del eje) dibuja el agua: flechas por tramo y el punto bajo.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch(); const errs = [];
 const ctx = await b.newContext({ viewport: { width: +(process.env.W || 390), height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
 p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
 await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
 const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
 const lat = {modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:""};
 const proj = { id: 1, obraId: 5, nombre: "EJE 5", absInicio: "0", tramos: [T("100.5","","-1","23.699"), T("100.263","","1.2","26.301")], intermedias: [], capas: [{nombre:"Asfalto",espesor:"0.05",id:1}],
   lateralIzq: lat, lateralDer: {...lat}, bmEstaciones: [], coordsEje: [{norte:"1000",este:"1000"},{norte:"1008",este:"1022.3"},{norte:"1012",este:"1048"}], coordsIzq: [], coordsDer: [],
   parqueaderos: [{id:9,nombre:"Parqueadero derecho",modo:"diferencia",ubicacion:"lateral",lado:"derecho",absInicio:"5",absFin:"40",ancho:"5",sobreAncho:"",diferencia:"0.09",tramos:[T("","","","")],coords:[]},
     {id:8,nombre:"Parqueadero izq",modo:"diferencia",ubicacion:"lateral",lado:"izquierdo",absInicio:"0",absFin:"35",ancho:"5",sobreAncho:"",diferencia:"-0.05",tramos:[T("","","","")],coords:[]}],
   nivelaciones: [], volumenes: [] };
 await p.evaluate(([pr, t]) => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{id:5,nombre:"Obra Tamarindo"}])); localStorage.setItem('tv_tema', t); }, [proj, process.env.TB || 'oscuro']);
 await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
 if (await p.locator('text=‹ Obras').count()) await p.click('text=‹ Obras');
 await p.click('text=Obra Tamarindo'); await p.click('text=EJE 5'); await p.waitForTimeout(300);
 await p.click('button:has-text("CALCULAR")'); await p.waitForTimeout(300);
 await p.click('.tv-tabs button[data-tab=via]'); await p.click('.tv-subvia button[data-sub=plano]'); await p.waitForTimeout(600);
 const info = await p.evaluate(() => { const svgs = [...document.querySelectorAll('svg')].map(s => s.outerHTML).join('') + [...document.querySelectorAll('img')].map(i => i.src).join('');
   const dec = svgs.replace(/data:image\/svg\+xml[^"']*/g, m => { try { return decodeURIComponent(m); } catch (_) { return m; } });
   return { flechas: (dec.match(/url\(#fl\)/g) || []).length, bajo: dec.includes('punto bajo') }; });
 console.log('flechas de agua en la planta:', info.flechas, '| punto bajo:', info.bajo);
 const svgTxt = await p.evaluate(() => { const all = [...document.querySelectorAll('svg')].map(s => s.outerHTML).filter(t => t.includes('url(#fl)')); if (all.length) return all[all.length - 1];
   const im = [...document.querySelectorAll('img')].map(i => i.src).filter(u => u.startsWith('data:image/svg')).map(u => decodeURIComponent(u.split(',')[1])).filter(t => t.includes('url(#fl)')); return im[im.length - 1] || ''; });
 require('fs').writeFileSync('../out/planta_agua.svg', svgTxt);
 const p2 = await ctx.newPage(); await p2.setViewportSize({ width: 1100, height: 700 }); await p2.setContent('<body style="margin:0">' + svgTxt + '</body>'); await p2.screenshot({ path: '../out/planta_agua_full.png', fullPage: true });
 const pl = p.locator('text=PLANTA').first(); await pl.scrollIntoViewIfNeeded();
 await p.screenshot({ path: '../out/planta_agua.png', fullPage: true });
 console.log(errs.join('\n') || 'no errors'); await b.close(); })();
