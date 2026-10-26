# Manual de reglas (Brian, 2026-10-26)

Vale para todas las apps y todo lo que se haga con Brian (Mini Civil, TopoVías, Finca El Retiro y lo que venga). Manda
sobre cualquier otra guía si chocan.

1. **Inspector externo.** Cada 5 publicaciones de cada app, o antes si Brian lo pide, se llama al agente `inspector`
   (`.claude/agents/inspector.md`). Revisa sin conocer la app: no lee las guías, el historial ni las conversaciones, solo el
   código y lo que la app hace. No cambia nada. Brian decide qué se arregla. Cuando toque, recordárselo en una línea.
2. **`/ponytail-audit` cada 7 publicaciones** de cada app (o cuando Brian lo pida). Se muestran los hallazgos y Brian decide.
3. **Pruebas, las justas.** Mientras se trabaja: sintaxis, que la app abra y solo la prueba de lo que se cambió. La batería
   completa, **una sola vez**, justo antes de publicar; si después hay un cambio pequeño, solo las pruebas de eso. No correr
   la batería antes de escribir, a mitad ni después de publicar. La prueba que vale es la de Brian en terreno: decirle qué
   revisar.
4. **Investigar antes de construir.** Antes de una función nueva o de arreglar algo de fondo (rendimiento, memoria, lectura
   de archivos, cálculos), ver cómo lo resuelven las apps líderes (AutoCAD, Civil 3D, Onshape, visores CAD…) y proponer de
   una vez la solución completa, no parches por versiones. Si se elige algo más simple, decir por qué. Si un arreglo falla dos
   veces, parar e investigar la causa de fondo.
5. **Respuestas cortas.** Qué se hizo, qué falta y qué se necesita de Brian, en pocas líneas. El detalle técnico solo si
   lo pide.

Contadores (actualizar al publicar):
- Mini Civil: última inspección — ninguna (desde v60); último ponytail-audit — v50.
- TopoVías: última inspección — ninguna (desde v94); último ponytail-audit — v90.
- Finca El Retiro: última inspección — ninguna (desde v12.7); último ponytail-audit — ninguno registrado.
