# Pruebas de TopoVías

Scripts que se usaron para probar cada versión antes de publicar (Playwright + Chromium, Node).
No se ejecutan desde aquí: se copian a una carpeta de trabajo con una carpeta hermana `out/`.

    mkdir -p trabajo/tools trabajo/out && cp pruebas/* trabajo/tools/ && cd trabajo/tools
    node e2e.js /ruta/a/index.html ../out/e2e      # la mayoría: node <prueba>.js <index.html> [salida]
    python3 verifica_hoja.py ../out/archivo.xlsx    # fórmulas del Excel = valores de la app
    bash lo_cmp.sh ../out/archivo.xlsx              # recalcula con LibreOffice y compara cada fórmula

Las más usadas: e2e, export, exportx, formulas, excsitio, excsitio2, nivcotas, cabecera, cabecera2, cab4,
sardinel, libro, libro2, bloqueo, compartir, fallos, relcapa, copiarestr, parq, subvia, acum, quiebre, ped,
paso, bitacora, nube, nube2, nubefotos. Las fotos de prueba (foto0.jpg, foto1.jpg) se generan con PIL
(ver el comienzo de la conversación de la bitácora) o con cualquier jpg grande.
