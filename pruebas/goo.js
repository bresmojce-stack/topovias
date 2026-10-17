const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, m] of [[1280, 900, false], [390, 844, true]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m })).newPage();
    await p.goto('http://localhost:8790/'); await p.waitForTimeout(1500);
    const tabs = ['Eje & Tramos','Estructura Capas','Tabla de Diseño','Nivelación Campo','Volúmenes','Plano & Perfiles'];
    for (const t of tabs) {
      await p.click(`nav button:has-text("${t}")`); await p.waitForTimeout(500);
      await p.screenshot({ path: `${process.argv[2]}_${w}_${t.split(' ')[0]}.png`, fullPage: w > 400 });
    }
  }
  await b.close();
})();
