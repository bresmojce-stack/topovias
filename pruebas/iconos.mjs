const nombres = ["expand","combine"];
const out = {};
for (const n of nombres) {
  try {
    const m = await import(process.argv[2] + "/node_modules/lucide-react/dist/esm/icons/" + n + ".js");
    out[n] = m.__iconNode.map(([tag, at]) => { const { key, ...r } = at; return [tag, r]; });
  } catch (e) { console.error("falta", n); }
}
console.log(JSON.stringify(out));
