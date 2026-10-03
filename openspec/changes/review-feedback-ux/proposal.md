# Aclarar la edición y el acceso del screening

## Por qué

La revisión de Luis del 03/10 encontró guardado inconsistente, preguntas repetidas del banco, una publicación con validación tardía, informes confundidos con la lista de postulantes y un código redundante al abrir el correo. La demo además mantenía un servidor anterior sin las rutas de informe y cierre.

## Qué cambia

- Guardar todos los campos del borrador automáticamente, con estado y reintento visibles.
- Mostrar prerrequisitos de publicación y rechazar umbrales que ninguna combinación de respuestas puede alcanzar.
- Impedir una segunda copia de la misma pregunta del banco dentro de un screening.
- Presentar el informe como vista independiente de la lista y dejar una sola acción de regreso.
- Mantener inmutable la configuración publicada; «Crear nueva versión» abre un borrador vinculado al origen y explica el efecto sobre invitaciones existentes.
- Abrir desde el correo con un token de un uso. El enlace que copia el recruiter sigue exigiendo un código enviado al correo.

## Límites

Las reglas del banco incluyen orientación, pero no puntajes ni pesos automáticos, según decisión de Luis. El correo continúa en Mailpit local y con direcciones ficticias. Un token ya usado o vencido vuelve al flujo de código.
