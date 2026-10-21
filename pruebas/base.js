// Arranque común de las pruebas: abrir la app, juntar errores, cargar una vía de prueba y leer lo guardado.
//   const { abrirApp, cargarVia, leerVias, cerrar } = require('./base');
//   const { b, p, errs, movil } = await abrirApp();          // W=390 en el ambiente para celular
//   await cargarVia(p, via);                                  // la deja abierta en una obra "O"; TB=oscuro para el tema
//   const vias = await leerVias(p);                           // lo guardado (escribe antes lo que esté esperando)
//   await cerrar(b, errs);                                    // imprime los errores o "no errors"
const { chromium } = require('/opt/node-tools/node_modules/playwright');

async function abrirApp(archivo = process.argv[2]) {
  const W = +(process.env.W || 1280), movil = W < 600;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: movil ? 844 : 900 }, acceptDownloads: true, hasTouch: true, isMobile: movil });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  p.on('dialog', d => d.accept());
  await p.goto('file://' + archivo); await p.waitForSelector('header.tv-header');
  return { b, ctx, p, errs, movil, W };
}

// Guarda la vía en localStorage con una hora futura (gana a lo de IndexedDB), en la obra 5, y recarga la app abierta en ella
async function cargarVia(p, via, tema = process.env.TB || '') {
  await p.evaluate(([pr, tb]) => { localStorage.clear(); localStorage.setItem('topovias_standalone', JSON.stringify([pr])); localStorage.setItem('topovias_standalone__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_obras', JSON.stringify([{ id: 5, nombre: 'O' }])); localStorage.setItem('topovias_standalone_obras__t', String(Date.now() + 99999));
    localStorage.setItem('topovias_standalone_activo', '1'); if (tb) localStorage.setItem('tv_tema', tb); localStorage.setItem('topovias_standalone_nav', JSON.stringify({ vista: 'via', obraId: 5 })); }, [via, tema]);
  await p.reload(); await p.waitForSelector('header.tv-header');
}

// Las vías guardadas; antes se escribe lo que el guardado diferido (300 ms) tenga esperando
const leerVias = p => p.evaluate(() => (typeof vaciarGuardado === 'function' && vaciarGuardado(), JSON.parse(localStorage.getItem('topovias_standalone'))));

async function cerrar(b, errs) { console.log(errs.join('\n') || 'no errors'); await b.close(); }

// Pruebas unitarias: `casos` corre DENTRO de la app (ve sus funciones: r3, resolverTramo…) con estas ayudas:
//   prueba(nombre, fn)          un caso (fn puede ser async); si lanza un error, el caso falla con ese mensaje
//   igual(real, esperado, msg)  igualdad exacta (compara como JSON: sirve para objetos y listas)
//   cerca(real, esperado, tol)  números con tolerancia (por defecto 1e-9)
//   lanza(fn, texto)            fn debe lanzar un error cuyo mensaje contenga `texto`
//   verdad(cond, msg)
// Imprime cada caso y al final "<titulo>: N pruebas, M fallas"; con fallas el proceso termina con código 1.
async function unitarias(p, titulo, casos) {
  const r = await p.evaluate(`(async () => {
    const R = [], lista = [];
    const texto = v => v === undefined ? "undefined" : (typeof v === "number" && !isFinite(v)) ? String(v) : JSON.stringify(v);
    const igual = (a, b, m) => { if (texto(a) !== texto(b)) throw new Error((m ? m + ": " : "") + "salió " + texto(a) + ", se esperaba " + texto(b)); };
    const cerca = (a, b, tol = 1e-9, m) => { if (typeof a !== "number" || !(Math.abs(a - b) <= tol)) throw new Error((m ? m + ": " : "") + "salió " + texto(a) + ", se esperaba " + b + " ± " + tol); };
    const verdad = (c, m) => { if (!c) throw new Error(m || "no se cumplió"); };
    const lanza = (f, t) => { let e = null; try { f(); } catch (x) { e = x; } if (!e) throw new Error("no lanzó error (se esperaba: " + t + ")"); if (t && !String(e.message).includes(t)) throw new Error("lanzó «" + e.message + "», se esperaba «" + t + "»"); };
    const prueba = (n, f) => lista.push([n, f]);
    (${casos.toString()})();
    for (const [n, f] of lista) { try { await f(); R.push([n, null]); } catch (e) { R.push([n, (e && e.message) || String(e)]); } }
    return R;
  })()`);
  const fallas = r.filter(x => x[1]);
  r.forEach(([n, e]) => console.log((e ? '  ✗ ' : '  ✓ ') + n + (e ? '  →  ' + e : '')));
  console.log(titulo + ': ' + r.length + ' pruebas, ' + fallas.length + ' fallas');
  if (fallas.length) process.exitCode = 1;
  return fallas.length;
}

module.exports = { abrirApp, cargarVia, leerVias, cerrar, unitarias };
