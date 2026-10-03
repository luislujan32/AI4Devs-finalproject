## Why

Las respuestas y el informe ya se guardan, pero el recruiter no puede consultarlos ni dejar su revisión humana. Un screening publicado tampoco puede cerrarse sin perder la posibilidad de consultar resultados. Esto deja incompleto el flujo principal de entrega 2.

## What Changes

- Mostrar respuestas e informe por criterio al recruiter propietario, separados de su decisión humana.
- Guardar la revisión vigente con autor, fecha, motivo y control de concurrencia; exigir motivo cuando se continúa con resultado negativo o pendiente.
- Permitir cerrar un screening publicado sin borrar invitaciones ni resultados. El cierre bloquea nuevas invitaciones, congela la configuración y deja completar invitaciones ya enviadas hasta su vencimiento.
- Mantener los resultados disponibles durante la retención aunque el enlace individual haya vencido; ocultar la acción de copiar un enlace una vez enviadas las respuestas.

## Capabilities

### New Capabilities

- `recruiter-results`: lectura del informe y revisión humana propia.

### Modified Capabilities

- `screening-authoring`: cierre terminal de un publicado y copia de uno cerrado.
- `candidate-attempt`: intentos existentes continúan tras el cierre hasta vencer su invitación.
- `recruiter-workspace`: acceso a postulantes y resultados en screenings cerrados.

## Impact

API NestJS, persistencia de screening, interfaz recruiter, contratos y pruebas HTTP/MongoDB. Se conservan P-01 a P-08 y la evaluación determinista; no se envían decisiones a candidatos ni se habilita correo real.
