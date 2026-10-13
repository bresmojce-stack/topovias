# TopoVías

Calculadora topográfica de vías, organizada por **obras** y **vías**.

- **Obras → Vías:** cada obra (como una carpeta) tiene sus vías. Cada vía tiene tramos/PI (se llenan 3 de 4 campos; distancias también por coordenadas), estructura, laterales, parqueaderos (con estructura propia si la tienen), nivelaciones, volúmenes por áreas promedio y cantidades.
- **Excel:** de cada vía, o el **libro consolidado de la obra** (una hoja por vía + hoja RESUMEN con fórmulas a cada vía). Los números van como número con 3 decimales. Se guarda en el dispositivo o se comparte (WhatsApp, correo, Drive…).
- **Ningún nombre es fijo:** obras, vías, capas, volúmenes y cantidades se llaman como los escriba el usuario.

## Archivos

- `index.html`: toda la app en un solo archivo (React y SheetJS incluidos).
- `manifest.json`, íconos: para instalarla en el celular, tablet o PC.
- `sw.js`: modo sin conexión. **Al publicar una versión nueva, cambiar `CACHE_VERSION`** para que los equipos la descarguen.

## Datos

Se guardan en el dispositivo (IndexedDB, con copia en localStorage mientras quepa; al abrir se usa la más reciente). La app pide al sistema reservar el espacio. Desde la pantalla de obras: **Copia de seguridad** (archivo .json) y **Restaurar copia** (agrega o actualiza, nunca borra).

Con `?viaId=XXX` en la URL cada instancia guarda su propio estado (integración con ObraTrack).

Para instalarla y usarla sin conexión debe abrirse desde una dirección web (https), no como archivo suelto.
