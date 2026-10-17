// Encuentra declaraciones de nivel superior que nadie usa (iterando: al quitar una, otras pueden quedar sin uso)
const acorn = require('/opt/node-tools/node_modules/acorn'), walk = require('/opt/node-tools/node_modules/acorn-walk'), fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const ini = html.indexOf('<script>', html.indexOf('// Colores (diseño')-200);
const a = html.lastIndexOf('<script>', html.indexOf('// Colores (diseño')) + 8, b = html.indexOf('</script>', a);
let code = html.slice(a, b);
const quitar = new Set(), todos = [];
for (let vuelta = 0; vuelta < 10; vuelta++) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
  const decl = [];
  for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration') decl.push({ name: n.id.name, start: n.start, end: n.end });
    else if (n.type === 'VariableDeclaration' && n.declarations.length === 1 && n.declarations[0].id.type === 'Identifier') decl.push({ name: n.declarations[0].id.name, start: n.start, end: n.end });
  }
  const usos = {};
  walk.full(ast, nd => { if (nd.type === 'Identifier') usos[nd.name] = (usos[nd.name] || 0) + 1; });
  // cada declaración cuenta su propio nombre una vez (o más si es recursiva: se cuenta dentro de su rango)
  const sinUso = decl.filter(d => {
    let dentro = 0; walk.full(acorn.parse(code.slice(d.start, d.end), { ecmaVersion: 'latest' }), nd => { if (nd.type === 'Identifier' && nd.name === d.name) dentro++; });
    return (usos[d.name] || 0) - dentro === 0;
  });
  if (!sinUso.length) break;
  sinUso.sort((x, y) => y.start - x.start).forEach(d => {
    todos.push({ name: d.name, lineas: code.slice(d.start, d.end).split('\n').length, vuelta });
    let e = d.end; while (code[e] === ';' || code[e] === ' ') e++; if (code[e] === '\n') e++;
    code = code.slice(0, d.start) + code.slice(e);
  });
}
console.log(JSON.stringify(todos));
console.log('líneas quitadas:', todos.reduce((s, t) => s + t.lineas, 0));
if (process.argv[3]) fs.writeFileSync(process.argv[3], html.slice(0, a) + code + html.slice(b));
