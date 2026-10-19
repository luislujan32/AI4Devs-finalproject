# API implementada — entrega 2

Estado al 19/10/2026. [README](../readme.md) · [OpenAPI representativo](openapi.yaml) · [Ejecución local](desarrollo.md).

Este índice reúne las **33 operaciones implementadas** y sus entradas principales. OpenAPI conserva las tres operaciones representativas de la plantilla; este anexo completa el contexto de implementación. No hay endpoints de sugerencias IA ni de borrado anticipado de invitaciones en esta entrega.

## Sesiones, revisiones y errores

Todas las rutas usan el prefijo `/api` y el mismo origen que la interfaz. Las cookies son `HttpOnly`: `sr_recruiter_session` para recruiter y `sr_candidate_session` para candidato. Un identificador de recurso nunca sustituye la autorización por propietario. Los secretos y tokens no deben copiarse a documentación ni logs.

Las mutaciones requieren `Origin` permitido y `X-CSRF-Token`. Login, solicitud/verificación de código y enlace de correo usan el token y cookie de preacceso obtenidos en `GET /api/auth/csrf`; las mutaciones autenticadas usan el token de su sesión. El navegador administra las cookies. Ninguna sesión permite consultar recursos de otro principal.

`expectedRevision` es la revisión que se leyó del recurso correspondiente: SC para autoría/cierre, `answerRevision` para respuestas/envío y `review.revision` para decisión (cero antes de la primera). Un conflicto devuelve 409 y no autoriza a sobrescribir con una revisión inventada. Los guardados de configuración y respuestas reemplazan el conjunto enviado; los campos omitidos pueden limpiarse.

| HTTP | Significado implementado |
| --- | --- |
| 401 | Sesión ausente, expirada o principal incorrecto; también código inválido/consumido/vencido |
| 403 | Origen o CSRF incorrecto |
| 404 | Recurso inexistente, ajeno o fuera de retención; invitación no disponible en solicitud de código |
| 409 | Revisión/estado incompatible, correo ya invitado o informe todavía sin envío |
| 422 | Entrada, filtro o configuración inválidos |
| 429 | Límite temporal de solicitudes |
| 503 | Mailpit o MongoDB no disponibles, según operación |

Los errores comunes de Nest incluyen `message`, `statusCode` y, según el caso, `error`. Los errores de publicación/envío pueden devolver `{message, issues: string[]}`; un límite de reenvío puede incluir `retryAfterSeconds`. No hay contrato implementado de `{code, fields}` ni respuesta 410. La sesión candidata caducada se rechaza con 401; una invitación no disponible también puede dar 404 según el punto del recorrido.

## Acceso y disponibilidad

| Operación | Sesión | Entrada y resultado principal |
| --- | --- | --- |
| `GET /api/health/ready` | Pública | Ping real a MongoDB; 200 disponible o 503, sin URI de conexión |
| `GET /api/auth/csrf` | Preacceso | Token CSRF y cookie firmada de preacceso, sin caché |
| `POST /api/auth/login` | Preacceso | `{email, password}` → 200 con usuario mínimo, `csrfToken`, `expiresAt` y cookie recruiter |
| `GET /api/auth/session` | Recruiter | Usuario, CSRF y vencimiento vigentes |
| `POST /api/auth/logout` | Recruiter | Revoca solo la sesión recruiter; 200 |

## Screenings y banco

Todas requieren recruiter propietario; los identificadores ajenos se tratan como no encontrados.

| Operación | Entrada y resultado principal |
| --- | --- |
| `GET /api/screenings` | Lista paginada, filtros y resumen; ver parámetros abajo |
| `POST /api/screenings` | Borrador incompleto: `title?`, `area?`, `description?`, `threshold?`, `questions?`; 201, estado draft y revisión cero |
| `GET /api/screenings/:id` | Borrador propio o configuración activa de publicado/cerrado; `?version=N` selecciona una versión oficial histórica |
| `PUT /api/screenings/:id` | Configuración del borrador y `expectedRevision`; 200, incremento de revisión |
| `DELETE /api/screenings/:id` | `{expectedRevision}`; 204, solo borrador propio; no elimina publicados/cerrados |
| `POST /api/screenings/:id/publish` | `{expectedRevision, confirmConfiguration:true}`; 200 con recibo de publicación inicial |
| `POST /api/screenings/:id/close` | `{expectedRevision, confirmClosure:true}`; 200 con estado, revisión y `closedAt`; exige resolver antes el borrador de cambios |
| `POST /api/screenings/:id/copy` | Body vacío; 201 con otro SC en borrador, basado en la configuración activa, IDs nuevos y sin invitaciones |
| `GET /api/question-bank` | `area?` exacta; preguntas activas, máximo cien entradas del catálogo; no es la paginación de screenings |
| `POST /api/screenings/:id/questions/from-bank` | `{expectedRevision, bankQuestionId}`; 200 con borrador actualizado; impide incorporar dos veces la misma entrada |

La configuración tiene hasta veinte preguntas. Texto libre no puntúa ni excluye; el banco incorpora contenido y orientación sin aprobar valores, pesos ni excluyentes. El [contrato funcional](producto.md), [la guía de autoría](screenings.md) y los tipos/validación del servidor detallan los campos de pregunta.

### Cambios para futuras invitaciones

