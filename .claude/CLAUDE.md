# TopoVías — guía para trabajar en el código

App de topografía de vías (Colombia) para Brian Escobar, topógrafo. Un solo archivo: `index.html`
(React 18 sin JSX, `React.createElement`; ExcelJS dentro). PWA publicada en GitHub Pages
(https://bresmojce-stack.github.io/topovias/) al hacer push a `main`. Responder siempre en español.

## Reglas de Brian (obligatorias, 2026-10-17)
- **Prioridad absoluta: conservar la funcionalidad.** En tareas visuales se conserva el comportamiento. No
  reescribir, eliminar, simplificar ni reemplazar funciones de negocio por implementaciones de ejemplo. No
  alterar fórmulas, cálculos, validaciones, eventos, identificadores, nombres de funciones, rutas, formatos de
  datos ni almacenamiento, salvo autorización expresa. Antes de editar, inspeccionar el código y explicar qué
  archivos se cambian.
- **Temas:** Claro, Oscuro, Agua, Fuego, Aire y Tierra, con configuración centralizada y variables CSS
  semánticas (fondos, superficies, campos, bordes, texto, botones, selección, foco, estados). Sin hojas de
  estilo duplicadas por tema. La preferencia se guarda sin tocar los datos; si falla el almacenamiento, la app
  sigue con un tema seguro por defecto.
- **Información técnica:** no recolorear planos, perfiles, capas CAD, series de gráficas, cotas, símbolos,
  resultados ni estados técnicos con significado. Separar colores de interfaz y colores de datos.
- **Accesibilidad:** contraste suficiente; deshabilitados, errores, advertencias, éxitos y selección
  distinguibles en los seis temas; adaptación a celular y tablet; sin dependencias nuevas sin autorización.
- **Flujo obligatorio:** 1 auditar antes de editar; 2 proponer plan con archivos y riesgos; 3 esperar
  aprobación antes de cambios estructurales; 4 cambios pequeños y revisables; 5 revisar el diff de Git;
  6 comprobaciones apropiadas (ver pruebas abajo); 7 informar qué archivos cambiaron, qué se comprobó, qué
  falló y qué queda pendiente.
- **Nunca** comandos destructivos de Git, publicar, commit/push ni eliminar archivos sin autorización
  explícita de Brian en cada caso. No afirmar que una prueba pasó si no se ejecutó y verificó.
- **Pruebas:** mientras se trabaja, solo lo mínimo (sin errores de sintaxis y que la app abra). La batería
  completa (rutina, Excel = app, celular/tablet/PC) se propone y se corre solo si Brian dice que sí, en estos
  momentos: antes de publicar, al terminar una función completa, tras un cambio que toque cálculos, Excel o
  datos guardados, o antes de usar la app en obra o entregar un Excel.

## Forma de trabajar con Brian
- Pasos pequeños. Antes de una función grande, mostrar primero cómo quedaría (boceto).
- Las fórmulas del Excel son indispensables: lo que muestra la app debe ser lo que recalcula el Excel.
- `r3` redondea igual que ROUND de Excel (mitad hacia arriba). Todo valor que va al Excel pasa por `r3`.
- No tocar Netlify ni la cuenta bresmojcej@gmail.com (es de la finca).

## Al publicar (solo cuando Brian lo autorice)
- Subir `TV_VERSION` en index.html y `CACHE_VERSION` en sw.js al mismo número (ej. "45" y "topovias-v45").
- Commit con `git -c user.email=bresmojce@gmail.com -c user.name=bresmojce-stack commit`, push a `main`.
- Revisar el despliegue: `https://api.github.com/repos/bresmojce-stack/topovias/actions/runs?per_page=1`.

## Mapa en red (artefacto)
https://claude.ai/artifact/XNYfBVg1uuBN8sugkcosTy : las 43 piezas, sus 71 conexiones (qué alimenta a qué) y
dónde está cada una en el código. Leerlo (Artifact, action "read") antes de un cambio que cruce varias piezas.
Cuando se agregue o cambie una pieza, actualizar ese artefacto y esta guía juntos.

## Mapa del código (buscar por el comentario de sección; los números de línea cambian)
| Sección (comentario `// ───`) | Qué hay |
|---|---|
| MATEMÁTICA: RESOLVEDOR UNIVERSAL DE TRAMO | `resolverTramo` (3 de 4 campos), `calcCotaEnAbscisa`, `generarAbscisas` (cada `pasoAbscisado(proy)` m, `proy.paso`, 5 por defecto; las abscisas con lecturas de nivelación siempre entran), `formatoAbscisa`; antes de `CamposTramo`: `abscisasTramos` (abscisa acumulada por tramo), `FranjaAbscisa`, `PieAbscisas` (eje, laterales y parqueaderos con rasante propia) |
| PARQUEADERO DE CABECERA | `proyCalc` (convierte cabecera en abscisas/ancho y renombra una capa llamada "Excavación" a `NOMBRE_CAPA_EXC` = "Excavación (capa)" para que no choque con la excavación teórica automática, `esNombreExcavacion`; usarlo al entrar a cualquier cálculo), `rangoVia`, `datosCabecera`, `cubreCab`, `largoVia`. Modo "esquinas" (el nuevo por defecto): `geoEsquinas`, `cotaEsquinas` (bilineal entre A,B,C,D en `__esq`); si cruza el eje, `proyCalc` lo parte en dos (ids `~i`/`~d`, `nombreBase`). Editor: `DiagramaEsquinas`, `CampoLado`, `cotaViaEnBorde` |
| SARDINEL | `piezasSardinel`, `calcSardinel` (total, ejecutado por tramos, sin doble conteo) |
| GENERADOR DE TABLA | `generarTabla`: cotas por abscisa (eje, laterales, parqueaderos, corona del sardinel, capas, excavación); filas `fueraVia` = cabecera. Lateral con rasante propia que nace con la vía: `distEnLateral`/`repartoEjeLat` reparten cada tramo del lateral en su tramo del eje (quiebres: afuera más largo, adentro más corto); `gruposLargos` junta los tramos marcados `parte` (punto nuevo, no es quiebre) |
| ALMACENAMIENTO / COPIAS / PERSISTENCIA | `guardarDato` (IndexedDB + localStorage), `precargarDatos`, `copiaAutomatica`, claves `TV_KEY`, `TV_KEY_OBRAS` |
| OTRA VENTANA | `BroadcastChannel`: si otra ventana guarda, esta deja de guardar (`DATOS.otraVentana`) |
| DESHACER / REHACER | `HIST` (atras/adelante/crudo/oyentes), `histAvisar` |
| VÍAS BLOQUEADAS | `protegerBloqueadas`, `useLocalProyectos`, `useLocalObras`, `viaValida` |
| SINCRONIZAR CON GOOGLE DRIVE | `nubeSincronizar` (un archivo por vía + Obras.json en la carpeta TopoVías; permiso drive.file; ID de cliente en `NUBE_CLIENTE`) |
| CANTIDADES DE LA VÍA | `calcAreas`, `calcCantidades`. Lo que se suma a una capa (volumen con su nombre, relleno de sobre-excavación o de fallo con el material de esa capa) va dentro de la capa con desglose: "X teórica (área × espesor)" + cada extra (`esCapa`/`sumarACapa`; en el Excel `capaX`/`extraCapa`). El sardinel entra como ítem "Sardinel" (ml, total de `calcSardinel`, `esSardinel`); en el Excel su CANTIDAD apunta al TOTAL de la sección SARDINEL (`filaSardinel`) y el RESUMEN del libro lo suma por vía. El Excel de la vía ya no tiene "Resumen de volúmenes"; el RESUMEN del libro de obra sí (consolidado por vía, enlazado a las hojas) |
| GRÁFICOS | `svgPerfil` (aprobado por Brian, boceto C2: cada capa con su trama y color según material en `materialCapa`/`TRAMAS_PERFIL` — asfalto negro, base gris claro con piedra, sub-base gris medio con puntos, roca muerta café claro; reserva en `MAT_RESERVA`; terreno natural verde punteado grueso con hojitas hasta la rasante; excavación teórica café oscuro; en sitio negra punteada gruesa y lo excavado de más rayado; nombres a la derecha en el margen `PR`), `svgPlanta` (texto de usuario siempre con `escXml`); `geoVia` (geometría en planta: real con `coordsEje` o recta; `Q(abs, desplazamiento)`), `svgPlantaReal` dibuja la forma real con quiebres |
| EDITAR EN PLANTA (antes de `GraficosVia`) | `EditorPlanta` (desplegable en Eje y tramos y en Laterales: tocar PI/tramo/borde y editar; mismos datos), `ponerCotaPI`, `abscisaEjeDeLateral`. Punto nuevo dentro de un tramo: `PuntoNuevo` → `partirTramo` (sin cambiar la rasante; la 2.ª parte lleva `parte: true`) y `partirCoords` (coordenadas de los PI); `lateralAPropia` pasa un lateral con diferencia a rasante propia. En Parqueaderos (modo "parq", `onParq`): lateral = polígono desde el borde del lateral, se edita el borde de afuera (modo "independiente": puntos y tramos con punto nuevo; `parqAPuntos` pasa uno con diferencia a puntos con las cotas de hoy); cabecera de 4 esquinas = esquinas tocables (mismo `esq`, "⇩ Cota de la vía" con `cotaViaEnBorde`) |
| INSTALAR / COPIA DE SEGURIDAD | `crearCopiaSeguridad`, `leerCopiaSeguridad`, `BotonNube`, `PanelNube`, `CopiasAutomaticas` |
| TABLA RESULTADO / TABLA DE LECTURAS | `TablaResultado` (tabla de cotas, bloque corona), `CopiarEstructura`, `TabSardinel`, `TablaLecturas` (replanteo) |
| VOLÚMENES / SOBREANCHO / TIPOS DE VOLUMEN | `calcVolumen` (en el borde de una cabecera parte la sección en dos), `parqEn`, `sobreanchoVolumen`, `construirHojaVia` (hoja Excel con fórmulas) |
| EXCEL CON ESTILO | `exportarExcel`, `exportarLibroObra` |
| DIBUJO (mini CAD de obra) | `TabDibujo`, `DIB`, `EJE`, `crearDXF`; herramientas en `DIB_GRUPOS` (Dibujar/Medir/Editar/Ver); "Seleccionar varios" usa `selSet` (tocar o recuadro) y pasa la selección a mover/copiar/girar, borrar, color o unir (`unirObjetos`) |
| CALCULADORAS | `evaluarExpresion`, `CalcNormal`, `CalcCoordenadas`, `Calculadora` |
| EDITOR LATERAL / EDITOR PARQUEADERO | `EditorLateral` (modo transversal o "rasante propia" con PI), `EditorParq` (lateral o cabecera); los dos son `Desplegable` (junto a `Card`): cerrados en una línea con el nombre en color y un resumen, abiertos si les faltan datos |
| FALLOS (antes de "Excel no acepta") | `calcFallo`, `cotaSuperficieEn` (interpola la superficie elegida en abscisa y desplazamiento), `SeccionFallos` (Nivelaciones); suma a "Excavación" con desglose y da "Relleno de fallos — material"; sección FALLO en `construirHojaVia` |
| HELPERS NIVELACIONES / TAB VOLÚMENES | `resolverAI`, `alinearLecturas`, `calcCotasNivelacion`, `exportarCartera`, `TabVolumenes` |
| BITÁCORA (antes de `FalloApp`) | `Bitacora` (anotaciones `proy.bitacora` = {id, fecha, texto, fotos[], creada}; más reciente arriba), fotos achicadas con `achicarFoto` y guardadas aparte en IndexedDB como `foto_<id>` (`guardarFoto`, `urlFoto`, `borrarFotos`), `Miniatura`, `VisorFotos`. En Drive: `nubeFotos` (al sincronizar sube las que falten a TopoVías/Fotos con appProperties.f = id y manda a la papelera las que ya nadie usa) y `nubeTraerFoto` (las baja al mostrarlas en otro equipo) |
| TEMA (antes de `TV_VERSION`) | Seis temas en `TEMAS` (una sola configuración: colores por función, `icono`, `oscuro`): Claro "Plata técnica" (barra de arriba blanca: variables redefinidas solo dentro de `.tv-header`/`.tv-tabs`), Oscuro "Grafito técnico" (bloque fijo `html[data-tema="oscuro"]` del `<style>`, igual que la v69), Agua océano, Fuego volcánico y Tierra jade (oscuros) y Aire dorado (claro). Claro y Oscuro usan el `:root` y ese bloque; los de elemento se generan en `hojaTemas()` (`<style id="tv-temas">`) con `colorOscuroTema`/`colorClaroTema`/`colorBarra`/`esPizarra`, `cTema`, `cBtnTema` y `--c-relleno`. Variables semánticas `--tv-*` en todos. La paleta `C` vale `var(--c-*)`; `C.relleno` = fondo con letra blanca (en Claro/Oscuro es el mismo acento); cada color fijo de la interfaz es `var(--tHEX)`/`var(--bHEX)`/`var(--lHEX)` (HEX = color en claro; `pruebas/gen_vars_tema.py` regenera el bloque `:root` y el del oscuro si se agregan colores). `Btn` usa `--c-btn-*`. Los de elemento: tarjetas con `--tv-borde-tarjeta` y `--tv-brillo`, foco visible. `leerTema` (sin elección: la del sistema; valor inválido o sin almacenamiento → Claro), `ponerTema` (localStorage `tv_tema`, `data-tema`, evento `tv-tema`); `SelectorTema` (inicio, con símbolo) y `BotonTema` (barra, recorre los seis). No usan variables (iguales en todos): gráficas SVG, editor en planta (fondo blanco), Excel, DXF y colores de datos. Dibujo oscuro tipo AutoCAD en los temas `oscuro: true` (`DIB_OSCURO`/`cd()`) |
| APP | `App` (pestañas en `TABS`, `upd` recalcula, `updSinRecalcular` no), `FalloApp` (pantalla de rescate). Pestañas: Vía, Cotas y lecturas, Nivelaciones, Cantidades, Dibujo, Calculadora, Bitácora (id "memoria"). Apartados por pestaña en `APARTADOS` (`BarraApartados`, estado `sub`, `enVia`/`enApartado`): Vía = Estructura, Eje y tramos, Laterales, Parqueaderos, Sardinel, Plano; Cotas = tabla de cotas, lecturas de replanteo; Cantidades = volúmenes, cantidades. Iconos a color en `ICONOS_VIA` (`IconoVia`) |

## Estado (versión 71) y lo que sigue
- Versión 71: textos grises de la barra legibles en Aire (tema claro con barra de color, regla en `hojaTemas`); "Distancias por coordenadas" de cada lateral dentro de su desplegable (`EditorLateral` prop `extra`); la planta con forma real (`svgPlantaReal`) dibuja el agua como la recta (a lo largo por tramo, bombeo, parqueaderos, punto bajo), también en la imagen del Excel.
- Versión 70: seis temas del entorno (Claro con barra blanca, Oscuro igual, Agua océano, Fuego, Aire, Tierra) según el boceto aprobado; Claro/Oscuro con colores idénticos a la v69 y Excel idéntico en los seis temas. Respaldo de la v69 en la rama `respaldo-v69`.
- Hecho y publicado: temas claro (Plata técnica) y oscuro (Grafito técnico) con variables, botón en la barra y en el inicio, dibujo oscuro tipo AutoCAD; sardinel (total en ml) en Cantidades, en el Excel y en el RESUMEN del libro; laterales y parqueaderos desplegables; en el perfil, el nombre que tiene cada nivelación; perfil con tramas y colores por material (C2); editor en planta completo (eje, laterales y parqueaderos; punto nuevo dentro de un tramo; "Pasar a rasante propia" / "Pasar a puntos"; esquinas de cabecera); pestañas con iconos y apartados; editor en planta (eje y laterales); parqueaderos de
  cabecera con 4 esquinas; laterales repartidos en quiebres; abscisado por vía (5/10/20/otro); abscisa
  acumulada por tramo; bitácora con fotos (y fotos en Drive); fallos; sardinel; rellenos que se suman a su
  capa con desglose; Excel sin "Resumen de volúmenes" (el libro de obra conserva su RESUMEN consolidado).
- Pendiente posible (Brian dijo "si algún día"): puntos intermedios en el fondo de una cabecera.
- Ideas mostradas en boceto, sin aprobar: modo sol (alto contraste), modo campo para replanteo, tablero de
  la vía, un color por material. Play Store: Brian dijo "aún no".
- Antes de cada publicación (con el visto bueno de Brian para correrlas): probar con Playwright (Chromium en /opt/pw-browsers) cotas, Excel (fórmulas
  recalculadas = valores de la app), volúmenes, Drive simulado y celular 390 px. Los scripts están en
  `pruebas/` (ver `pruebas/LEEME.md`); copiarlos al scratchpad para correrlos.
- Brian revisa todo en el Excel: valores, carteras y fórmulas deben quedar enlazados.

## Auditoría con /ponytail-audit (a Brian le ha servido)
Recordarle a Brian si quiere correr `/ponytail-audit` cuando pasen **1 semana o 5 versiones** desde la
última (lo que llegue primero), en una línea al final de la respuesta, sin correrla sin su permiso. Primero
se le muestran los hallazgos y él decide qué se arregla. Al hacerla, actualizar aquí la fecha.
- Última auditoría: 2026-10-17 1 p. m. (versión 69). Abiertos, Brian decide: 1 deshacer tras borrar
  anotación pierde sus fotos; 2 la copia de seguridad no lleva las fotos; 3 cinco pruebas desactualizadas
  (cant, via, extremos2, saparq, deshacer: fallan por la navegación, no por la app; deshacer sí funciona);
  4 sin un solo comando para las pruebas; 5 `color-mix` en `Tag` y botones de acción de obra no se ve en
  navegadores anteriores a 2023. Antes (versión 61) se arreglaron: capa "Excavación", `memoria`, encabezados.

## Pendientes conocidos (auditoría, Brian decidió dejarlos por ahora)
Estación sin V+ usa la AI de la anterior (Brian lo quiere así: si necesita otra estación la crea); tramo
intermedio incompleto inventa cotas; texto suelto en un tramo da NaN; parqueaderos que se montan o con
inicio > fin; sobreancho a lo largo en extremos de parqueaderos; nombres de hoja con ' o "History";
choque de vía en dos equipos sin guardar las dos; obras se juntan todo o nada. La cota del PI con
pendiente redondeada (1 mm) se deja así a propósito.
