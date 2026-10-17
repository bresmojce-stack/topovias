const acorn = require('/opt/node-tools/node_modules/acorn'), walk = require('/opt/node-tools/node_modules/acorn-walk'), fs = require('fs');
const h = fs.readFileSync(process.argv[2], 'utf8'); const i = h.indexOf('// Colores (diseño'); const a = h.lastIndexOf('<script>', i) + 8, b = h.indexOf('</script>', a);
const code = h.slice(a, b); const ast = acorn.parse(code, { ecmaVersion: 'latest' });
const KEY = process.argv[3].split(',');
const decl = {};
for (const n of ast.body) {
  let name = n.type === 'FunctionDeclaration' ? n.id.name : (n.type === 'VariableDeclaration' && n.declarations[0].id.type === 'Identifier' ? n.declarations[0].id.name : null);
  if (name) decl[name] = n;
}
const out = {};
for (const k of KEY) {
  const n = decl[k]; if (!n) { out[k] = null; continue; }
  const lineas = code.slice(n.start, n.end).split('\n').length; const usa = new Set();
  walk.full(n, x => { if (x.type === 'Identifier' && x.name !== k && KEY.includes(x.name)) usa.add(x.name); });
  out[k] = { lineas, usa: [...usa] };
}
console.log(JSON.stringify(out, null, 0));
console.log('total app:', code.split('\n').length, 'funciones/const de nivel superior:', Object.keys(decl).length);
