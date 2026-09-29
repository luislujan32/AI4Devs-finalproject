## Context

T-05 crea una sesión opaca ligada a `invitationId`. Los documentos de invitación ya tienen `answers`, `answerRevision`, `submittedAt` y `report`; el screening publicado es inmutable. README y `docs/producto.md` fijan la semántica P-01 a P-08 y OpenAPI fija recibo de envío `{status,submittedAt}`.

## Decisions

- `GET /candidate/attempt` deriva invitación de sesión, relee screening publicado y expone solo título, descripción y preguntas con id/text/type/required/opciones id/label; no envía criterio interno, orientación del banco para el recruiter, peso, puntajes, umbral ni excluyentes. Devuelve respuestas propias, revisión y estado.
- `PUT /candidate/attempt/answers` recibe `{expectedRevision,answers}` como reemplazo completo. Se admite arreglo vacío; cada entrada debe referir una pregunta y forma válida: `option` con opción existente, `unknown` solo estructurada, `text` no vacío solo texto. IDs únicos, longitud acotada, ninguna clave extra. Un filtro MongoDB por invitación/estado/revisión/vigencia guarda respuestas e incrementa revisión en una escritura; conflicto 409 conserva estado anterior.
- `POST /candidate/attempt/submit` recibe solo `{expectedRevision}`; si ya se envió y la invitación sigue vigente, devuelve el mismo recibo. Si está abierto, valida respuestas requeridas (unknown satisface interacción estructurada), calcula informe puro con preguntas publicadas y hace una escritura condicional de `status`, `submittedAt` y `report`. Dos escritores no duplican informe. Si la revisión cambió, 409; input incompleto, 422.
- El cálculo usa pesos de **todas** las preguntas puntuables como denominador. Cualquier puntuable sin respuesta conocida produce score null; opciones conocidas conservan weightedPoints. Un excluyente conocido no aceptado tiene precedencia sobre faltantes y score. Desconocido y omitido tienen evidencias distintas. Texto libre nunca puntúa ni excluye. Comparación del score sin redondear; reporte versión v1 con tipos de OpenAPI.
- Las rutas usan `CandidateGuard`; el cuerpo no acepta invitationId. El guard revalida expiración/retención, y el servicio repite esos filtros en cada escritura. Estado enviado cierra edición. Las mutaciones siguen con Origin/CSRF de T-05.

## Risks / Trade-offs

- Una lectura seguida de una escritura puede coincidir con cambios externos de la base; el filtro final contiene revisión, estado y plazos. La publicación es inmutable por API. No se introducen transacciones entre colecciones.
- La evaluación conserva respuestas como declaraciones, no evidencia verificada de habilidades. Su resultado es apoyo para revisión humana, no decisión automática.
- El informe interno no se muestra al candidato. La futura UI T-06 usa el estado y las respuestas, no reglas de scoring.

## Migration Plan

No migrar esquemas. Implementar, probar sobre bases efímeras, documentar endpoints y conectar T-06. Revertir elimina rutas/cálculo sin borrar respuestas previamente guardadas.
