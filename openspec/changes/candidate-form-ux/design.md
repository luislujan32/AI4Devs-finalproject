## Context

UX-02 en `docs/backlog.md` y `AGENTS.md` fija la aceptación. El candidato ya verifica correo por T-05 y T-07 define GET/PUT/POST de intento. El editor renovado ofrece etapas, campos, ayuda accesible y revisión final, pero el formulario requiere adaptar esos patrones a quien responde.

## Decisions

- Tras sesión válida se carga el intento desde servidor; las preguntas se muestran una a una con progreso y estado de guardado. Navegar entre ellas conserva cambios en memoria React, sin afirmar que se hayan guardado.
- El guardado reemplaza respuestas completas con `expectedRevision`; solo un HTTP 200 actualiza la revisión/estado «guardado». En 409 o red, el texto/opciones siguen visibles. Recargar la versión persistida cuando hay edición local requiere descarte explícito.
- Preguntas estructuradas incluyen «No puedo confirmarlo» como respuesta separada, y una acción para quitar respuesta. Texto libre se etiqueta y limita. La revisión muestra tanto respuestas como omisiones; las obligatorias sin respuesta bloquean el envío. Desconocido satisface la interacción obligatoria.
- El envío requiere pasar por revisión, marcar confirmación y tener la última versión guardada. El recibo se muestra solo tras confirmación del servidor; no hay puntajes, pesos, umbral, criterios internos o exclusiones en el cliente.
- Un aviso explica destinatario y plazo de conservación del prototipo. Foco visible, títulos enfocables al cambiar de etapa, botones táctiles y estilos móviles. Una prueba visual real de 375 px se hará cuando el navegador local esté disponible.

## Risks / Trade-offs

- Los cambios aún sin guardar viven solo en memoria; cerrar la pestaña puede perderlos. Se avisa antes de salir y se indica la acción de guardar, sin almacenar respuestas en localStorage.
- Un fallo de sesión durante edición exige revalidar acceso; no se envían respuestas automáticamente. El contenido local permanece visible mientras la pestaña siga abierta.
- La prueba con cuentas ficticias verifica funcionamiento técnico, no comprensión con postulantes reales. La investigación UX-01 es referencia de patrones, no evidencia de usabilidad del candidato.
