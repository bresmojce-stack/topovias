// Compara las variables de color de los temas Claro y Oscuro entre la v69 y la versión nueva: deben dar 0 distintas.
// Uso: node cmp_v69.js <v69.html> <index.html>   (la v69 está en la rama respaldo-v69)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch();
 const leer = async (f, t) => { const p = await b.newPage(); await p.goto("file://" + require("path").resolve(f)); await p.waitForSelector('header.tv-header');
   const r = await p.evaluate(t => { document.documentElement.setAttribute('data-tema', t); const cs = getComputedStyle(document.documentElement);
     const raiz = [...document.styleSheets].flatMap(h => { try { return [...h.cssRules]; } catch (_) { return []; } }).find(r => r.selectorText === ':root' && r.style.getPropertyValue('--c-bg'));
     const o = {}; [...raiz.style].filter(n => n.startsWith('--')).forEach(n => o[n] = cs.getPropertyValue(n).trim().toUpperCase()); return o; }, t);
   await p.close(); return r; };
 for (const t of ['claro', 'oscuro']) { const a = await leer(process.argv[2], t), n = await leer(process.argv[3], t);
   const dif = Object.keys(a).filter(k => a[k] !== n[k]); console.log(t + ': ' + Object.keys(a).length + ' variables, distintas: ' + dif.length); dif.slice(0, 40).forEach(k => console.log('  ' + k + ' v69=' + a[k] + ' nueva=' + n[k])); }
 await b.close(); })();