| Operación | Entrada y resultado principal |
| --- | --- |
| `POST /api/screenings/:id/edit` | `{expectedRevision}`; 201 con editor del único borrador de cambios de un SC publicado, nuevo o recuperado |
| `GET /api/screenings/:id/edit` | 200 con borrador, revisión del SC y configuración activa para comparar; 409 si no existe borrador |
| `PUT /api/screenings/:id/edit` | Configuración y `expectedRevision`; 200, guarda solo el borrador de cambios |
| `POST /api/screenings/:id/edit/questions/from-bank` | `{expectedRevision, bankQuestionId}`; 200, incorpora al borrador de cambios sin duplicados |
| `POST /api/screenings/:id/edit/publish` | `{expectedRevision, confirmConfiguration:true}`; 200 con detalle de la nueva activa y su historial |
| `DELETE /api/screenings/:id/edit` | `{expectedRevision}`; 200 con detalle; descarta solo los cambios y conserva activa e invitaciones |

La identidad del SC y la lista de postulantes se conservan. Cada invitación mantiene su configuración fijada; publicar v2 solo afecta invitaciones futuras. La proyección del editor usa `status: draft` y `editingPublished: true`, aunque el SC persistido sigue publicado. [Versiones, concurrencia y límites](screening-versions.md).

## Invitaciones e informes

| Operación | Sesión | Entrada y resultado principal |
| --- | --- | --- |
| `GET /api/screenings/:id/invitations` | Recruiter | Invitaciones propias no purgadas, filtros, total y resumen; ver parámetros abajo |
| `POST /api/screenings/:id/invitations` | Recruiter | `{candidateEmail, candidateName?}`; solo SC publicado y correo ficticio `example.test`; 201 con invitación y `emailSent:true` después de aceptar Mailpit |
| `GET /api/invitations/:invitationId/report` | Recruiter | 200 con nombre/correo del candidato, `configurationVersion`, informe y revisión vigente; disponible en SC cerrado dentro de retención |
| `PUT /api/invitations/:invitationId/review` | Recruiter | `{expectedRevision, decision, reason?}` → 200 con `review`; nuevas decisiones `continue`/`do_not_continue`; continuar contra resultado negativo/pendiente exige motivo |

Un mismo correo tiene una invitación por SC, incluyendo sus versiones. Un fallo de preparación/entrega no debe presentarse como envío correcto. La lista devuelve resumen del resultado y decisión, sin todas las respuestas; el detalle está en el informe. Los registros antiguos `clarify` siguen legibles, pero no se admiten como nueva decisión. [Acceso](candidatos-acceso.md) · [Resultados y cierre](resultados-recruiter.md).

## Acceso y respuestas del candidato

| Operación | Sesión | Entrada y resultado principal |
| --- | --- | --- |
| `POST /api/candidate/access/request` | Preacceso | `{publicId}` → 200 con `status:sent`, espera de reenvío; entrega código solo al correo registrado |
| `POST /api/candidate/access/verify` | Preacceso | `{publicId, code}` → 200, consume código y crea cookie candidata con CSRF/vencimiento |
| `POST /api/candidate/access/email-link` | Preacceso | `{publicId, token}` → 200, consume una vez el token del correo y crea sesión sin código adicional |
| `GET /api/candidate/session` | Candidato | CSRF, vencimiento, identificador público y resumen de su invitación |
| `POST /api/candidate/logout` | Candidato | 200, revoca solo esta sesión candidata |
| `GET /api/candidate/attempt` | Candidato | Preguntas visibles, respuestas, `answerRevision`, estado y recibo si ya envió; sin puntajes, pesos, umbral, excluyentes ni informe |
| `PUT /api/candidate/attempt/answers` | Candidato | `{expectedRevision, answers}` → 200 con conjunto confirmado y nueva `answerRevision`; permite incompletos, impide editar tras envío |
| `POST /api/candidate/attempt/submit` | Candidato | `{expectedRevision}` → 200 con `status:submitted` y `submittedAt`; evalúa respuestas guardadas y devuelve el mismo recibo al reintentar |

Cada respuesta usa `questionId` y `kind`: `option` con `optionId`, `text` con texto de hasta 2000 caracteres o `unknown` en preguntas estructuradas. Omitir una pregunta opcional no equivale a contestar desconocido. La UI puede guardar primero los cambios pendientes y después invocar submit; la API de envío no recibe respuestas nuevas en el mismo body.

El enlace compartible carece del token del correo y necesita código. Invitación: siete días; código: diez minutos y un uso; sesión: hasta dos horas, limitada por la invitación. El cierre del SC impide nuevas invitaciones, pero una previa puede responder hasta vencer. [Formulario y evaluación](candidatos-formulario.md).

## Parámetros de listas

Ambas listas aceptan `page` (predeterminado 1; 1–10000), `pageSize` (predeterminado 20; 1–50) y `search` (búsqueda literal, sin distinguir mayúsculas, hasta 120 caracteres). Orden: creación descendente e ID descendente como desempate.

- Screenings: `status=draft|published|closed`; `search` busca título. Devuelve `screenings`, `total` del filtro, `page`, `pageSize` y `summary` global del propietario; cada SC incluye `invited`, `pendingReview`, versión y existencia de borrador de cambios.
- Invitaciones: `status=invited|in_progress|submitted`, `result=meets|not_meets|needs_review`, `decision=continue|do_not_continue|clarify|pending`, `queue=review`; `search` busca nombre/correo. Devuelve `invitations`, `total` del filtro, página/tamaño y `summary:{invited,pendingReview}` del SC.
- `queue=review` y `decision=pending` se refieren a envíos recibidos sin decisión; combinaciones incompatibles con estado/decisión devuelven 422. `clarify` filtra únicamente registros históricos.
- Se puede recorrer el registro 101 y siguientes. El máximo de cincuenta es por página, no un tope total. Los resúmenes no se obtienen contando solo las filas visibles. Las altas concurrentes pueden desplazar filas entre páginas; no se promete una instantánea de todo el listado.
