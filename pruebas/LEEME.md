# Pruebas de TopoVías

Scripts que se usaron para probar cada versión antes de publicar (Playwright + Chromium, Node).
No se ejecutan desde aquí: se copian a una carpeta de trabajo con una carpeta hermana `out/`.

    mkdir -p trabajo/tools trabajo/out && cp pruebas/* trabajo/tools/ && cd trabajo/tools
    node e2e.js /ruta/a/index.html ../out/e2e      # la mayoría: node <prueba>.js <index.html> [salida]
    python3 verifica_hoja.py ../out/archivo.xlsx    # fórmulas del Excel = valores de la app
    bash lo_cmp.sh ../out/archivo.xlsx              # recalcula con LibreOffice y compara cada fórmula

Las más usadas: e2e, export, exportx, formulas, excsitio, excsitio2, nivcotas, cabecera, cabecera2, cab4,
sardinel, libro, libro2, bloqueo, compartir, fallos, relcapa, copiarestr, parq, subvia, acum, quiebre, ped,
paso, bitacora, nube, nube2, nubefotos, partir (punto nuevo en planta), exp_partir (Excel con tramos partidos), parqplanta (parqueaderos en planta), exp_parq (Excel con parqueadero en puntos), perfil2 (perfil con tramas; SIN=1 sin excavación en sitio), exp_exc y avisoexc (capa llamada "Excavación"), tnotra (el perfil solo toma como terreno natural una nivelación de ese tipo), perfil3 (nombre largo de nivelación), despl (desplegables). libro_sd (libro con sardinel), cantsd (tabla de cantidades con sardinel), tema (W=390/820/1280, TB=claro|oscuro: capturas y ancho sin desbordar), excel_tema y libro_tema (TEMA=claro|oscuro: el Excel debe salir idéntico; comparar el zip, solo cambia docProps/core.xml), dibtema, recorrido (W y TB: recorre todas las pantallas, revisa desbordes y que cambiar de tema no toque los datos). pwa y sw_update necesitan servidor: copiar index.html, sw.js, manifest y png a dos carpetas y servirlas con python3 -m http.server 8766 y 8765 (en la de 8765 poner versión 35); correr node sw_update.js <carpeta8765>. Viejas que ya fallaban antes: via, extremos2, saparq, cant. Las fotos de prueba (foto0.jpg, foto1.jpg) se generan con PIL
(ver el comienzo de la conversación de la bitácora) o con cualquier jpg grande.
