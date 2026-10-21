// Pruebas unitarias del cálculo: redondeo (r3 = ROUND de Excel), tramos (3 de 4 campos), cota en una abscisa,
// abscisado, formato de abscisa y la tabla de cotas de una vía pequeña. Uso: node u_calculo.js /ruta/a/index.html
const { abrirApp, cerrar, unitarias } = require('./base');
(async () => {
  const { b, p, errs } = await abrirApp();
  await unitarias(p, 'unitarias cálculo', () => {
    // ── r3: redondeo a 3 decimales, mitad hacia arriba (lejos del cero), igual que ROUND de Excel ──
    prueba('r3: la mitad sube (1.0005 → 1.001), aunque en binario sea 1.000499…', () => igual(r3(1.0005), 1.001));
    prueba('r3: con negativos la mitad se aleja del cero (−1.0005 → −1.001), como Excel', () => igual(r3(-1.0005), -1.001));
    prueba('r3: menos de la mitad baja', () => { igual(r3(1.2344999), 1.234); igual(r3(2.675), 2.675); });
    prueba('r3: cero y casi cero', () => { igual(r3(0), 0); igual(r3(-0.0004), 0); igual(r3(0.0005), 0.001); });
    prueba('r3: NaN e infinito pasan sin cambiar (no se inventa un número)', () => { verdad(isNaN(r3(NaN))); igual(r3(Infinity), Infinity); });
    prueba('r3: números grandes de coordenadas', () => igual(r3(1052345.12549), 1052345.125));

    // ── resolverTramo: con 3 de los 4 campos sale el cuarto ──
    const T = (ci, cf, pe, di, extra) => ({ cotaInicio: ci, cotaFin: cf, pendiente: pe, distancia: di, ...(extra || {}) });
    prueba('tramo: falta la cota fin', () => { const r = resolverTramo(T("100", "", "2", "50")); igual(r.cotaFin, 101); igual(r.faltante, "cotaFin"); igual(r.completo, true); });
    prueba('tramo: falta la cota inicio', () => { const r = resolverTramo(T("", "101", "2", "50")); igual(r.cotaInicio, 100); igual(r.completo, true); });
    prueba('tramo: falta la pendiente (bajando)', () => igual(resolverTramo(T("100", "99", "", "50")).pendiente, -2));
    prueba('tramo: falta la distancia', () => igual(resolverTramo(T("100", "101", "2", "")).distancia, 50));
    prueba('tramo: distancia 0 con cotas iguales da pendiente 0', () => { const r = resolverTramo(T("100", "100", "", "0")); igual(r.pendiente, 0); igual(r.completo, true); });
    prueba('tramo error: distancia 0 con cotas distintas no da pendiente infinita', () => {
      const r = resolverTramo(T("100", "101", "", "0")); igual(r.pendiente, null); igual(r.completo, false); verdad(/infinita/.test(r.error), r.error); });
    prueba('tramo error: pendiente 0 con cotas distintas no da distancia', () => {
      const r = resolverTramo(T("100", "101", "0", "")); igual(r.distancia, null); igual(r.completo, false); verdad(/no se puede calcular/.test(r.error), r.error); });
    prueba('tramo error: el signo de la pendiente no coincide con las cotas (distancia negativa)', () => {
      const r = resolverTramo(T("100", "99", "2", "")); igual(r.distancia, null); igual(r.completo, false); verdad(/signo/.test(r.error), r.error); });
    prueba('tramo: con solo 2 campos queda incompleto, sin inventar nada', () => {
      const r = resolverTramo(T("100", "", "", "50")); igual(r.completo, false); igual(r.faltante, null); igual(r.cotaFin, null); });
    prueba('tramo: campos vacíos, null o undefined cuentan como vacíos', () => igual(resolverTramo(T(null, undefined, "", "")).completo, false));
    prueba('tramo: texto que no es número no deja el tramo "completo" con NaN', () => {
      const r = resolverTramo(T("100", "101", "2", "abc")); igual(r.completo, false); });
    prueba('tramo: los 4 campos llenos y que no cuadran se marcan inconsistentes (se respeta la pendiente escrita)', () => {
      const r = resolverTramo(T("100", "101", "5", "50")); igual(r.inconsistente, true); igual(r.pendienteImplicita, 2); igual(r.pendiente, 5); });
    prueba('tramo: los 4 campos que sí cuadran no se marcan', () => igual(resolverTramo(T("100", "101", "2", "50")).inconsistente, undefined));
    prueba('tramo: conserva la marca de punto nuevo (parte)', () => igual(resolverTramo(T("100", "", "2", "50", { parte: true })).parte, true));

    // ── calcCotaEnAbscisa: cota de la rasante en cualquier abscisa ──
    const rs = resolverTodos([T("100", "", "2", "50"), T("101", "", "-2", "50")]);
    prueba('cota en abscisa: inicio, mitad de tramo, PI y fin', () => {
      igual(calcCotaEnAbscisa(rs, 0, 0), 100); igual(calcCotaEnAbscisa(rs, 0, 25), 100.5); igual(calcCotaEnAbscisa(rs, 0, 50), 101);
      igual(calcCotaEnAbscisa(rs, 0, 75), 100.5); igual(calcCotaEnAbscisa(rs, 0, 100), 100); });
    prueba('cota en abscisa: con abscisa inicial distinta de 0', () => igual(calcCotaEnAbscisa(rs, 1000, 1025), 100.5));
    prueba('cota en abscisa: después del fin da la cota final (no sigue la pendiente)', () => igual(calcCotaEnAbscisa(rs, 0, 120), 100));
    prueba('cota en abscisa: sin tramos completos da null', () => igual(calcCotaEnAbscisa(resolverTodos([T("100", "", "", "50")]), 0, 10), null));
    prueba('cota en abscisa: lista vacía da null', () => igual(calcCotaEnAbscisa([], 0, 10), null));

    // ── generarAbscisas: inicio, cada paso, PI, fin, intermedias y bordes de parqueadero ──
    prueba('abscisas: cada 5 m de 0 a 100', () => { const a = generarAbscisas("0", rs, [], [], 5); igual(a.length, 21); igual(a[0], 0); igual(a[20], 100); igual(a[1], 5); });
    prueba('abscisas: inicio no redondo sigue en abscisas redondas, y el fin entra', () =>
      igual(generarAbscisas("2.3", resolverTodos([T("100", "", "1", "20")]), [], [], 5), [2.3, 5, 10, 15, 20, 22.3]));
    prueba('abscisas: cada 10 m y una intermedia; el texto que no es número se ignora', () =>
      igual(generarAbscisas("0", resolverTodos([T("100", "", "1", "20")]), ["12.5", "x"], [], 10), [0, 10, 12.5, 20]));
    prueba('abscisas: un paso menor de 0.5 m (o vacío) vuelve a 5 m', () => {
      igual(generarAbscisas("0", resolverTodos([T("100", "", "1", "10")]), [], [], 0.2), [0, 5, 10]);
      igual(generarAbscisas("0", resolverTodos([T("100", "", "1", "10")]), [], [], undefined), [0, 5, 10]); });
    prueba('abscisas: entran el inicio y el fin de un parqueadero; uno sin abscisas no rompe nada', () =>
      igual(generarAbscisas("0", resolverTodos([T("100", "", "1", "20")]), [], [{ absInicio: "3", absFin: "7" }, { absInicio: "", absFin: "" }], 5), [0, 3, 5, 7, 10, 15, 20]));
    prueba('abscisas: sin tramos queda solo el inicio', () => igual(generarAbscisas("0", [], [], [], 5), [0]));
    prueba('paso de abscisado de la vía', () => {
      igual(pasoAbscisado({ paso: "10" }), 10); igual(pasoAbscisado({ paso: "0.2" }), 5); igual(pasoAbscisado({ paso: "abc" }), 5); igual(pasoAbscisado({}), 5); igual(pasoAbscisado(null), 5); });

    // ── formato y lectura de abscisas (K+MMM.mmm) ──
    prueba('formato de abscisa', () => {
      igual(formatoAbscisa(0), "0+000.000"); igual(formatoAbscisa(1025.5), "1+025.500"); igual(formatoAbscisa(-5), "-0+005.000");
      igual(formatoAbscisa(999.9996), "1+000.000", "el redondeo pasa al kilómetro siguiente"); igual(formatoAbscisa(-0.0001), "0+000.000", "sin signo en cero"); });
    prueba('leer abscisa escrita de varias formas', () => {
      igual(leerAbscisa("1+025.5"), 1025.5); igual(leerAbscisa("K1+025,5"), 1025.5); igual(leerAbscisa("-0+005"), -5);
      igual(leerAbscisa(" 2 + 010 "), 2010); igual(leerAbscisa("25.3"), 25.3); });
    prueba('leer abscisa: vacío o texto da null', () => { igual(leerAbscisa(""), null); igual(leerAbscisa("abc"), null); igual(leerAbscisa(null), null); });
    prueba('formato y lectura de abscisa van y vuelven', () => [0, 12.345, 1025.5, 20999.999].forEach(a => igual(leerAbscisa(formatoAbscisa(a)), a)));

    // ── generarTabla: la tabla de cotas de una vía pequeña ──
    const via = { ...proyVacio(), tramos: [T("100", "", "2", "20")], capas: [{ nombre: "Base", espesor: "0.2", id: 2 }],
      lateralIzq: { ...latVacio(), ancho: "3", diferencia: "-0.06" }, lateralDer: { ...latVacio(), ancho: "3", diferencia: "-0.06" } };
    prueba('tabla de cotas: abscisas, eje y laterales', () => {
      const t = generarTabla(via);
      igual(t.map(f => f.abs), [0, 5, 10, 15, 20]); igual(t[0].cotaEje, 100); igual(t[4].cotaEje, 100.4);
      igual(t[2].cotaLatDer, 100.14); igual(t[2].cotaLatIzq, 100.14); igual(t[0].esPI, true); });
    prueba('tabla de cotas: la excavación teórica queda bajo todas las capas', () => {
      const f = generarTabla(via)[0], exc = f.capas.find(c => c.esExcavacion); igual(exc.eje, 99.8); igual(exc.der, 99.74); });
    prueba('tabla de cotas: una vía vacía da una tabla vacía, sin error', () => igual(generarTabla({ ...proyVacio() }), []));
    prueba('tabla de cotas: todos los valores ya vienen redondeados a 3 decimales', () =>
      generarTabla({ ...via, tramos: [T("100", "", "1.3333", "7")] }).forEach(f => igual(r3(f.cotaEje), f.cotaEje)));
  });
  await cerrar(b, errs);
})();
