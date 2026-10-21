// Pruebas unitarias de los datos: guardado diferido (y qué pasa si el almacenamiento falla o hay otra ventana),
// copia del día, fotos compartidas, vías bloqueadas, huella de Drive, preferencias, y piezas del Dibujo
// (distancias al pasar a la vía, áreas, DXF, detección de laterales). Uso: node u_datos.js /ruta/a/index.html
const { abrirApp, cerrar, unitarias } = require('./base');
(async () => {
  const { b, p, errs } = await abrirApp();
  await unitarias(p, 'unitarias datos', () => {
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const K = TV_KEY_OBRAS;   // clave de prueba (en este navegador limpio no hay datos de nadie)

    // ── guardado diferido ──
    prueba('guardar: en memoria al instante y en el disco a los 300 ms', async () => {
      guardarDato(K, [{ id: 1, nombre: "a" }]);
      igual(leerDato(K), [{ id: 1, nombre: "a" }]); igual(localStorage.getItem(K), null, "todavía no en el disco");
      await espera(450); igual(JSON.parse(localStorage.getItem(K)), [{ id: 1, nombre: "a" }]); verdad(+localStorage.getItem(K + "__t") > 0, "lleva la hora"); });
    prueba('guardar: veinte cambios seguidos son una sola escritura, con el último valor', async () => {
      let n = 0; const o = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (k === K) n++; return o.call(this, k, v); };
      try { for (let i = 0; i < 20; i++) guardarDato(K, [{ id: 1, nombre: "t" + i }]); await espera(450); } finally { Storage.prototype.setItem = o; }
      igual(n, 1); igual(JSON.parse(localStorage.getItem(K))[0].nombre, "t19"); });
    prueba('guardar: al ocultar o cerrar la pestaña se escribe de inmediato', () => {
      guardarDato(K, [{ id: 1, nombre: "cierre" }]); window.dispatchEvent(new Event("pagehide"));
      igual(JSON.parse(localStorage.getItem(K))[0].nombre, "cierre"); });
    prueba('guardar: también llega a IndexedDB', async () => {
      guardarDato(K, [{ id: 1, nombre: "idb" }]); vaciarGuardado(); await espera(200);
      verdad(DATOS.idb, "el navegador de prueba no abrió IndexedDB"); igual((await TVDB.get(K))[0].nombre, "idb"); });
    prueba('guardar error: localStorage lleno no rompe la app; con IndexedDB queda anotado que el dato solo está allá', () => {
      const o = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (k === K) throw new DOMException("lleno", "QuotaExceededError"); return o.call(this, k, v); };
      try { guardarDato(K, [{ id: 1, nombre: "grande" }]); vaciarGuardado(); } finally { Storage.prototype.setItem = o; }
      igual(leerDato(K)[0].nombre, "grande", "en memoria sigue");
      verdad(DATOS.idb, "el navegador de prueba no abrió IndexedDB"); igual(localStorage.getItem(K + "__soloIdb"), "1"); igual(localStorage.getItem(K), null, "se quita la copia vieja");
      localStorage.removeItem(K + "__soloIdb"); });
    prueba('guardar: si otra ventana ya guardó, esta no escribe encima (ni lo que tenía esperando)', () => {
      const antes = DATOS.otraVentana, guardado = localStorage.getItem(K);
      try {
        guardarDato(K, [{ id: 1, nombre: "esperando" }]); DATOS.otraVentana = true; vaciarGuardado();
        igual(localStorage.getItem(K), guardado, "lo que esperaba no se escribió");
        guardarDato(K, [{ id: 1, nombre: "nuevo" }]); vaciarGuardado(); igual(localStorage.getItem(K), guardado);
        igual(DATOS.guardado.ok, false, "el encabezado dice que no se pudo guardar");
      } finally { DATOS.otraVentana = antes; } });

    // ── copia automática del día ──
    prueba('copia del día: forzada (como al restaurar) se hace aunque ya hubiera una hoy; no repite si nada cambió', async () => {
      const vias0 = DATOS.valores[TV_KEY], obras0 = DATOS.valores[TV_KEY_OBRAS];
      try {
        DATOS.valores[TV_KEY] = [{ id: 7, nombre: "mañana" }]; DATOS.valores[TV_KEY_OBRAS] = [];
        DATOS.copiaDia = null; copiaAutomatica(); await espera(250); const n1 = (await leerCopiasAutomaticas()).length;
        DATOS.copiaDia = null; copiaAutomatica(); await espera(250); igual((await leerCopiasAutomaticas()).length, n1, "igual que la última: no se repite");
        DATOS.valores[TV_KEY] = [{ id: 7, nombre: "tarde" }]; copiaAutomatica(); await espera(250);
        igual((await leerCopiasAutomaticas()).length, n1, "una vez al día: no se repite sola");
        DATOS.copiaDia = null; copiaAutomatica(); await espera(250);
        const l = await leerCopiasAutomaticas(); igual(l.length, n1 + 1); igual(l[0].vias[0].nombre, "tarde");
      } finally { DATOS.valores[TV_KEY] = vias0; DATOS.valores[TV_KEY_OBRAS] = obras0; } });
    prueba('copia del día: sin vías no se hace copia', async () => {
      const vias0 = DATOS.valores[TV_KEY]; const n0 = (await leerCopiasAutomaticas()).length;
      try { DATOS.valores[TV_KEY] = []; DATOS.copiaDia = null; copiaAutomatica(); await espera(200); igual((await leerCopiasAutomaticas()).length, n0); }
      finally { DATOS.valores[TV_KEY] = vias0; } });

    // ── fotos de la bitácora ──
    prueba('fotos: borrar en una vía la foto que usa otra (una duplicada) no la borra; si nadie más la usa, sí', async () => {
      verdad(DATOS.idb, "el navegador de prueba no abrió IndexedDB");
      const antes = HIST.actual.proyectos;
      try {
        await TVDB.set("foto_fU", new Blob(["x"]));
        HIST.actual.proyectos = [{ id: 1, bitacora: [{ id: 1, fotos: ["fU"] }] }, { id: 2, bitacora: [{ id: 2, fotos: ["fU"] }] }];
        borrarFotos(["fU"], 1); await espera(100); verdad(!!(await TVDB.get("foto_fU")), "la copia la sigue usando");
        HIST.actual.proyectos = [{ id: 1, bitacora: [{ id: 1, fotos: ["fU"] }] }];
        borrarFotos(["fU"], 1); await espera(100); igual(await TVDB.get("foto_fU"), undefined);
      } finally { HIST.actual.proyectos = antes; } });
    prueba('fotos: borrar sin decir la vía (o una lista vacía o null) no rompe', () => { borrarFotos([], 1); borrarFotos(null, 1); borrarFotos(["noexiste"]); });

    // ── vías bloqueadas ──
    const A = { id: 1, bloqueada: true, nombre: "A" }, L = { id: 2, nombre: "Libre" };
    prueba('bloqueada: un cambio en una vía bloqueada se descarta', () => igual(protegerBloqueadas([A, L], [{ ...A, nombre: "B" }, L])[0].nombre, "A"));
    prueba('bloqueada: borrarla la devuelve a su lugar', () => igual(protegerBloqueadas([A, L], [L]).map(v => v.id), [1, 2]));
    prueba('bloqueada: quitar el candado sí pasa (y el semáforo también)', () => {
      igual(protegerBloqueadas([A], [{ id: 1, nombre: "A" }])[0].bloqueada, undefined); igual(protegerBloqueadas([A], [{ ...A, estado: "ok" }])[0].estado, "ok"); });
    prueba('bloqueada: las vías libres se cambian normal; sin bloqueadas devuelve lo mismo', () => {
      const next = [A, { ...L, nombre: "Otra" }]; igual(protegerBloqueadas([A, L], next)[1].nombre, "Otra");
      const n2 = [{ ...L, nombre: "x" }]; verdad(protegerBloqueadas([L], n2) === n2); });

    // ── Drive y preferencias ──
    prueba('huella de Drive: mismo contenido, misma huella; un cambio de un milímetro, otra', () => {
      igual(nubeHuella({ a: [1, 2], b: "x" }), nubeHuella({ a: [1, 2], b: "x" })); verdad(nubeHuella({ c: "100.000" }) !== nubeHuella({ c: "100.001" }));
      verdad(nubeHuella(undefined) === nubeHuella(null)); });
    prueba('preferencias: JSON dañado o ausente da el valor por defecto; el 0 se respeta', () => {
      try {
        localStorage.setItem("tv_prueba", "{malo"); igual(lsLeer("tv_prueba", 7), 7);
        localStorage.removeItem("tv_prueba"); igual(lsLeer("tv_prueba", 7), 7);
        localStorage.setItem("tv_prueba", "null"); igual(lsLeer("tv_prueba", 7), 7);
        localStorage.setItem("tv_prueba", "0"); igual(lsLeer("tv_prueba", 7), 0);
        lsGuardar("tv_prueba", { a: [1] }); igual(lsLeer("tv_prueba", null), { a: [1] });
      } finally { localStorage.removeItem("tv_prueba"); } });
    prueba('preferencias error: si el almacenamiento falla, se sigue sin ellas (sin lanzar error)', () => {
      const g = Storage.prototype.getItem, s = Storage.prototype.setItem;
      Storage.prototype.getItem = () => { throw new Error("bloqueado"); }; Storage.prototype.setItem = () => { throw new Error("bloqueado"); };
      try { igual(lsLeer("tv_x", "def"), "def"); lsGuardar("tv_x", 1); } finally { Storage.prototype.getItem = g; Storage.prototype.setItem = s; } });

    // ── distancias del dibujo a los tramos de la vía ──
    const T = (d, extra) => ({ cotaInicio: "100", cotaFin: "", pendiente: "1", distancia: String(d), ...(extra || {}) });
    prueba('distancias: cambian las de los tramos sin tocar las cotas', () => {
      const r = aplicarDistancias([T(10), T(20)], [12, 18]); igual(r.map(t => t.distancia), ["12", "18"]); igual(r[0].cotaInicio, "100"); });
    prueba('distancias: un tramo de más en el dibujo crea uno nuevo que empieza en la cota fin del anterior', () => {
      const r = aplicarDistancias([T(10)], [10, 5]); igual(r.length, 2); igual(r[1].distancia, "5"); igual(r[1].cotaInicio, "100.1"); });
    prueba('distancias: una distancia null no cambia ese tramo', () => igual(aplicarDistancias([T(10), T(20)], [null, 7]).map(t => t.distancia), ["10", "7"]));
    prueba('distancias por grupo: un tramo partido con punto nuevo conserva su parte y la última toma el resto', () => {
      const r = distanciasPorGrupo([T(10), T(4, { parte: true }), T(20), T(5)], [15, 21]); igual(r.ds, [10, 5, 21]); igual(r.sobran, 1); });
    prueba('distancias por grupo error: si las partes no caben en la distancia del dibujo, avisa y no cambia nada', () => {
      const r = distanciasPorGrupo([T(10), T(4, { parte: true })], [9]); verdad(/no caben/.test(r.error), r.error); igual(r.ds, undefined); });
    prueba('distancias por grupo: vía vacía o dibujo con más tramos que la vía', () => {
      igual(distanciasPorGrupo([], [5, 6]), { ds: [5, 6], sobran: 0 }); igual(distanciasPorGrupo([T(10)], [10, 3]).ds, [10, 3]); });

    // ── geometría y DXF del Dibujo ──
    const cuad = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    prueba('área: igual en los dos sentidos; puntos en línea dan 0; menos de 3 puntos da 0', () => {
      igual(DIB.area(cuad), 100); igual(DIB.area(cuad.slice().reverse()), 100); igual(DIB.area([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }]), 0);
      igual(DIB.area([{ x: 0, y: 0 }, { x: 5, y: 5 }]), 0); igual(DIB.area([]), 0); });
    prueba('distancia y azimut entre dos puntos', () => { igual(DIB.dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5); cerca(DIB.az({ x: 0, y: 0 }, { x: 1, y: 1 }), 45); cerca(DIB.az({ x: 0, y: 0 }, { x: 0, y: -1 }), 180); });
    prueba('DXF de un dibujo vacío es un archivo válido', () => { const d = crearDXF({ objs: [] }); verdad(d.includes("SECTION")); verdad(/EOF\r\n$/.test(d)); });
    prueba('DXF: lo escondido no sale; un texto con salto de línea no rompe el archivo', () => {
      const d = crearDXF({ objs: [{ id: 1, t: "p", x: 1, y: 2, nom: "VISIBLE" }, { id: 2, t: "p", x: 3, y: 4, nom: "ESCONDIDO", oculto: true }, { id: 3, t: "p", x: 5, y: 6, nom: "a\nb" }] });
      verdad(d.includes("VISIBLE")); verdad(!d.includes("ESCONDIDO")); verdad(!/[^\r]\n/.test(d), "un \\n suelto parte los pares del DXF");
      igual(d.split("\r\n").length % 2, 1, "pares código/valor completos"); });
    prueba('DXF: una figura sin área con rayado no llena el archivo de líneas', () =>
      verdad(crearDXF({ objs: [{ id: 1, t: "pl", c: true, som: "rayado", v: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }] }] }).length < 20000));
    prueba('detectar vía: entre bordes que cubren lo mismo gana el más cercano al eje; se reusa la detección', () => {
      const eje = { id: "e", t: "eje", v: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 30 }], abs0: 0 };
      const ofs = d => { const s = (a, c) => { const Lg = Math.hypot(c.x - a.x, c.y - a.y), n = { x: -(c.y - a.y) / Lg, y: (c.x - a.x) / Lg }; return [{ x: a.x + n.x * d, y: a.y + n.y * d }, { x: c.x + n.x * d, y: c.y + n.y * d }]; };
        const s1 = s(eje.v[0], eje.v[1]), s2 = s(eje.v[1], eje.v[2]); return { t: "pl", c: false, id: "l" + d, v: [s1[0], s1[1], s2[0], s2[1]] }; };
      const objs = [eje, ofs(-3.7), ofs(-4), ofs(-4.3), ofs(-5.1)], D = detectarDibujoVia(objs, eje);
      cerca(D.lat.derecho.ancho, 3.7, 0.05); igual(D.lat.izquierdo, null); verdad(detectarDibujoVia(objs, eje) === D, "misma detección");
      verdad(detectarDibujoVia(objs.slice(), eje) !== D, "un dibujo distinto se vuelve a detectar"); });
    prueba('detectar vía: un dibujo con solo el eje no encuentra laterales ni parqueaderos', () => {
      const eje = { id: "e", t: "eje", v: [{ x: 0, y: 0 }, { x: 100, y: 0 }], abs0: 0 }, D = detectarDibujoVia([eje], eje);
      igual(D.lat.derecho, null); igual(D.lat.izquierdo, null); igual(D.parqs.length, 0); });
  });
  await cerrar(b, errs);
})();
