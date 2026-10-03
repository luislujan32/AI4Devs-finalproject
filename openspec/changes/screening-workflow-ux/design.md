# Diseño

El estado del screening sigue siendo `draft|published` y su configuración publicada continúa inmutable. La UI usa un área superior `configuracion|postulantes`; los pasos Puesto/Preguntas/Revisión solo existen dentro de Configuración. Postulantes contiene la invitación y la lista de personas, con un formulario plegado tras enviar.

`DELETE /screenings/:id` recibe `expectedRevision` y aplica propiedad, estado borrador y revisión en un único filtro. El cliente confirma la pérdida de edición local antes de llamar. Publicados no se eliminan con esta operación para conservar referencias a intentos e informes.

La creación de invitación persiste primero y entrega un correo HTML/texto mediante Mailpit local. Si falla el envío se revierte la invitación aún intacta y se devuelve 503; el código se solicita después desde el enlace. Las cookies `sr_recruiter_session` y `sr_candidate_session` se leen y revocan por principal, sin prolongar por accidente el tiempo de sesión.

En el cuestionario, el botón final encadena PUT del borrador si hay cambios y POST de envío con la revisión confirmada. Si falla el PUT no se envía; la edición sigue visible. Una selección móvil reemplaza la lista horizontal de preguntas. La ayuda contextual usa icono, hover/foco y activación táctil, con Escape para cerrar.
