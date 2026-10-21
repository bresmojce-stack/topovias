// Pruebas unitarias de lo que escribe o trae la persona: coma decimal, números, azimut y rumbo, tabla de puntos,
// calculadora (y sus mensajes de error), copia de seguridad y textos que van al SVG o al Excel.
// Uso: node u_entrada.js /ruta/a/index.html
const { abrirApp, cerrar, unitarias } = require('./base');
(async () => {
  const { b, p, errs } = await abrirApp();
  await unitarias(p, 'unitarias entrada', () => {
    // ── coma decimal ──
    prueba('coma decimal: "12,5" pasa a "12.5" y "1.234,56" a "1234.56"', () => { igual(numeroConPunto("12,5"), "12.5"); igual(numeroConPunto("1.234,56"), "1234.56"); igual(numeroConPunto(",5"), ".5"); });
    prueba('coma decimal: lo que no es un número con coma no se toca', () => {
      igual(numeroConPunto("1,2,3"), "1,2,3"); igual(numeroConPunto("Vía 1, tramo 2"), "Vía 1, tramo 2"); igual(numeroConPunto(","), ","); igual(numeroConPunto(12), 12); });
    prueba('coma decimal en datos guardados: corrige números con coma en objetos y listas, y deja el resto', () =>
      igual(corregirComas({ a: "1,5", b: ["2,5", { c: "x,y" }], n: 3, z: null }), { a: "1.5", b: ["2.5", { c: "x,y" }], n: 3, z: null }));
    prueba('leerNumero: coma o punto; lo que no es número da null; el 0 es número', () => {
      igual(leerNumero("12,5"), 12.5); igual(leerNumero(" 7 "), 7); igual(leerNumero("abc"), null); igual(leerNumero(""), null); igual(leerNumero(0), 0); });
    prueba('avisoNumero: avisa el texto que la app leería distinto ("12,5m" se lee 12)', () => {
      verdad(/la app lee 12/.test(avisoNumero("12,5m")), avisoNumero("12,5m")); verdad(/no se usa/.test(avisoNumero("abc"))); });
    prueba('avisoNumero: no avisa un número limpio, un campo vacío ni un "-" que se está escribiendo', () => {
      igual(avisoNumero("12.5"), null); igual(avisoNumero(""), null); igual(avisoNumero(null), null); igual(avisoNumero("-"), null); igual(avisoNumero("."), null); });

    // ── tabla de puntos ──
    prueba('número de la tabla de puntos: coma o punto, signo, ".5"; lo demás es null (no se adivina)', () => {
      igual(numTabla("863104,065"), 863104.065); igual(numTabla("-12.5"), -12.5); igual(numTabla(".5"), 0.5);
      igual(numTabla("1.234,5"), null); igual(numTabla("12a"), null); igual(numTabla(""), null); igual(numTabla(null), null); });
    prueba('pegar tabla desde Excel (tabuladores), con nombre', () =>
      igual(pegarTablaPuntos("P1\t100\t200\nP2\t110\t210"), [{ nom: "P1", n: "100", e: "200" }, { nom: "P2", n: "110", e: "210" }]));
    prueba('pegar tabla: el encabezado y las líneas en blanco se saltan; punto y coma sirve', () =>
      igual(pegarTablaPuntos("Nombre;Norte;Este\n\nA;1;2\n"), [{ nom: "A", n: "1", e: "2" }]));
    prueba('pegar tabla: solo Norte y Este (sin nombre)', () => igual(pegarTablaPuntos("100 200"), [{ nom: "", n: "100", e: "200" }]));
    prueba('pegar tabla: texto vacío da lista vacía', () => { igual(pegarTablaPuntos(""), []); igual(pegarTablaPuntos(null), []); });
    const filas = l => l.map(([nom, n, e]) => ({ nom, n, e }));
    prueba('revisar tabla: la fila con un número malo no se dibuja y dice por qué', () => {
      const r = revisarTablaPuntos(filas([["A", "100", "200"], ["", "x", "5"]]), { modo: "cons" }, [], 1);
      igual(r.puntos.length, 1); igual(r.puntos[0].nom, "A"); igual(r.malas.length, 1); igual(r.malas[0].fila, 1); verdad(/no es un número/.test(r.malas[0].msg), r.malas[0].msg); });
    prueba('revisar tabla: un dígito de más (a más de 5 km de las demás) no se dibuja', () => {
      const r = revisarTablaPuntos(filas([["A", "1000", "2000"], ["B", "1010", "2010"], ["C", "10100", "2020"]]), { modo: "nombre" }, [], 1);
      igual(r.puntos.map(q => q.nom), ["A", "B"]); verdad(/km/.test(r.malas[0].msg), r.malas[0].msg); });
    prueba('revisar tabla: nombre repetido se dibuja pero avisa', () => {
      const r = revisarTablaPuntos(filas([["A", "1", "2"], ["A", "3", "4"]]), { modo: "nombre" }, [], 1);
      igual(r.puntos.length, 2); verdad(r.avisos.some(a => /ya está en la fila/.test(a.msg))); });
    prueba('revisar tabla: sin nombre en modo consecutivo toma letra y número', () => {
      const r = revisarTablaPuntos(filas([["", "1", "2"], ["", "3", "4"]]), { modo: "cons", letra: "P", desde: "7" }, [], 1);
      igual(r.puntos.map(q => q.nom), ["P7", "P8"]); });
    prueba('revisar tabla: filas vacías no son error', () => igual(revisarTablaPuntos(filas([["", "", ""]]), { modo: "cons" }, [], 1).malas, []));

    // ── azimut, rumbo y grados-minutos-segundos ──
    prueba('azimut decimal y en grados minutos segundos', () => {
      igual(leerAzimut("53.1301"), 53.1301); cerca(leerAzimut("53 07 48.4"), 53.130111, 1e-6); cerca(leerAzimut("53°07'48.4\""), 53.130111, 1e-6); igual(leerAzimut("45,5"), 45.5); });
    prueba('rumbo a azimut en los cuatro cuadrantes (E/W y también O de oeste)', () => {
      igual(leerAzimut("N 30 E"), 30); igual(leerAzimut("S 45 E"), 135); igual(leerAzimut("S 45 W"), 225); igual(leerAzimut("N 30 O"), 330); igual(leerAzimut("n 0 w"), 0); });
    prueba('azimut malo da null (mejor no dibujar que adivinar)', () => {
      igual(leerAzimut("-30"), null); igual(leerAzimut("30x"), null); igual(leerAzimut("S 95 E"), null); igual(leerAzimut(""), null); igual(leerAzimut(null), null); });
    prueba('grados minutos segundos: 359.99999999° se muestra 0°, no 360°', () => {
      igual(gradosAGMS(359.99999999), "0°00'00.0\""); igual(gradosAGMS(90), "90°00'00.0\""); igual(gradosAGMS(0.5), "0°30'00.0\""); });
    prueba('rumbo desde azimut y de vuelta', () => {
      igual(rumboDesdeAzimut(135), "S 45°00'00.0\" E"); igual(rumboDesdeAzimut(300), "N 60°00'00.0\" W");
      [10, 100, 200, 350].forEach(a => cerca(leerAzimut(rumboDesdeAzimut(a)), a, 1e-4)); });

    // ── calculadora ──
    const cuenta = (t, ans) => evaluarExpresion(t, ans).v;
    prueba('calculadora: orden de las operaciones y paréntesis', () => { igual(cuenta("2+3*4"), 14); igual(cuenta("(2+3)*4"), 20); igual(cuenta("2^3^2"), 512); igual(cuenta("-2^2"), -4); });
    prueba('calculadora: multiplicación sin signo va primero, como en la Casio (100÷2π)', () => cerca(cuenta("100÷2π"), 100 / (2 * Math.PI)));
    prueba('calculadora: funciones en grados, factorial, grados°minutos\'', () => {
      cerca(cuenta("sin(30)"), 0.5); igual(cuenta("3!"), 6); igual(cuenta("30°30'"), 30.5); igual(cuenta("√(16)"), 4); });
    prueba('calculadora: Pol da distancia y ángulo', () => { const r = evaluarExpresion("Pol(3,4)"); igual(r.v, 5); cerca(r.par.th, 53.130102, 1e-6); });
    prueba('calculadora: Ans usa el resultado anterior', () => igual(cuenta("Ans+1", 4), 5));
    prueba('calculadora: falta cerrar un paréntesis al final se acepta, como en la Casio', () => igual(cuenta("(1+2"), 3));
    prueba('calculadora error: dividir entre cero', () => lanza(() => cuenta("1/0"), "dividir entre cero"));
    prueba('calculadora error: cuenta vacía o incompleta', () => { lanza(() => cuenta(""), "Escribe una cuenta"); lanza(() => cuenta("2+"), "incompleta"); });
    prueba('calculadora error: paréntesis de más', () => lanza(() => cuenta("1)"), "Sobra un paréntesis"));
    prueba('calculadora error: Ans sin resultado anterior', () => lanza(() => cuenta("Ans+1", null), "Todavía no hay Ans"));
    prueba('calculadora error: raíz de negativo y tan(90°)', () => { lanza(() => cuenta("sqrt(-1)"), "Resultado no válido"); lanza(() => cuenta("tan(90)"), "no existe"); });
    prueba('calculadora error: factorial de negativo o con decimales', () => { lanza(() => cuenta("(-1)!"), "Factorial"); lanza(() => cuenta("2.5!"), "Factorial"); });
    prueba('calculadora error: número con dos puntos y letras sueltas', () => { lanza(() => cuenta("1..2"), "sobra un punto"); lanza(() => cuenta("abc"), "No entiendo"); });

    // ── copia de seguridad ──
    prueba('copia de seguridad: un archivo que no es JSON lanza error', () => lanza(() => leerCopiaSeguridad("{malo"), ""));
    prueba('copia de seguridad: un JSON que no es de TopoVías se rechaza', () => {
      lanza(() => leerCopiaSeguridad('{"app":"Otra","obras":[],"vias":[]}'), "no es una copia"); lanza(() => leerCopiaSeguridad('{"app":"TopoVias","obras":{}}'), "no es una copia"); });
    prueba('copia de seguridad: las vías y obras dañadas se quitan y los números con coma se corrigen', () => {
      const d = leerCopiaSeguridad(JSON.stringify({ app: "TopoVias", obras: [{ id: 1 }, "malo", null], vias: [{ id: 2, ancho: "3,5" }, { sinId: true }, []] }));
      igual(d.obras, [{ id: 1 }]); igual(d.vias, [{ id: 2, ancho: "3.5" }]); });
    prueba('copia de seguridad: crear y leer de vuelta da lo mismo', async () => {
      const c = crearCopiaSeguridad([{ id: 1, nombre: "O" }], [{ id: 2, obraId: 1, nombre: "V" }]), d = leerCopiaSeguridad(await c.blob.text());
      igual(d.obras, [{ id: 1, nombre: "O" }]); igual(d.vias, [{ id: 2, obraId: 1, nombre: "V" }]); verdad(/^TopoVias - Copia \d{4}-\d{2}-\d{2}\.json$/.test(c.nombre), c.nombre); });
    prueba('vía válida: solo objetos con id', () => { igual(viaValida(null), false); igual(viaValida([]), false); igual(viaValida({}), false); igual(viaValida({ id: 0 }), true); });

    // ── textos del usuario que van al SVG y al Excel ──
    prueba('texto en el SVG: se escapan < > & y comillas', () => igual(escXml('<a b="c">&</a>'), "&lt;a b=&quot;c&quot;&gt;&amp;&lt;/a&gt;"));
    prueba('nombre de hoja de Excel: sin caracteres prohibidos, máximo 31, nunca vacío', () => {
      igual(nombreHoja("a/b:c*d?e[f]"), "a-b-c-d-e-f-"); igual(nombreHoja(""), "Via"); igual(nombreHoja("   "), "Via"); igual(nombreHoja("x".repeat(40)).length, 31); });
    prueba('referencia a hoja en una fórmula: el apóstrofo se duplica (no se puede inyectar una fórmula)', () => igual(refHoja("O'Brien"), "'O''Brien'!"));
  });
  await cerrar(b, errs);
})();
