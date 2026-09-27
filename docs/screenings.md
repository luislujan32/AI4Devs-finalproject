# Autoría y publicación — T-03

[README](../readme.md) · [Contrato P-01 a P-08](producto.md) · [Acceso y demo](acceso.md).

Crear/abrir, guardar un borrador, configurar preguntas manuales, publicar y copiar un publicado están implementados y verificados localmente. El banco se consulta desde MongoDB y permite copia aislada. Las quince preguntas iniciales están en [revisión de Luis](banco-revision.md); no se cargaron ni se afirma T-03 cerrado. No hay todavía invitaciones, cuestionario de candidato, evaluación de respuestas ni informes.

## Recorrido

Entrar con cuenta ficticia, elegir «Crear screening» y completar título, área, descripción opcional y umbral. El área admite texto propio; las tres áreas iniciales del banco son sugerencias. No se fija un umbral universal. Un campo numérico vacío permanece ausente; cero es un valor explícito válido para puntajes/umbral.

Agregar preguntas de sí/no, opción única (dos a ocho opciones) o texto libre. La obligatoriedad exige interacción del candidato; el excluyente define opciones aceptadas para ese requisito del puesto. Son decisiones distintas. Configurar valores enteros 0–100 y peso 1–5 cuando puntúa. Texto libre aporta evidencia, sin puntaje ni exclusión automática. «No puedo confirmarlo» es una respuesta desconocida reservada para el recorrido posterior del candidato; no se agrega como opción puntuable.

Guardar permite un borrador incompleto, con validación de tipos/límites/identificadores. Las opciones presentes deben tener etiquetas; una pregunta puede aún carecer de texto, criterio, valores o peso. Cambiar de tipo reinicia sus reglas/opciones; desactivar puntuación limpia valores y peso. La UI comunica cambios sin guardar y solicita confirmación antes de descartarlos al navegar, recargar o cerrar sesión. El navegador también recibe aviso ante salida/recarga con cambios.

Guardar antes de publicar. Marcar la confirmación de preguntas, evaluación y umbral; el servidor valida las reglas independientemente del checkbox/UI. Una configuración inválida permanece en borrador y explica los problemas. Publicación congela metadata y configuración, registra fecha y aumenta revisión en una sola escritura condicionada. La pantalla publicada es de lectura; «Crear copia como borrador» conserva contenido/reglas, crea ids nuevos, remapea opciones aceptadas y no copia invitaciones ni fecha publicada. El recruiter vuelve a revisar la copia antes de publicar.

La navegación usa un fragmento #screening=id, para recuperar desde API el screening al recargar. No guarda configuración, contraseña o token en almacenamiento persistente del navegador. Listado: hasta cien entradas propias; paginación pendiente.

## Rutas y frontera de escritura

Todas llevan /api y guard de recruiter T-02. Mutaciones requieren Origin permitido y X-CSRF-Token de sesión. Id ajeno/inexistente/inválido → mismo 404; estado publicado o revisión desactualizada → 409; input/configuración/confirmación inválida → 422.

| Ruta | Input y resultado |
| --- | --- |
| POST /screenings | Metadata/preguntas opcionales; propietario derivado de sesión; 201 con documento propio, draft/revision=0 |
| GET /screenings y GET /screenings/:id | Listado y detalle propios, sin ownerId como input/resultado |
| PUT /screenings/:id | Reemplazo completo de metadata/configuración, con expectedRevision; campos omitidos se limpian; devuelve documento actualizado |
| POST /screenings/:id/publish | expectedRevision y confirmConfiguration=true; devuelve solo id/status/revision/publishedAt, conforme al recibo OpenAPI |
| POST /screenings/:id/copy | Body vacío; publicado propio → 201 con nuevo borrador |
| GET /question-bank?area=... | Catálogo activo, filtro exacto por área opcional, hasta cien entradas |
| POST /screenings/:id/questions/from-bank | expectedRevision y bankQuestionId; copia a borrador propio con ids nuevos y sin reglas preaprobadas |

El guardado valida datos sin coerción antes del schema. No permite owner/status/fechas/revisión arbitraria ni inventar procedencia del banco. Escrituras sobre borrador filtran simultáneamente id, ownerId, status=draft y revisión; incrementan la revisión junto al contenido. Publicación y copia del banco usan la misma frontera. No hay fallback que sobrescriba un conflicto.

Ante 409, la UI conserva la edición local y pide recargar la versión persistida; descartar requiere una acción explícita. Estos controles aplican a rutas del producto: no son una restricción que impida a un administrador de MongoDB modificar documentos directamente.

## Banco pendiente de revisión

`data/question-bank.pending.json` contiene quince propuestas, cinco por área, con metadata de revisión pending. [banco-revision.md](banco-revision.md) permite leerlas. P-06 exige revisión del autor antes de cargarlas; el silencio no se considera aprobación. La edición manual funciona con el banco vacío.

El comando futuro, una vez registrada aprobación humana, es:

```bash
npm run catalog -- --database screeningroom_demo_local --file data/question-bank.pending.json
```

Usar el mismo nombre de BD que MONGODB_URI/demo. El loader requiere review.status=approved, autor/fecha de revisión, quince entradas válidas y cinco por área; rechaza destinos fuera de screeningroom_demo_* y revisión pendiente. El archivo aún está pending: este comando falla sin escribir hasta registrar la revisión. La aplicación no carga catálogo automáticamente al arrancar.

Preflight compara contenido de todos los ids antes de insertar. El loader inserta solo ausentes, conserva registros ajenos y no reemplaza entradas editadas. No promete atomicidad de quince documentos: un fallo de infraestructura intermedio puede requerir repetir para completar entradas faltantes. Copiar del banco conserva texto, tipo, opciones y orientación; obligatoriedad false, scored false, sin peso/excluyente/puntajes. Editar la copia nunca edita el catálogo. La UI exige guardar cambios propios antes de incorporar una entrada.

## Evidencia del 27/09/2026

`npm run check`, catorce pruebas HTTP/MongoDB de screenings/catálogo, trece de acceso, catorce de persistencia y smoke pasaron. Pruebas aisladas: input estricto, ausencia distinta de cero, ownership/CSRF en todas las mutaciones, negativos de publicación, confirmación/recibo OpenAPI, inmutabilidad, doble edición/publicación, copy/remapeo sin invitaciones, límites, catálogo pendiente/repetido/colisión y copias de banco simultáneas hasta veinte preguntas. Tests de catálogo usan datos ficticios propios y metadata de prueba; no acreditan revisión humana del catálogo de Luis.

Navegador real con MongoDB: crear, guardar incompleto, rechazo de publicación, configurar valores/pesos/excluyentes y texto libre, recargar, publicar, lectura protegida y editar copia sin cambiar original. Dos pestañas: 409 con edición local conservada, cancelar descarte y recargar con confirmación. Inspección móvil 375 × 812 sin desbordamiento horizontal y Tab entre título/área. Banco vacío en demo; copia/edición/recarga del banco comprobadas en otro entorno aislado con un fixture, confirmando original intacto y limpiando solo ese entorno.

CI incorpora test:screenings; ejecución remota no verificada. La prueba de navegador no se presenta como suite automatizada E2E del producto. OpenSpec screening-editor sigue activo hasta aprobar/cargar el catálogo y cerrar tareas. T-01/T-02/T-03 están en ramas de trabajo pendientes de integración hacia entrega 2 del fork. Sin despliegue público ni modificaciones al repositorio académico.
