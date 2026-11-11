## Why

Luis aprobó usar Brevo sin comprar un dominio para que un revisor complete el recorrido con su correo personal. La demo actual solo admite example.test y captura mensajes en Mailpit.

## What Changes

- Seleccionar explícitamente Mailpit o Brevo por configuración de servidor; Brevo usa HTTPS y un remitente verificado, sin secretos en frontend.
- Permitir direcciones reales solo con Brevo configurado; conservar el correo ficticio en Mailpit para las pruebas y las invitaciones previas.
- Distinguir envío aceptado, rechazo y resultado incierto. Conservar una invitación si una interrupción impide confirmar si el proveedor la aceptó.
- Adaptar las ayudas del formulario y del código al canal real, mantener límites de acceso y limitar el correo externo de la demo.

## Capabilities

### New Capabilities
- `transactional-review-email`: invitaciones y códigos reales para revisión académica.

### Modified Capabilities
- `public-academic-demo`: direcciones personales de revisión admitidas al activar correo externo, sin abandonar los escenarios ficticios de Mailpit.

## Impact

Transporte de correo, validación de destinatarios, metadatos de envío, ayudas de dos formularios, despliegue, pruebas y documentación. No cambia evaluación, versiones ni decisión del recruiter. Las respuestas continúan siendo ficticias; no se habilita reclutamiento real.
