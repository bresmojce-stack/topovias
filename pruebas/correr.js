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
  ['auto acotar y cuadro de coordenadas', 'autoacotar', '../out/autoacotar'],
  ['excavación con terreno bajo la cota teórica', 'cortesbajo', ''],
  ['dos parqueaderos que se tocan (abscisa repetida)', 'escalon', '../out/escalon'],
  ['semáforo de las vías', 'estadovia', '../out/estadovia'],
  ['botón instalar al final', 'instalarfinal', '../out/instalarfinal'],
  ['calculadora: coordenadas sin cota', 'calccoords', '../out/calccoords'],
  ['cartera: fila activa y sin fechas', 'filaactiva', '../out/filaactiva'],
  ['dibujo: un lado, diámetro, descomponer y regenerar', 'dibujoclaro', '../out/dibujoclaro'],
  ['dibujo → vía (eje, laterales, parqueaderos)', 'dibujovia', '../out/dibujovia'],
  ['dibujo → vía con el dibujo real de EJE 3', 'dibujovia2', '../out/dibujovia2'],
  ['dibujo → vía: marcar parqueadero con el dedo', 'dibujovia3', '../out/dibujovia3'],
  ['dibujo → vía: cotas del eje y PI de rasante', 'dibujovia4', '../out/dibujovia4'],
  ['dibujo: lista de puntos (esconder, color, nombre)', 'listapuntos', '../out/listapuntos'],
  ['dibujo: tipos de línea (pantalla y DXF)', 'lineas', '../out/lineas'],
  ['dibujo: pellizco con un dedo fuera del lienzo', 'pellizco', ''],
  ['abscisa repetida solo en la superficie de abajo', 'abscisarep', '../out/abscisarep'],
  ['tabla de puntos (PC)', 'tablapuntos', '../out/tablapuntos'],
  ['tabla de puntos (celular)', 'tablapuntos', '../out/tablapuntos_m', { W: '390' }],
  ['unitarias: cálculo (tramos, cotas, abscisas, redondeo)', 'u_calculo', ''],
  ['unitarias: entrada (coma, azimut, tabla de puntos, calculadora, copia)', 'u_entrada', ''],
  ['unitarias: datos (guardado, bloqueadas, Drive, Dibujo)', 'u_datos', ''],
  ['Excel tema Claro', 'excel_tema', '../out/xl_claro', { TEMA: 'claro' }],
  ['Excel tema Agua', 'excel_tema', '../out/xl_agua', { TEMA: 'agua' }],
];
const MALO = /PAGEERROR|TimeoutError|Error:|Cannot read properties|is not defined/;
// Lo que debe salir, tal cual, en la salida de cada prueba (valores revisados a mano y en el Excel, versión 75).
// Si un cambio mueve un cálculo a propósito, se revisa el número nuevo con Brian y se cambia aquí.
const ESPERA = {
  pellizco: ['Todo bien (pellizco).'],
  extremos2: ['100.992 m³', '238.191 m³', '27.372 m³', '99.288 m³', '50.720 m³'],
  cant: ['volúmenes individuales: [ 25.375, 25.375, 76.125 ]', 'Asfalto | 495.000 | 0.050', 'Base | 719.980 | 0.150'],
  saparq: ['subbase | 482.520 | 0.200 | 96.504 m³', 'roca | 461.460 | 0.300 | 138.438 m³', "volumen: [ '99.750 m³' ]"],
  sardinel: ['"total":212,"ejec":110,"area":0.079,"vol":16.748', 'xlsx ["TOTAL",212,110,102,51.9]'],
  libro: ['TOTAL | 1203.600 | 197.790 | 345.000 | 154.080 | 69.000 | 17.250'],
  fallos: ['xlsx ["TOTAL",2.959]', 'xlsx ["Excavación","m³",452.959]'],
  excsitio: ['VOLUMEN TOTAL\t72.000 m³', '"Excavación\\t\\t\\t468.000 m³"'],
  cabecera: ['xlsx ["TOTAL",135.463]', 'Corte 135.463'],
  temas6: ['sin localStorage → tema: claro | errores: ninguno', 'tema guardado inválido →  claro'],
  latcoords: ['cerrados → tarjetas de coordenadas visibles: 1', 'abierto el derecho → 2'],
  plantaagua: ['flechas de agua en la planta: 26 | punto bajo: true'],
  recorrido: ['datos iguales: true'],
  cortesbajo: ['corte 1: 74.25 | corte 2: 246.75 | suma: 321 | terreno → sitio: 321'],
  escalon: ['0+041.500 (2) 955.21', '41.5(2) 0.213 11.4 2.428 0 0', 'total app: 11.668 | a mano: 11.668 | IGUALES', 'Parqueadero 1 200 + Parqueadero 2 21.06 = 221.06', '0+041.500 (2)', '(2) 955.21 | total 11.668 (igual a dos parqueaderos)', 'Parqueadero 1 · sección 1 40.5×5.5=222.75 + Parqueadero 1 · sección 2 4.4×5.9=26.16', 'sardinel del parqueadero: 54.7', 'sin lectura (2): total 11.668 (no se corta)', '11. dos parqueaderos separados: área 603.06', 'un parqueadero: área 603.06 IGUALES', '12. sardinel separados: 54.7', 'un parqueadero: 54.7 IGUALES', '14. fallo en la sección ancha: app 955.133 | a mano 955.133 IGUALES'],
  filaactiva: ['cartel: false | ✏ Escribiendo en 0+010.000 · columna LAT DER', 'encabezados: ABSCISA,📌 Est.,PARQ DER,LAT DER,EJE,LAT IZQ,PARQ IZQ', 'cartel tras salir hidden: true', 'no errors'],
  dibujoclaro: ['1. un lado del rectángulo: cota 17.000(-)', '2. otro lado: cota 11.000(-)', 'cota 10.000(-)', 'Acotados 1 objetos', 'Descompuesto en 4 líneas', 'largos: 17.000 11.000 17.000 11.000', '6. deshacer: rectángulo de vuelta: 1', '7. descomponer elegidos: 0 figuras quedan | 7 líneas', '8. regenerar: transform = "" | Imagen regenerada', 'no errors'],
  dibujovia: ['2. eje: [{"norte":"0","este":"0"},{"norte":"100","este":"0"}] | tramos: 100 | abs inicio: 0', '3. laterales: 3 3', '4. parqueaderos: Parqueadero izq. 1 i 20-30 w4 | Parqueadero izq. 2 i 40-50 w2 | Parqueadero izq. 3 i 60-100 w6 | Parqueadero der. 1 d 10-30 w6 | Parqueadero der. 2 d 55-95 w5', 'parqueaderos tras repetir: 5', '6. abs 0 = 1+000: inicio 1000 | 1020-1030 | 1040-1050 | 1060-1100 | 1010-1030 | 1055-1095', '7. invertido: eje ["100","0"] | i 5-45 w5 | i 70-90 w6 | d 0-40 w6 | d 50-60 w2 | d 70-80 w4', '8. tras ↶ Deshacer: eje ["0","100"]', 'que cruza el eje (cabecera o línea de cruce)', 'no errors'],
  dibujovia2: ['Polilínea de 8 puntos · 42.857 m', '4. eje PI: 8 | tramos: 6.8, 7.549, 0.595, 8.996, 0.641, 3.133, 15.142', '5. laterales: 3 3', '6. parqueaderos: i 6.8-14.348 w5.002 | i 14.943-23.941 w2.002 | i 24.575-42.857 w5.002 | d 1.549-14.349 w5.399 | d 27.964-40.465 w5', 'muy corta (1.031 m)', 'no errors'],
  dibujovia3: ['3. barra: MARCAR PARQUEADERO', '4.3 en vivo con 4 puntos: MARCAR PARQUEADERO · DER · 0+017.000 → 0+024.000 · ancho 3.500 m · 4 puntos', 'd 17-24 w3.5', 'no errors'],
  dibujovia4: ['5. eje: 10 puntos | 9 tramos | con parte: 5,9', '7. rasante calculada por la app: 0+010 = 954.966 | 0+020 = 954.8 | 0+025 = 954.617 | 0+035 = 954.5 | 0+040 = 954.309', '-> IGUALES', 'no errors'],
  listapuntos: ['1. filas: 5', '2. orden y coordenadas: A N 0.000 E 0.000 ; B N 30.000 E 40.000 ; P3 N 5.000 E 10.000 ; P4 N 15.000 E 20.000 ; P10 N 8.000 E 30.000', '3. escondidos: P3,P4', '4. tocar un punto escondido abre panel: 0', '5. DXF nombres de puntos: A,B,P10', '6. color P10: #2563EB | nombre del 2: BM-1', '7. escondidos ahora: 0', '8. filtro "P1": P10', 'no errors'],
  lineas: ['2. rectángulo tipo: disc | guion en pantalla: 10 6', '3. punteada: punt', '4. continua: tipo = undefined', '5. línea: centro | círculo: trazop', '6. varios: fant, fant, fant', '7. líneas del rectángulo descompuesto: 4', 'DXF tipos definidos: CONTINUOUS DASHED DOT DASHDOT CENTER PHANTOM', 'no errors'],
  abscisarep: ['0+020.000 (2) | 12 | 0 | 0', '0+025.000 | 12 | 5 | 60', '2. total app: 360 | a mano: 360 | IGUALES', 'no errors'],
  calccoords: ['columnas: 2 campos por punto | cota visible: 0', 'distancia | 50.000 m', 'desnivel/pendiente: no salen', 'cabe sin desbordar: true', 'punto nuevo: campos de cota: 0 | desnivel: 0'],
  instalarfinal: ['botón al final: 1 | abajo', 'sin aviso del navegador: Toca los tres puntos', 'ventana abierta 1 vez | botón después de aceptar: 0'],
  estadovia: ['marcadas: EJE 1:ok EJE 2:falta EJE 3:malo | sigue en la obra: true', 'quitar el amarillo: EJE 1:ok EJE 2:- EJE 3:malo', 'después de recargar: ok malo'],
  tablapuntos: ['Dibujar todos (6 listos · 2 por revisar)', 'nuevos: P3, P4, BM1, P6, BM1, P10, pl 6 abierta | sig: 11', 'quedan en la tabla: P7, P8',
    'nuevos: P7, P8, pl | tabla abierta: false | sig: 11', 'deshacer quita 3 objetos', 'nuevos: E1, P12, E3, pl 3 cerrada | sig: 13', 'Norte/Este cortados: 0', 'barra de arriba cabe: true', 'filas en una línea: true | columna de cota: 0'],
  // las unitarias fallan con código 1; además deben decir 0 fallas
  u_calculo: ['unitarias cálculo:', ' 0 fallas'], u_entrada: ['unitarias entrada:', ' 0 fallas'], u_datos: ['unitarias datos:', ' 0 fallas'],
  autoacotar: ['"Área 187.000 m²", "Perím. 56.000 m"', '4. círculo r5: "R 5.000", "Área 78.540 m²", "Perím. 31.416 m", cota 10.000(-)', '"R 5.000", "Cuerda 10.000", "Arco 15.708"', 'pie: Área 187.000 m²   Perímetro 56.000 m', 'movido 25 m al este: 25.000 0.000'],
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
for (const x of ['extremos2_1', 'extremos2_2', 'cabecera', 'escalon', 'escalon_b', 'escalon_d', 'abscisarep']) {
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
