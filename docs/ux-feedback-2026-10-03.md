# Revisión UX del recorrido de screening — 03/10/2026

Las capturas C1–C8 y la prueba de Luis muestran dos recorridos: autoría del screening y operación con postulantes. La invitación no pertenece a cada paso de autoría. Se adoptó una navegación superior Configuración / Postulantes para screenings publicados; en borrador solo aparece la configuración. Esta agrupación sigue el principio de tareas relacionadas y estados claros del [patrón de múltiples tareas de GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/). Es una inferencia para este producto, no una plantilla que deba copiarse literalmente.

| Observación | Resolución actual | Pendiente |
| --- | --- | --- |
| Copias acumuladas | Eliminar borradores propios con confirmación y revisión vigente. | Decidir si los publicados se archivan. |
| Invitaciones mezcladas con Puesto/Preguntas/Revisión | Área Postulantes separada; formulario compacto que se cierra al enviar; lista con estado y copia mediante botón con icono. | Integraciones de terceros solo cuando haya un caso concreto. |
| «Correo ficticio» y mensajes de prueba | Etiqueta normal «Correo electrónico» y texto de éxito sobre envío. La restricción `@example.test` se explica en una nota específica de la demo. | Proveedor de correo real y política de datos antes de usar direcciones reales. |
| Correo de invitación ausente | Primer mensaje HTML/texto con enlace en Mailpit; al abrir el enlace se solicita el código en otro mensaje. | Entrega externa y observabilidad del proveedor. |
| Ayuda `ⓘ ¿Qué es?` | Solo icono, texto al pasar el cursor o enfocar, y activación táctil; Escape lo cierra. | Validación con teclado/lector de pantalla en una sesión completa. |
| Enviar bloqueado por cambios sin guardar | El botón guarda primero y envía con la revisión que confirmó el servidor; en caso de error conserva la edición. | E2E de UI a 375 px y fallos simulados. |
| Recibo y aviso densos | Eliminar confirmación duplicada y separar la explicación de datos en dos frases. | Test de comprensión con usuarios. |
| Sesión «vencida» inesperadamente | Dos cookies independientes: verificar al candidato ya no reemplaza la sesión del recruiter; error de sesión sin botón «Reintentar» ambiguo. | Duración preferida de la sesión. |
| Lista lateral de preguntas en móvil | Selector vertical nativo a ancho reducido. | Comprobar editor autenticado completo a 375 px. |
| Respuestas no visibles para recruiter | El informe se conserva con el intento en MongoDB. | T-08: consulta y revisión humana en Postulantes. |

La [revisión de respuestas de GOV.UK](https://design-system.service.gov.uk/patterns/check-answers/) respalda mostrar lo declarado y facilitar la edición antes del envío. Su [patrón de confirmación](https://design-system.service.gov.uk/patterns/confirmation-pages/) orienta a un recibo claro tras la operación, sin repetir mensajes de éxito. El [patrón de tooltip W3C](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) describe aparición por hover/foco y cierre con Escape; aquí se añadió activación por toque para móviles. Estas referencias informan decisiones de diseño: la prueba con usuarios todavía falta.
