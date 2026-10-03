# Informe, revisión humana y cierre de SC — T-08

[README](../README.md) · [Reglas P-01 a P-08](producto.md) · [Backlog](backlog.md).

La rama `feature/recruiter-results-T08-LL` agrega el último tramo del flujo local de entrega 2. En **Postulantes**, una fila con respuestas enviadas ofrece **Ver respuestas** en lugar de copiar el enlace. El panel presenta el resultado calculado, puntaje o cálculo pendiente, umbral, evidencia por criterio y requisitos excluyentes. La decisión humana se guarda en una sección separada; no recalcula el informe ni comunica una decisión al candidato. Los estados Por responder, En curso y Respuestas recibidas tienen estilos más visibles.

El recruiter puede cerrar un SC publicado tras confirmar el efecto. El cierre registra `closedAt` y revisión nueva, congela su configuración e impide nuevas invitaciones. Las invitaciones ya enviadas pueden completarse hasta el vencimiento individual de siete días. El SC cerrado conserva acceso de solo lectura a configuración, postulantes, informes y revisiones, y admite crear una copia como borrador. El enlace de un envío completado deja de mostrarse como acción de copia. Cerrar no elimina datos ni revoca enlaces anteriores.

| Ruta | Resultado |
| --- | --- |
| `POST /api/screenings/:id/close` | `{expectedRevision, confirmClosure:true}`; cierre atómico de un publicado propio, 409 ante revisión obsoleta o estado incorrecto |
| `GET /api/invitations/:id/report` | Informe y revisión vigente de una invitación enviada propia; 409 antes del envío y 404 si es ajena o salió de retención |
| `PUT /api/invitations/:id/review` | `{expectedRevision, decision, reason}`; decisiones `continue`, `do_not_continue`, `clarify`; motivo obligatorio al continuar con informe negativo o pendiente |

`expiresAt` limita el enlace y la sesión del candidato; no corta la consulta del informe por el recruiter. `purgeAt` limita resultados y revisiones y la eliminación TTL está configurada a 90 días desde la invitación. La revisión guarda autor, fecha y versión. Solo se conserva la última, conforme al alcance MVP. Las escrituras aplican sesión recruiter, propiedad, origen, CSRF y comparación de revisión; una edición simultánea devuelve 409.

**Evidencia local (03/10/2026):** `npm run check` pasó tipos, lint, build y OpenSpec; `npm run test:screenings` pasó 17 casos, incluidos cierre, propiedad, CSRF, retención, lectura del informe y revisión concurrente; `npm run test:attempt` pasó seis casos, incluido continuar una invitación existente tras cerrar el SC. También pasaron las regresiones de invitaciones (5), acceso (13), persistencia (14) y smoke. Las pruebas usan MongoDB/Mailpit locales y bases temporales. En navegador con datos ficticios aislados se abrió el informe, se guardó una revisión humana, se cerró el SC y se comprobó tras recargar que seguían visibles los postulantes/resultados y ya no aparecía la creación de invitaciones. A 375 px el documento no presentó desbordamiento horizontal; falta una prueba observada de usabilidad móvil del informe. Pendiente: integración en `feature/entrega-2-LL` y CI de esa rama. T-09 todavía debe resolver borrado anticipado y tratamiento de datos reales.
