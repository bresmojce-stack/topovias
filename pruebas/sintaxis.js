// Revisa lo mínimo antes de publicar: que cada <script> de index.html tenga sintaxis válida (no lo ejecuta)
// y que TV_VERSION (index.html) y CACHE_VERSION (sw.js) sean el mismo número.
//   node pruebas/sintaxis.js [index.html] [sw.js]
const fs = require("fs"), vm = require("vm"), path = require("path");
const raiz = path.join(__dirname, "..");
const html = fs.readFileSync(process.argv[2] || path.join(raiz, "index.html"), "utf8");
const sw = fs.readFileSync(process.argv[3] || path.join(raiz, "sw.js"), "utf8");
let fallas = 0;
const falla = t => { fallas++; console.log("FALLA: " + t); };

let n = 0;
for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  const attrs = m[1] || "";
  if (/\ssrc=/.test(attrs) || (/\stype=/.test(attrs) && !/type=["']?(text\/javascript|module)/.test(attrs))) continue;
  n++;
  const linea = html.slice(0, m.index).split("\n").length;
  try { new vm.Script(m[2], { filename: "index.html (script " + n + ", desde la línea " + linea + ")" }); }
  catch (e) { falla("script " + n + " (línea " + linea + "): " + e.message); }
}
if (!n) falla("no se encontró ningún <script> en index.html");

const tv = (html.match(/const TV_VERSION = "([^"]+)"/) || [])[1], cv = (sw.match(/CACHE_VERSION = "topovias-v([^"]+)"/) || [])[1];
if (!tv || !cv) falla("no se encontró TV_VERSION en index.html o CACHE_VERSION en sw.js");
else if (tv !== cv) falla('TV_VERSION "' + tv + '" y CACHE_VERSION "topovias-v' + cv + '" deben ser el mismo número');

try { new vm.Script(sw, { filename: "sw.js" }); } catch (e) { falla("sw.js: " + e.message); }

console.log(fallas ? fallas + " falla(s)." : "Bien: " + n + " scripts con sintaxis válida, versión " + tv + " igual en index.html y sw.js.");
process.exit(fallas ? 1 : 0);
