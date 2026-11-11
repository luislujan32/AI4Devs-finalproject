## Decisions

- `MAIL_PROVIDER=mailpit` es el valor por defecto. `brevo` exige `BREVO_API_KEY` y `MAIL_FROM_EMAIL` verificado. Arranque inválido falla antes de servir; no hay fallback de direcciones reales a Mailpit.
- El dominio example.test siempre usa Mailpit, incluso después de activar Brevo, para conservar pruebas e invitaciones anteriores. Direcciones reales solo se aceptan en modo Brevo.
- Se usa la API HTTPS fija de Brevo, con un solo destinatario por mensaje y timeout. No se envían respuestas ni informes al proveedor ni se crean contactos de marketing. Una aceptación API no acredita entrega en bandeja.
- La invitación persiste un estado de correo `unconfirmed` antes de llamar al transporte. Un rechazo explícito permite eliminar el registro intacto y reintentar como hasta ahora. Timeout, fallo de red o respuesta 5xx conservan invitación y token; la lista ofrece copiar su enlace. No se reenvía automáticamente.
- Un contador MongoDB compartido admite como máximo 50 intentos de correo externo por día UTC, incluyendo invitaciones y códigos, sin reset al reiniciar. Se conservan los límites por invitación/IP existentes.

## Revisión de producto

Invitar sigue siendo una acción del recruiter autenticado sobre su SC publicado. La confirmación indica aceptación del envío o incertidumbre, nunca recepción garantizada. En caso incierto, volver/recargar conserva un aviso junto al postulante y el enlace compartible; el candidato puede verificar su correo mediante código. Un rechazo devuelve error y conserva los campos del formulario.

## Revisión de UX

La lista devuelve únicamente el modo de entrega y el estado mínimo de correo. El formulario muestra correo personal y ayuda de bandeja/spam con Brevo, o example.test y buzón de pruebas con Mailpit. No permite enviar antes de conocer la configuración. El código explica dónde encontrarlo según el canal de esa invitación. No añade pasos ni cambia controles visuales.

## Límites y operación

El remitente requiere verificación y la cuenta Brevo puede necesitar activación. Sin dominio propio, Brevo puede sustituir la dirección visible. Claves solo en Render y por intervención de Luis. Avisos explican demo, correo y uso de respuestas ficticias; retención actual de 90 días, borrado anticipado general T-09 aún pendiente. No se promete producción ni entrega garantizada.

Fuentes: https://developers.brevo.com/reference/send-transac-email ; https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email ; https://render.com/docs/free .
