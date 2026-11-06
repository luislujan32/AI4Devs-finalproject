## Context

NestJS ya sirve la API y React juntos. Actualmente escucha en loopback y envía invitaciones y códigos a Mailpit local. Render Free puede alojar un servicio HTTP y terminar TLS; Atlas Free conserva los datos fuera del disco efímero del servicio.

## Goals / Non-Goals

**Goals:** demo pública de la versión académica, datos ficticios y buzón con acceso separado. Mantener la misma autenticación y evidencia del flujo.

**Non-Goals:** correo externo, cuentas o datos reales, cambiar proveedor de base, evaluación por IA y rediseñar el producto.

## Decisions

- Un servicio Docker aloja Caddy, NestJS y Mailpit. Solo Caddy escucha en la interfaz pública; los otros dos escuchan en loopback. Caddy enruta la app y el buzón, y admite solo lectura del buzón por HTTP público. La autenticación del buzón la aplica Mailpit.
- La app envía a Mailpit por loopback con autenticación; la ruta pública no admite enviar, editar ni borrar mensajes. Los enlaces y códigos siguen usando las mismas sesiones y comprobaciones.
- El arranque de la imagen exige origen HTTPS, tres secretos distintos y la base `screeningroom_demo_public`. Aprovisiona un único recruiter de revisión y el banco sin sobrescribir. El modo local sigue usando su instancia independiente.
- El buzón es efímero y compartido entre quienes tienen credenciales de revisión. Tras un reinicio, se puede solicitar un código nuevo en vez de depender de mensajes previos. MongoDB conserva invitaciones, respuestas y decisiones.

## Risks / Trade-offs

- El arranque en frío y las cuotas del servicio gratuito son aceptables para la demo; verificar la primera visita antes de entregar.
- Las cuotas por IP de la API ven la dirección del proxy. Es aceptable para revisión de bajo tráfico; no confiar en cabeceras de cliente para eludirlas.
- No guardar datos reales ni publicar las contraseñas de revisión en Git. Compartirlas en el canal de entrega previsto para el revisor.
