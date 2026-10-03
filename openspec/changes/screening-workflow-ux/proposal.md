# Separar configuración y operación del screening

## Por qué

La revisión de Luis del 03/10 detectó invitaciones repetidas debajo de los tres pasos de autoría, copias sin eliminación, mensajes de prueba visibles en la interfaz y navegación móvil de preguntas con desplazamiento lateral. El candidato necesitaba un envío final que guardara cambios pendientes. Una cookie compartida entre recruiter y candidato hacía parecer vencida la sesión del primero.

## Qué cambia

- Mostrar Configuración y Postulantes como áreas de un screening publicado; el borrador solo ofrece configuración.
- Enviar la invitación inicial por Mailpit local con un mensaje HTML y enlace, además del código posterior solicitado al abrirla.
- Permitir eliminar únicamente borradores propios, con confirmación y revisión optimista.
- Simplificar invitaciones, ayudas, revisión y navegación móvil; guardar cambios pendientes al enviar respuestas.
- Aislar las cookies de recruiter y candidato para que ambos recorridos coexistan en el mismo navegador.

## Límites

El correo sigue siendo local y ficticio. El informe y la revisión humana del recruiter siguen en T-08. La decisión de producto sobre un eventual archivado de screenings publicados queda pendiente.
