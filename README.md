# TopoVías

Calculadora topográfica de vías, organizada por **obras** y **vías**.

- **Obras → Vías:** cada obra (como una carpeta) tiene sus vías. Cada vía tiene tramos/PI (se llenan 3 de 4 campos; distancias también por coordenadas), estructura, laterales, parqueaderos (con estructura propia si la tienen), nivelaciones, volúmenes por áreas promedio y cantidades.
- **Gráficos:** perfil longitudinal (rasante roja, terreno natural negro, corte/relleno, fondos de capa) y planta (abscisado cada 10 m, PI con abscisa y cota, sentido del agua, bombeo, punto bajo).
- **Excel:** de cada vía, o el **libro consolidado de la obra** (una hoja por vía + hoja RESUMEN con fórmulas a cada vía). Gráficos arriba de cada hoja; esquema de las hojas de obra (Arial, encabezados gris claro, bordes finos, títulos azul marino, sin cuadrícula). Abscisas sin ceros de relleno (10, 23.45, 23.456); demás números con 3 decimales. Se guarda en el dispositivo o se comparte (WhatsApp, correo, Drive…).
- **Ningún nombre es fijo:** obras, vías, capas, volúmenes y cantidades se llaman como los escriba el usuario.

## Archivos

- `index.html`: toda la app en un solo archivo (React y ExcelJS incluidos, funciona sin internet).
- `manifest.json`, íconos: para instalarla en el celular, tablet o PC.
- `sw.js`: modo sin conexión. **Al publicar una versión nueva, cambiar `CACHE_VERSION`** para que los equipos la descarguen.

## Datos

Se guardan en el dispositivo (IndexedDB, con copia en localStorage mientras quepa; al abrir se usa la más reciente). La app pide al sistema reservar el espacio. Desde la pantalla de obras: **Copia de seguridad** (archivo .json) y **Restaurar copia** (agrega o actualiza, nunca borra).

Con `?viaId=XXX` en la URL cada instancia guarda su propio estado (integración con ObraTrack).

Para instalarla y usarla sin conexión debe abrirse desde una dirección web (https), no como archivo suelto.
