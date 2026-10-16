# TopoVías — guía para trabajar en el código

App de topografía de vías (Colombia) para Brian Escobar, topógrafo. Un solo archivo: `index.html`
(React 18 sin JSX, `React.createElement`; ExcelJS dentro). PWA publicada en GitHub Pages
(https://bresmojce-stack.github.io/topovias/) al hacer push a `main`. Responder siempre en español.

## Forma de trabajar con Brian
- Pasos pequeños: probar, commit y push. Antes de una función grande, mostrar primero cómo quedaría (boceto).
- Las fórmulas del Excel son indispensables: lo que muestra la app debe ser lo que recalcula el Excel.
- `r3` redondea igual que ROUND de Excel (mitad hacia arriba). Todo valor que va al Excel pasa por `r3`.
- No tocar Netlify ni la cuenta bresmojcej@gmail.com (es de la finca).

## Al publicar
- Subir `TV_VERSION` en index.html y `CACHE_VERSION` en sw.js al mismo número (ej. "45" y "topovias-v45").
- Commit con `git -c user.email=bresmojce@gmail.com -c user.name=bresmojce-stack commit`, push a `main`.
- Revisar el despliegue: `https://api.github.com/repos/bresmojce-stack/topovias/actions/runs?per_page=1`.

## Mapa en red (artefacto)
https://claude.ai/artifact/XNYfBVg1uuBN8sugkcosTy : las 42 piezas, sus 65 conexiones (qué alimenta a qué) y
dónde está cada una en el código. Leerlo (Artifact, action "read") antes de un cambio que cruce varias piezas.
Cuando se agregue o cambie una pieza, actualizar ese artefacto y esta guía juntos.

## Mapa del código (buscar por el comentario de sección; los números de línea cambian)
| Sección (comentario `// ───`) | Qué hay |
|---|---|
| MATEMÁTICA: RESOLVEDOR UNIVERSAL DE TRAMO | `resolverTramo` (3 de 4 campos), `calcCotaEnAbscisa`, `generarAbscisas`, `formatoAbscisa`; antes de `CamposTramo`: `abscisasTramos` (abscisa acumulada por tramo), `FranjaAbscisa`, `PieAbscisas` (eje, laterales y parqueaderos con rasante propia) |
| PARQUEADERO DE CABECERA | `proyCalc` (convierte cabecera en abscisas/ancho; usarlo al entrar a cualquier cálculo), `rangoVia`, `datosCabecera`, `cubreCab`, `largoVia`. Modo "esquinas" (el nuevo por defecto): `geoEsquinas`, `cotaEsquinas` (bilineal entre A,B,C,D en `__esq`); si cruza el eje, `proyCalc` lo parte en dos (ids `~i`/`~d`, `nombreBase`). Editor: `DiagramaEsquinas`, `CampoLado`, `cotaViaEnBorde` |
| SARDINEL | `piezasSardinel`, `calcSardinel` (total, ejecutado por tramos, sin doble conteo) |
| GENERADOR DE TABLA | `generarTabla`: cotas por abscisa (eje, laterales, parqueaderos, corona del sardinel, capas, excavación); filas `fueraVia` = cabecera. Lateral con rasante propia que nace con la vía: `distEnLateral`/`largosTramos` reparten cada tramo del lateral en su tramo del eje (quiebres: afuera más largo, adentro más corto) |
| ALMACENAMIENTO / COPIAS / PERSISTENCIA | `guardarDato` (IndexedDB + localStorage), `precargarDatos`, `copiaAutomatica`, claves `TV_KEY`, `TV_KEY_OBRAS` |
| OTRA VENTANA | `BroadcastChannel`: si otra ventana guarda, esta deja de guardar (`DATOS.otraVentana`) |
| DESHACER / REHACER | `HIST` (atras/adelante/crudo/oyentes), `histAvisar` |
| VÍAS BLOQUEADAS | `protegerBloqueadas`, `useLocalProyectos`, `useLocalObras`, `viaValida` |
| SINCRONIZAR CON GOOGLE DRIVE | `nubeSincronizar` (un archivo por vía + Obras.json en la carpeta TopoVías; permiso drive.file; ID de cliente en `NUBE_CLIENTE`) |
| CANTIDADES DE LA VÍA | `calcAreas`, `calcCantidades` |
| GRÁFICOS | `svgPerfil`, `svgPlanta` (texto de usuario siempre con `escXml`); `svgPlantaReal` dibuja la forma real con quiebres si hay coordenadas de los PI del eje (`coordsEje`) |
| INSTALAR / COPIA DE SEGURIDAD | `crearCopiaSeguridad`, `leerCopiaSeguridad`, `BotonNube`, `PanelNube`, `CopiasAutomaticas` |
| TABLA RESULTADO / TABLA DE LECTURAS | `TablaResultado` (tabla de cotas, bloque corona), `CopiarEstructura`, `TabSardinel`, `TablaLecturas` (replanteo) |
| VOLÚMENES / SOBREANCHO / TIPOS DE VOLUMEN | `calcVolumen` (en el borde de una cabecera parte la sección en dos), `parqEn`, `sobreanchoVolumen`, `construirHojaVia` (hoja Excel con fórmulas) |
| EXCEL CON ESTILO | `exportarExcel`, `exportarLibroObra` |
| DIBUJO (mini CAD de obra) | `TabDibujo`, `DIB`, `EJE`, `crearDXF`; herramientas en `DIB_GRUPOS` (Dibujar/Medir/Editar/Ver); "Seleccionar varios" usa `selSet` (tocar o recuadro) y pasa la selección a mover/copiar/girar, borrar, color o unir (`unirObjetos`) |
| CALCULADORAS | `evaluarExpresion`, `CalcNormal`, `CalcCoordenadas`, `Calculadora` |
| EDITOR LATERAL / EDITOR PARQUEADERO | `EditorLateral` (modo transversal o "rasante propia" con PI), `EditorParq` (lateral o cabecera) |
| FALLOS (antes de "Excel no acepta") | `calcFallo`, `cotaSuperficieEn` (interpola la superficie elegida en abscisa y desplazamiento), `SeccionFallos` (Nivelaciones); suma a "Excavación" con desglose y da "Relleno de fallos — material"; sección FALLO en `construirHojaVia` |
| HELPERS NIVELACIONES / TAB VOLÚMENES | `resolverAI`, `alinearLecturas`, `calcCotasNivelacion`, `exportarCartera`, `TabVolumenes` |
| APP | `App` (pestañas en `TABS`, `upd` recalcula, `updSinRecalcular` no), `FalloApp` (pantalla de rescate). Pestañas: Vía, Cotas y lecturas, Nivelaciones, Cantidades, Dibujo, Calculadora, Memoria. Apartados por pestaña en `APARTADOS` (`BarraApartados`, estado `sub`, `enVia`/`enApartado`): Vía = Estructura, Eje y tramos, Laterales, Parqueaderos, Sardinel, Plano; Cotas = tabla de cotas, lecturas de replanteo; Cantidades = volúmenes, cantidades. Iconos a color en `ICONOS_VIA` (`IconoVia`) |

## Pendientes conocidos (auditoría, Brian decidió dejarlos por ahora)
Estación sin V+ usa la AI de la anterior (Brian lo quiere así: si necesita otra estación la crea); tramo
intermedio incompleto inventa cotas; texto suelto en un tramo da NaN; parqueaderos que se montan o con
inicio > fin; sobreancho a lo largo en extremos de parqueaderos; nombres de hoja con ' o "History";
choque de vía en dos equipos sin guardar las dos; obras se juntan todo o nada. La cota del PI con
pendiente redondeada (1 mm) se deja así a propósito.
