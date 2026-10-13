# TopoVías

Calculadora topográfica de vías: rasante por tramos (llenando 3 de 4 campos), laterales, parqueaderos, capas de estructura, nivelaciones de campo, volúmenes por áreas promedio y memoria de cálculo en Excel.

- `index.html`: toda la app en un solo archivo (React y SheetJS incluidos, funciona sin internet).
- Los datos se guardan en el navegador (localStorage). Con `?viaId=XXX` en la URL cada vía guarda su propio estado (integración con ObraTrack).
