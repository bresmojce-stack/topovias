const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console ' + m.text().slice(0,200)); });
  p.on('dialog', d => { errs.push('dialog ' + d.message()); d.accept(); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  await p.evaluate(t => localStorage.setItem('tv_tema', t), process.env.TEMA || 'claro');
  await p.evaluate(() => {
    const T = (ci,cf,pe,di) => ({cotaInicio:ci,cotaFin:cf,pendiente:pe,distancia:di,id:Math.random()});
    const lat = { modo:"transversal",ancho:"3",modoT:"diferencia",diferencia:"-0.06",pendienteT:"",tramos:[T("","","","")],absInicio:"" };
    const base = (id, nombre, capas, extra) => ({ ...proyVacio(), id, obraId: 77, nombre, tramos: [T("965.59","","-2","57.5")], capas, lateralIzq: lat, lateralDer: lat, ...extra });
    const vias = [
      base(1, "EJE 7", [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.15",id:2}], { cantidades: { capasExcluidas: ["asfalto"], extras: [{id:1,nombre:"Geotextil"}] }, sardinel: { activo: true, corona: "0.15", pata: "0.20", altura: "0.45", revelado: "0.15", lados: { izq: true, der: true, ini: true, fin: true }, sin: [], ejecutado: [] } }),
      base(2, "EJE 6", [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"Base",espesor:"0.15",id:2},{nombre:"roca",espesor:"0.30",id:3}], { cantidades: { areaManual: "513.6", capasExcluidas: ["asfalto"] },
        volumenes: [{ id: 5, nombre: "Exc", fuenteSup: "tabla__rasante", fuenteInf: "tabla__roca", sobreAncho: "0", concepto: "Excavación" }] }),
      base(3, "EJE 7", [{nombre:"asfalto",espesor:"0.05",id:1},{nombre:"base",espesor:"0.20",id:2}], {}),
      { ...proyVacio(), id: 4, obraId: 77, nombre: "Parqueadero: visitantes / norte" }
    ];
    localStorage.setItem('topovias_standalone', JSON.stringify(vias));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 77, nombre: "Obra Prueba" }]));
    localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: "obra", obraId: 77 }));
  });
  await p.reload(); await p.waitForTimeout(500);
  const tabla = await p.$$eval('main table tr', trs => trs.map(tr => [...tr.cells].map(c => c.innerText).join(' | ')));
  console.log('Resumen en pantalla:'); tabla.forEach(r => console.log('   ' + r));
  await p.screenshot({ path: process.argv[3] + '.png', fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=📚 Crear libro de Obra Prueba').then(() => p.click('text=💾 Guardar en el dispositivo'))]);
  await dl.saveAs(process.argv[3] + '.xlsx');
  console.log('archivo:', dl.suggestedFilename());
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
