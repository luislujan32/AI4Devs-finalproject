# Editar un screening para nuevas invitaciones

04/10/2026. Cambio OpenSpec `screening-configuration-versions`. Implementa la decisión de Luis: **solo futuras invitaciones** reciben cambios; un SC mantiene identidad y lista única.

## Comportamiento

- «Editar para nuevas invitaciones» crea o recupera un borrador de la próxima configuración. Mientras se prepara, la publicada sigue recibiendo invitaciones.
- Autoguardado de título, área, descripción, preguntas y reglas persiste solo el borrador de cambios. Revisión compara contenido, preguntas, pesos, valores, excluyentes y umbral con la activa.
- «Publicar cambios» valida las mismas reglas del editor y activa la nueva versión. Ninguna invitación emitida se mueve ni se recalcula; el correo usa el título de la configuración fijada.
- «Descartar borrador de cambios» elimina solo ese borrador, con confirmación/revisión. El cierre exige resolverlo antes, sin pérdida silenciosa.
- Historial de configuraciones en Preguntas y reglas, versión recibida en Postulantes e informe. Copiar crea otro SC independiente desde la activa.

## Persistencia y frontera de concurrencia

`Screening` es identidad/estado. `ScreeningConfiguration` contiene una configuración publicada inmutable. `activeConfigurationId`, `initialConfigurationId`, `configurationVersion` y `configurationIds` identifican versiones oficiales; `editingDraft` es el único borrador. Los campos originales de preguntas/reglas permanecen como v1 legacy; título/área del SC se actualizan como metadata para el dashboard. Nunca consumir esos campos mixtos como configuración activa: usar el resolver `configurationFor`.

La primera edición materializa v1 antes de cualquier cambio y la fija en el root mediante CAS. Invitaciones sin referencia resuelven esa inicial, o el documento original si nunca se editó. No se migran respuestas, informes ni revisiones. Las siguientes invitaciones guardan `configurationId` y `configurationVersion`. Mantener una invitación por SC/correo incluye todas las versiones.

Publicar inserta la configuración y después activa su puntero/lista mediante un único CAS de status+revision+borrador. Solo un perdedor confirmado elimina su propio insert. Una excepción de transporte tiene resultado desconocido: no borra el documento, pues el CAS podría haber ganado. Una caída previa puede dejar una configuración huérfana, que no está en IDs oficiales, no se muestra ni se usa; no se implementó recolección de huérfanos.

Invitar selecciona una versión completa y revalida estado/puntero antes de entregar el correo. Si cambió, limpia su invitación intacta y vuelve a seleccionar, hasta tres intentos. Operaciones solapadas pueden usar la versión anterior seleccionada; las iniciadas después de confirmar publicación usan la nueva. MongoDB y SMTP no forman una transacción: no se promete que un correo iniciado antes de un cierre no termine después.

## API

| Operación | Efecto |
| --- | --- |
| GET `/api/screenings/:id?version=N` | Configuración oficial histórica con ownership |
| POST `/api/screenings/:id/edit` | Crear/recuperar borrador; expectedRevision |
| GET `/api/screenings/:id/edit` | Recuperar editor y configuración activa de comparación |
| PUT `/api/screenings/:id/edit` | Autosave CAS del borrador |
| POST `/api/screenings/:id/edit/questions/from-bank` | Incorporar banco sin duplicación ni reglas automáticas |
| POST `/api/screenings/:id/edit/publish` | Activar cambios; revisión y confirmación |
| DELETE `/api/screenings/:id/edit` | Descartar solo borrador con revisión actual |

La proyección del editor usa `status: draft` y `editingPublished: true`; el estado persistido del SC sigue `published`. El acceso a las rutas conserva guard recruiter/CSRF. Publicar inicialmente mantiene el recibo previo.

## Evidencia y límites

Pruebas de integración: legacy lee/guarda/envía con v1 después de v2; v2 persiste después de v3; historial, copia íntegra activa y listado único; dos aperturas/publicaciones; fallos antes/después de CAS; carreras de invitación con edición/publicación/cierre. Un fallo al revalidar o preparar el correo limpia la invitación propia intacta y permite reintentar con el mismo correo; ambos casos se comprobaron con inyección de errores. Se usan bases aisladas y datos ficticios.

`test:screenings` 24/24, `test:persistence` 14/14, `test:candidate` 7/7 y `test:attempt` 6/6; tipos, lint, build y OpenSpec correctos. Revisión visual con guardado, publicación, invitación v2 e informe/configuración v1 sobre el mismo SC; teclado y anchos efectivos de 375 y 320 px sin desbordamiento en las vistas comprobadas. No sustituye prueba con recruiters representativos ni clientes reales de correo.

Reiniciar todas las instancias API antes de usar edición. Volver a un binario anterior tras publicar versiones no es compatible con invitaciones nuevas; conservar esta versión y corregir hacia adelante. Sin reabrir SC cerrado, mover invitaciones emitidas ni notificar cambios automáticamente.
