// Avisos donde se escriben los datos y puntico de estado en cada apartado de Vía (solo avisan, no cambian cálculos).
// Una vía con errores a propósito: deben salir los avisos y los punticos en rojo/ámbar; una vía correcta: todo en verde.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const abrirVia = require('./abrir.js');
(async () => { const b = await chromium.launch(); const errs = [];
 const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
 p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 150)); });
 await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
 const T = (ci, cf, pe, di) => ({ cotaInicio: ci, cotaFin: cf, pendiente: pe, distancia: di, id: Math.random() });
 const lat = { modo: "transversal", ancho: "3", modoT: "diferencia", diferencia: "-0.06", pendienteT: "", tramos: [T("", "", "", "")], absInicio: "" };
 const PQ = (id, nombre, lado, a, f, w) => ({ id, nombre, modo: "diferencia", ubicacion: "lateral", lado, absInicio: a, absFin: f, ancho: w, sobreAncho: "", diferencia: "0.05", tramos: [T("", "", "", "")], coords: [] });
 const base = { obraId: 5, absInicio: "0", intermedias: [], lateralIzq: lat, bmEstaciones: [], coordsEje: [], coordsIzq: [], coordsDer: [], nivelaciones: [], volumenes: [] };
 const mala = { ...base, id: 1, nombre: "VIA MALA", tramos: [T("100", "", "-1", "20"), T("", "99.8", "-0.5", "12,5m"), T("", "", "", "20")],
   capas: [{ nombre: "Asfalto", espesor: "0.05", id: 1 }, { nombre: "Base", espesor: "", id: 2 }], lateralDer: { ...lat, ancho: "" },
   parqueaderos: [PQ(9, "P-1", "derecho", "35", "20", "5"), PQ(8, "P-2", "derecho", "10", "30", "5"), PQ(7, "P-3", "izquierdo", "40", "62", "5")] };
 const parqs = { ...base, id: 3, nombre: "VIA PARQ", tramos: [T("100", "", "-1", "50")], capas: [{ nombre: "Asfalto", espesor: "0.05", id: 1 }], lateralDer: lat,
   parqueaderos: [PQ(9, "P-1", "derecho", "5", "30", "5"), PQ(8, "P-2", "derecho", "28", "45", "5"), PQ(7, "P-3", "izquierdo", "40", "62", "5")] };
 const buena = { ...base, id: 2, nombre: "VIA BUENA", tramos: [T("100", "", "-1", "20"), T("99.8", "", "1", "30")], capas: [{ nombre: "Asfalto", espesor: "0.05", id: 1 }], lateralDer: lat, parqueaderos: [] };
 await p.evaluate(vs => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify(vs)); localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: "Obra Avisos" }])); localStorage.setItem('tv_tema', 'claro'); }, [mala, buena, parqs]);
 const puntos = () => p.$$eval('.tv-subvia button', bs => bs.map(x => x.dataset.sub + ':' + ((x.querySelector('.tv-punto') || {}).dataset || {}).estado).join(' '));
 const avisos = () => p.$$eval('.tv-avisos li', ls => ls.map(l => l.innerText.replace(/\s*Ir$/, '')));
 await p.reload(); await abrirVia(p, 'VIA MALA');
 const tabla0 = await p.evaluate(() => JSON.stringify(generarTabla(leerDato('topovias_standalone')[0])));
 console.log('VIA MALA punticos:', await puntos());
 for (const sub of ['estr', 'eje', 'lat', 'parq']) { await p.click(`.tv-subvia button[data-sub=${sub}]`); await p.waitForTimeout(200); console.log(' ', sub, JSON.stringify(await avisos())); }
 await p.click('.tv-subvia button[data-sub=eje]'); await p.waitForTimeout(200);
 console.log('  campos marcados en rojo:', await p.$$eval('input.tv-in', is => is.filter(i => i.style.border.includes('2px solid')).map(i => i.value)));
 console.log('  mensajes bajo los campos:', JSON.stringify(await p.$$eval('div', ds => ds.filter(d => /^✕ |^● (Falta|Llene)/.test(d.innerText) && d.children.length === 0).map(d => d.innerText))));
 await p.screenshot({ path: '../out/avisos_eje.png', fullPage: true });
 await p.locator('.tv-avisos button:has-text("Ir")').last().click(); await p.waitForTimeout(700);
 console.log('  "Ir" lleva al tramo 3 (visible):', await p.locator('#tv-tramo-eje-2').isVisible() && await p.evaluate(() => { const r = document.getElementById('tv-tramo-eje-2').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }));
 console.log('  la tabla no cambió por los avisos:', tabla0 === await p.evaluate(() => JSON.stringify(generarTabla(leerDato('topovias_standalone')[0]))));
 await p.click('.tv-volver'); await p.waitForTimeout(300); await p.getByText(/(^|\s)VIA BUENA$/).first().click(); await p.waitForSelector('.tv-tabs'); await p.waitForTimeout(300);
 console.log('VIA BUENA punticos:', await puntos(), '| avisos:', (await avisos()).length);
 await p.click('.tv-volver'); await p.waitForTimeout(300); await p.getByText(/(^|\s)VIA PARQ$/).first().click(); await p.waitForSelector('.tv-tabs'); await p.waitForTimeout(300);
 await p.click('.tv-subvia button[data-sub=parq]'); await p.waitForTimeout(200);
 console.log('VIA PARQ punticos:', await puntos(), '|', JSON.stringify(await avisos()));
 console.log(errs.join('\n') || 'no errors'); await b.close(); })();
