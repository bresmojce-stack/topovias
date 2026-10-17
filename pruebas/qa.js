// Revisión general: todas las pantallas en celular, tablet y computador
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const file = process.argv[2], out = process.argv[3];
const SIZES = [['cel-peq', 360, 740, true], ['cel', 390, 844, true], ['tab-vert', 768, 1024, true], ['tab-horiz', 1024, 768, true], ['pc', 1366, 768, false], ['pc-grande', 1920, 1080, false]];
const TABS = ['via', 'parq', 'resultado', 'plano', 'nivel', 'vol', 'cant', 'verif', 'dibujo', 'memoria'];
const T = (ci, cf, pe, di) => ({ cotaInicio: ci, cotaFin: cf, pendiente: pe, distancia: di, id: Math.random() });
const est = { id: 1, nombre: "Est. 1", cotaBM: "966", vistaMas: "1.5", fecha: "2026-10-13" };
const lect = (hasta, l) => { const r = []; for (let a = 0; a <= hasta; a += 5) r.push({ abs: a, sub: 0, estacionId: a === 0 ? 1 : null, der: l, eje: l, izq: l, fecha: "2026-10-13" }); return r; };
const dib = { id: 900, nombre: "Croquis", sig: 4, objs: [
  { id: 1, t: "p", x: 1000, y: 1000, nom: "P1" }, { id: 2, t: "p", x: 1057.5, y: 1000, nom: "P2" }, { id: 3, t: "l", a: { x: 1000, y: 1000 }, b: { x: 1057.5, y: 1000 } },
  { id: 4, t: "pl", c: true, forma: "rect", som: "rayado", col: "#16A34A", v: [{ x: 1010, y: 1003 }, { x: 1025, y: 1003 }, { x: 1025, y: 1008 }, { x: 1010, y: 1008 }] },
  { id: 5, t: "ci", c: { x: 1040, y: 1010 }, r: 4, som: "relleno" }, { id: 6, t: "ar", c: { x: 1050, y: 990 }, r: 5, a1: 0, a2: Math.PI },
  { id: 7, t: "cota", a: { x: 1010, y: 1003 }, b: { x: 1025, y: 1003 }, d: -2 }, { id: 8, t: "fh", v: [{ x: 1000, y: 1015 }, { x: 1005, y: 1018 }, { x: 1010, y: 1014 }] },
  { id: 9, t: "eje", v: [{ x: 1000, y: 1000 }, { x: 1057.5, y: 1000 }], abs0: 0, paso: 10, nom: "EJE 7" }] };
const proj = { id: 1, obraId: 5, nombre: "EJE 7", absInicio: "0", tramos: [T("965.390", "", "-1.820", "27.5"), T("", "965.500", "", "30")], intermedias: [],
  capas: [{ nombre: "Asfalto", espesor: "0.05", id: 1 }, { nombre: "Base", espesor: "0.20", id: 2 }, { nombre: "Subbase", espesor: "0.30", id: 3, sobreancho: "general" }],
  sobreancho: { izq: "0.5", der: "0.4" },
  lateralIzq: { modo: "transversal", ancho: "3", modoT: "pendiente", diferencia: "", pendienteT: "-2", tramos: [T("", "", "", "")], absInicio: "" },
  lateralDer: { modo: "longitudinal", ancho: "3.5", modoT: "diferencia", diferencia: "-0.06", pendienteT: "", tramos: [T("965.33", "", "-1.82", "57.5")], absInicio: "" },
  parqueaderos: [{ id: 9, nombre: "Parq A", modo: "diferencia", lado: "derecho", absInicio: "10", absFin: "25", ancho: "5", sobreAncho: "0.5", saExtremos: "0.3", diferencia: "0.05", tramos: [T("", "", "", "")], coords: [], estructura: "via", capas: [] }],
  bmEstaciones: [], coordsEje: [{ id: 1, norte: "1000", este: "1000" }, { id: 2, norte: "1000", este: "1027.5" }, { id: 3, norte: "1000", este: "1057.5" }], coordsIzq: [], coordsDer: [],
  nivelaciones: [{ id: 21, tipo: "tn", nombre: "Terreno natural", estaciones: [est], lecturas: lect(55, "0.400") }],
  volumenes: [{ id: 31, tipo: "excavacion", nombre: "Excavación", fuenteSup: "nivel__21", fuenteTeorica: "tabla__Excavación", fuenteInf: "tabla__Excavación" }],
  dibujos: [dib] };
