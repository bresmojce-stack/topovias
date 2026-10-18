// Corre las pruebas principales una tras otra y dice cuáles fallaron.
// Uso (desde la carpeta de trabajo, ver LEEME.md):  node correr.js /ruta/a/index.html
// Solo algunas:  SOLO=cant,deshacer node correr.js /ruta/a/index.html   (por nombre de archivo)
// Una prueba falla si termina con error, si se pasa del tiempo, si su salida trae un error de la página
// o si no salen los números esperados (ESPERA). Al final recalcula unos Excel en LibreOffice: fórmulas = app.
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const index = process.argv[2] && path.resolve(process.argv[2]); // ruta completa: las pruebas abren file://<ruta>
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
  ['avisos y punticos', 'avisos', ''],
  ['pantallas celular (Claro)', 'recorrido', '', { TB: 'claro', W: '390' }],
  ['pantallas PC (Oscuro)', 'recorrido', '', { TB: 'oscuro', W: '1280' }],
  ['pantallas celular (Aire)', 'recorrido', '', { TB: 'aire', W: '390' }],
  ['pantallas tablet (Agua)', 'recorrido', '', { TB: 'agua', W: '820', TACTIL: '1' }],
  ['seis temas', 'temas6', ''],
  ['coordenadas de los laterales', 'latcoords', ''],
  ['agua en la planta real', 'plantaagua', ''],
  ['Excel tema Claro', 'excel_tema', '../out/xl_claro', { TEMA: 'claro' }],
  ['Excel tema Agua', 'excel_tema', '../out/xl_agua', { TEMA: 'agua' }],
];
const MALO = /PAGEERROR|TimeoutError|Error:|Cannot read properties|is not defined/;
// Lo que debe salir, tal cual, en la salida de cada prueba (valores revisados a mano y en el Excel, versión 75).
// Si un cambio mueve un cálculo a propósito, se revisa el número nuevo con Brian y se cambia aquí.
const ESPERA = {
  extremos2: ['100.992 m³', '238.191 m³', '27.372 m³', '99.288 m³', '50.720 m³'],
  cant: ['volúmenes individuales: [ 25.375, 25.375, 76.125 ]', 'Asfalto | 495.000 | 0.050', 'Base | 719.980 | 0.150'],
  saparq: ['subbase | 476.550 | 0.200 | 95.310 m³', 'roca | 457.680 | 0.300 | 137.304 m³', "volumen: [ '99.750 m³' ]"],
  sardinel: ['"total":212,"ejec":110,"area":0.079,"vol":16.748', 'xlsx ["TOTAL",212,110,102,51.9]'],
  libro: ['TOTAL | 1203.600 | 197.790 | 345.000 | 154.080 | 69.000 | 17.250'],
  fallos: ['xlsx ["TOTAL",2.959]', 'xlsx ["Excavación","m³",452.959]'],
  excsitio: ['VOLUMEN TOTAL\t72.000 m³', '"Excavación\\t\\t\\t468.000 m³"'],
  cabecera: ['xlsx ["TOTAL",135.463]', 'Corte 135.463'],
  temas6: ['sin localStorage → tema: claro | errores: ninguno', 'tema guardado inválido →  claro'],
  latcoords: ['cerrados → tarjetas de coordenadas visibles: 1', 'abierto el derecho → 2'],
  plantaagua: ['flechas de agua en la planta: 26 | punto bajo: true'],
  recorrido: ['datos iguales: true'],
};

const solo = process.env.SOLO ? process.env.SOLO.split(',') : null;
const res = [], inicio = Date.now();
for (const [nombre, f, salida, env] of PRUEBAS.filter(x => !solo || solo.includes(x[1]))) {
  const t0 = Date.now();
  const r = spawnSync('node', [f + '.js', index].concat(salida ? [salida] : []), { env: { ...process.env, ...(env || {}) }, encoding: 'utf8', timeout: 240000 });
  const texto = (r.stdout || '') + (r.stderr || '');
  const faltan = (ESPERA[f] || []).filter(e => !texto.includes(e));
  const ok = r.status === 0 && !MALO.test(texto) && !faltan.length;
  res.push({ nombre, ok });
  console.log((ok ? '  ✓ ' : '  ✗ ') + nombre + '  (' + Math.round((Date.now() - t0) / 1000) + ' s)');
  if (!ok) console.log('      ' + (r.error ? 'se pasó del tiempo' : texto.split('\n').filter(l => MALO.test(l)).slice(0, 3).join('\n      ') || (faltan.length ? 'no salió: ' + faltan.join(' · ') : 'terminó con código ' + r.status)));
}
// fórmulas del Excel recalculadas en LibreOffice = valores de la app (uno con parqueaderos y sobreancho, uno de cabecera)
for (const x of ['extremos2_1', 'extremos2_2', 'cabecera']) {
  const f = '../out/' + x + '.xlsx'; if (!fs.existsSync(f) || fs.statSync(f).mtimeMs < inicio) continue; // solo los de esta corrida
  const r = spawnSync('bash', ['lo_cmp.sh', f], { encoding: 'utf8', timeout: 240000 });
  const ok = / 0 differ/.test(r.stdout || ''), nombre = 'LibreOffice = app (' + x + ')';
  res.push({ nombre, ok }); console.log((ok ? '  ✓ ' : '  ✗ ') + nombre + '  ' + ((r.stdout || '').trim().split('\n').pop() || 'no se pudo recalcular'));
}
// Claro y Oscuro con los mismos colores que la v69 (respaldo en la rama respaldo-v69)
if (!solo || solo.includes('cmp_v69')) {
  const dir = path.dirname(path.resolve(index)), v69 = '../out/v69.html'; let ok = false, txt = 'no se encontró la rama respaldo-v69';
  for (const rama of ['respaldo-v69', 'origin/respaldo-v69']) try { fs.writeFileSync(v69, execFileSync('git', ['-C', dir, 'show', rama + ':index.html'], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 })); break; } catch (e) {}
  if (fs.existsSync(v69)) { const r = spawnSync('node', ['cmp_v69.js', v69, index], { encoding: 'utf8', timeout: 120000 }); txt = (r.stdout || '').trim().split('\n').filter(l => /distintas/.test(l)).join(' · '); ok = (txt.match(/distintas: 0\b/g) || []).length === 2; }
  res.push({ nombre: 'Claro y Oscuro iguales a la v69', ok }); console.log((ok ? '  ✓ ' : '  ✗ ') + 'Claro y Oscuro iguales a la v69  ' + txt);
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
