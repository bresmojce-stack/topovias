# Pruebas de TopoVías

Scripts que se usaron para probar cada versión antes de publicar (Playwright + Chromium, Node).
No se ejecutan desde aquí: se copian a una carpeta de trabajo con una carpeta hermana `out/`.

    mkdir -p trabajo/tools trabajo/out && cp pruebas/* trabajo/tools/ && cd trabajo/tools
    node e2e.js /ruta/a/index.html ../out/e2e      # la mayoría: node <prueba>.js <index.html> [salida]
    python3 verifica_hoja.py ../out/archivo.xlsx    # fórmulas del Excel = valores de la app
    bash lo_cmp.sh ../out/archivo.xlsx              # recalcula con LibreOffice y compara cada fórmula

**Todas las principales con un solo comando** (31 pruebas más 3 Excel recalculados en LibreOffice y la comparación de colores con la v69, unos 6 minutos; dice cuáles fallaron). Además de errores, revisa que salgan los números esperados (`ESPERA` en correr.js):

    node correr.js /ruta/a/index.html
    SOLO=cant,deshacer node correr.js /ruta/a/index.html   # solo algunas, por nombre de archivo

`abrir.js` es la ayuda común para abrir una vía como lo hace la persona (Inicio → obra → vía).

`base.js` tiene el arranque que repiten las pruebas (`abrirApp`, `cargarVia`, `leerVias`, `cerrar`; ya lo usan
`dibujoclaro` y `autoacotar`, las demás se pasan de a poco) y `unitarias(p, titulo, casos)`: los casos corren dentro de la
app con `prueba`, `igual`, `cerca`, `lanza` y `verdad`, sin librerías nuevas. Pruebas unitarias (entran en `correr.js`):

    node u_calculo.js /ruta/a/index.html    # r3, tramos (3 de 4 y sus errores), cota en abscisa, abscisado, tabla de cotas
    node u_entrada.js /ruta/a/index.html    # coma decimal, avisos de número, tabla de puntos, azimut y rumbo, calculadora, copia de seguridad
    node u_datos.js /ruta/a/index.html      # guardado diferido (lleno, otra ventana), copia del día, fotos, bloqueadas, Drive, Dibujo

Un caso nuevo va en el archivo de su tema: `prueba('qué se espera', () => igual(funcion(entrada), esperado));`.

Las más usadas: e2e, export, exportx, formulas, excsitio, excsitio2, nivcotas, cabecera, cabecera2, cab4,
sardinel, libro, libro2, bloqueo, compartir, fallos, relcapa, copiarestr, parq, subvia, acum, quiebre, ped,
paso, bitacora, nube, nube2, nubefotos, partir (punto nuevo en planta), exp_partir (Excel con tramos partidos), parqplanta (parqueaderos en planta), exp_parq (Excel con parqueadero en puntos), perfil2 (perfil con tramas; SIN=1 sin excavación en sitio), exp_exc y avisoexc (capa llamada "Excavación"), tnotra (el perfil solo toma como terreno natural una nivelación de ese tipo), perfil3 (nombre largo de nivelación), despl (desplegables). libro_sd (libro con sardinel), cantsd (tabla de cantidades con sardinel), tema (W=390/820/1280, TB=claro|oscuro: capturas y ancho sin desbordar), temas6 (los seis temas y el tema por defecto), cmp_v69 (Claro y Oscuro iguales a la v69), latcoords (coordenadas dentro del desplegable del lateral), plantaagua (agua en la planta real), excel_tema y libro_tema (TEMA=claro|oscuro: el Excel debe salir idéntico; comparar el zip, solo cambia docProps/core.xml), dibtema, recorrido (W, TB y TACTIL=1 para tablet: recorre todas las pantallas, revisa desbordes y que cambiar de tema no toque los datos). pwa y sw_update necesitan servidor: copiar index.html, sw.js, manifest y png a dos carpetas y servirlas con python3 -m http.server 8766 y 8765 (en la de 8765 poner versión 35); correr node sw_update.js <carpeta8765>. Las fotos de prueba (foto0.jpg, foto1.jpg) se generan con PIL
(ver el comienzo de la conversación de la bitácora) o con cualquier jpg grande.