(async () => {
  const b = await chromium.launch();
  const resumen = [];
  for (const [name, w, h, tactil] of SIZES) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: tactil && w < 900, hasTouch: tactil, acceptDownloads: true });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 160)); });
    p.on('dialog', d => d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined));
    await p.goto('file://' + file); await p.waitForSelector('header.tv-header');
    await p.evaluate(pr => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999));
      localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'Carambolo' }, { id: 6, nombre: 'Tamarindo' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999)); }, proj);
    await p.reload(); await p.waitForSelector('header.tv-header'); await p.waitForTimeout(300);
    const medir = () => p.evaluate(tactil => {
      const vw = document.documentElement.clientWidth, vh = innerHeight;
      const enScroll = el => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(s.overflowX)) return true; } return false; };
      const fuera = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1 && !enScroll(el) && getComputedStyle(el).position !== 'fixed'; })
        .slice(0, 3).map(el => el.tagName + ':' + (el.innerText || el.getAttribute('class') || '').slice(0, 30).replace(/\s+/g, ' '));
      // botones muy pequeños para el dedo (menos de 30 px de alto o ancho), solo los visibles
      const peq = tactil ? [...document.querySelectorAll('button, select, a, input[type=checkbox]')].filter(el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && (r.height < 30 || r.width < 30) && r.bottom > 0 && r.top < vh; })
        .map(el => (el.innerText || el.title || el.getAttribute('data-color') || el.tagName).slice(0, 14).replace(/\s+/g, ' ') + '(' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height) + ')') : [];
      return { scrollX: document.documentElement.scrollWidth - vw, fuera, peq: peq.slice(0, 6), nPeq: peq.length };
    }, tactil);
    const reg = async (pantalla, extra) => { const m = await medir(); resumen.push({ tam: name, pantalla, ...m, ...(extra || {}) }); await p.screenshot({ path: `${out}/${name}_${pantalla}.png` }); };
    // inicio
    await reg('inicio');
    await p.click('button[data-herramienta=calc]'); await p.waitForTimeout(200); await reg('calc-normal');
    for (const op of ['Cotas y pendientes', 'Distancia entre coordenadas', 'Coordenadas de un punto']) { await p.click(`.tv-calc-opciones button:has-text("${op}")`); await p.waitForTimeout(100); await reg('calc-' + op.split(' ')[0].toLowerCase()); }
    await p.click('.tv-calc-opciones button:has-text("Calculadora")');
    await p.click('button:has-text("Inicio")'); await p.click('button[data-herramienta=dibujo]'); await p.waitForTimeout(200); await reg('dibujo-libre-vacio');
    await p.click('button:has-text("Inicio")'); await p.waitForTimeout(150);
    // obra y vía
    await p.click('main button:has-text("Carambolo")'); await p.waitForTimeout(200); await reg('obra');
    await p.click('main [role="button"]:has-text("EJE 7")'); await p.waitForTimeout(400);
    for (const t of TABS) {
      await p.click(`.tv-tabs button[data-tab=${t}]`); await p.waitForTimeout(250);
      let extra = {};
      if (t === 'dibujo') {
        extra = await p.evaluate(() => { const s = document.querySelector('.tv-dib-svg').getBoundingClientRect(), nav = document.querySelector('.tv-dib-nav').getBoundingClientRect();
          return { lienzoAlto: Math.round(s.height), navVisible: nav.bottom <= innerHeight + 1 }; });
        await reg('via-dibujo', extra);
        for (const g of ['dibujar', 'medir', 'editar', 'ver']) { await p.click(`.tv-dib-nav button[data-grupo=${g}]`); await p.waitForTimeout(120);
          const hoja = await p.evaluate(() => { const r = document.querySelector('.tv-dib-hoja').getBoundingClientRect(); return { hojaArriba: Math.round(r.top), hojaCabe: r.top >= 0 }; });
          await reg('dibujo-menu-' + g, hoja); await p.click(`.tv-dib-nav button[data-grupo=${g}]`); }
        continue;
      }
      await reg('via-' + t);
    }
    // exportar Excel desde la vía (que no falle)
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.click('.tv-acciones > button >> nth=1').then(() => p.click('text=💾 Guardar en el dispositivo'))]).catch(e => [null]);
    resumen.push({ tam: name, pantalla: 'excel', ok: !!dl, archivo: dl && dl.suggestedFilename() });
    if (errs.length) resumen.push({ tam: name, ERRORES: [...new Set(errs)] });
    await ctx.close();
  }
  // informe
  const problemas = resumen.filter(r => r.ERRORES || r.scrollX > 0 || (r.fuera && r.fuera.length) || r.navVisible === false || r.hojaCabe === false || (r.lienzoAlto && r.lienzoAlto < 250) || r.ok === false);
  console.log('Pantallas revisadas:', resumen.filter(r => r.pantalla).length);
  problemas.forEach(r => console.log('PROBLEMA', JSON.stringify(r)));
  const peq = {}; resumen.filter(r => r.nPeq).forEach(r => { (peq[r.tam] = peq[r.tam] || []).push(r.pantalla + ':' + r.nPeq + ' ' + r.peq.join(',')); });
  Object.entries(peq).forEach(([t, l]) => { console.log('BOTONES PEQUEÑOS', t); l.slice(0, 40).forEach(x => console.log('   ', x)); });
  resumen.filter(r => r.lienzoAlto).forEach(r => console.log('lienzo', r.tam, r.lienzoAlto + 'px', 'nav visible', r.navVisible));
  resumen.filter(r => r.pantalla === 'excel').forEach(r => console.log('excel', r.tam, r.ok, r.archivo));
  await b.close();
})();
