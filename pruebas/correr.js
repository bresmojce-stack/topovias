// Corre las pruebas principales una tras otra y dice cuáles fallaron.
// Uso (desde la carpeta de trabajo, ver LEEME.md):  node correr.js /ruta/a/index.html
// Solo algunas:  SOLO=cant,deshacer node correr.js /ruta/a/index.html   (por nombre de archivo)
// Una prueba falla si termina con error, si se pasa del tiempo o si su salida trae un error de la página.
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const index = process.argv[2];
if (!index || !fs.existsSync(index)) { console.log('Uso: node correr.js /ruta/a/index.html'); process.exit(2); }
fs.mkdirSync('../out', { recursive: true });

// [nombre que se muestra, archivo, salida, variables de entorno]
const PRUEBAS = [
  ['rutina completa', 'e2e', '../out/e2e.png'],
  ['exportar Excel', 'export', '../out/export.png'],
  ['fórmulas del Excel', 'formulas', '../out/formulas'],
  ['cotas de nivelación', 'nivcotas', '../out/nivcotas.png'],
  ['parqueadero de cabecera', 'cabecera', '../out/cabecera'],
  ['sardinel', 'sardinel', '../out/sardinel'],
  ['libro de obra', 'libro', '../out/libro'],
  ['vía bloqueada', 'bloqueo', '../out/bloqueo'],
  ['fallos', 'fallos', '../out/fallos'],
  ['excavación en sitio', 'excsitio', '../out/excsitio'],
  ['perfil con tramas', 'perfil2', '../out/perfil2'],
  ['cantidades', 'cant', '../out/cant.png'],
  ['pestañas y laterales', 'via', '../out/via'],
  ['sobreancho en extremos', 'extremos2', '../out/extremos2'],
  ['sobreancho del parqueadero', 'saparq', '../out/saparq.png'],
  ['deshacer y rehacer', 'deshacer', '../out/deshacer'],
  ['punto nuevo en planta', 'partir', '../out/partir'],
  ['parqueaderos en planta', 'parqplanta', '../out/parqplanta'],
  ['desplegables', 'despl', '../out/despl'],
  ['explicaciones plegadas', 'ayuda', ''],
  ['pantallas celular (Claro)', 'recorrido', '', { TB: 'claro', W: '390' }],
  ['pantallas PC (Oscuro)', 'recorrido', '', { TB: 'oscuro', W: '1280' }],
  ['pantallas celular (Aire)', 'recorrido', '', { TB: 'aire', W: '390' }],
  ['Excel tema Claro', 'excel_tema', '../out/xl_claro', { TEMA: 'claro' }],
  ['Excel tema Agua', 'excel_tema', '../out/xl_agua', { TEMA: 'agua' }],
];
const MALO = /PAGEERROR|TimeoutError|Error:|Cannot read properties|is not defined/;

const solo = process.env.SOLO ? process.env.SOLO.split(',') : null;
const res = [];
for (const [nombre, f, salida, env] of PRUEBAS.filter(x => !solo || solo.includes(x[1]))) {
  const t0 = Date.now();
  const r = spawnSync('node', [f + '.js', index].concat(salida ? [salida] : []), { env: { ...process.env, ...(env || {}) }, encoding: 'utf8', timeout: 240000 });
  const texto = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0 && !MALO.test(texto);
  res.push({ nombre, ok });
  console.log((ok ? '  ✓ ' : '  ✗ ') + nombre + '  (' + Math.round((Date.now() - t0) / 1000) + ' s)');
  if (!ok) console.log('      ' + (r.error ? 'se pasó del tiempo' : texto.split('\n').filter(l => MALO.test(l)).slice(0, 3).join('\n      ') || 'terminó con código ' + r.status));
}
// el Excel debe salir igual en cualquier tema (solo cambia la fecha interna docProps/core.xml)
if (!solo || solo.includes('excel_tema')) try {
  const dif = execFileSync('python3', ['-c', `import zipfile,sys
a,b=[zipfile.ZipFile(x) for x in sys.argv[1:]]
d=[n for n in a.namelist() if n!='docProps/core.xml' and a.read(n)!=b.read(n)]
print(','.join(d))`, '../out/xl_claro.xlsx', '../out/xl_agua.xlsx'], { encoding: 'utf8' }).trim();
  res.push({ nombre: 'Excel igual en los temas', ok: !dif });
  console.log((dif ? '  ✗ ' : '  ✓ ') + 'Excel igual en los temas' + (dif ? '  (distinto: ' + dif + ')' : ''));
} catch (e) { res.push({ nombre: 'Excel igual en los temas', ok: false }); console.log('  ✗ Excel igual en los temas (no se pudo comparar)'); }

const malas = res.filter(r => !r.ok);
console.log('\n' + (res.length - malas.length) + ' de ' + res.length + ' pasaron.' + (malas.length ? ' Fallaron: ' + malas.map(r => r.nombre).join(', ') : ''));
process.exit(malas.length ? 1 : 0);
