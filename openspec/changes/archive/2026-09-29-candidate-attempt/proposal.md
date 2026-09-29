## Why

El candidato ya puede verificar su correo, pero todavía no puede leer preguntas, guardar respuestas ni enviar un intento. T-07 debe completar la API y el cálculo determinista del contrato P-01 a P-08 para que T-06 pueda construir el formulario real.

## What Changes

- Lectura candidata de la configuración publicada, con solo campos necesarios para responder y sin reglas de evaluación.
- Guardado de respuestas completas con revisión optimista, validación estricta y posibilidad de dejar preguntas sin responder.
- Envío único que valida obligatoriedad, calcula informe determinista y lo conserva atómicamente con estado/fecha.
- Reintento idempotente del envío, sin revelar scoring ni informe al candidato.
- Pruebas puras del algoritmo y HTTP/MongoDB de ownership, concurrencia, estados y contrato.

## Capabilities

### New Capabilities

- `candidate-attempt`: cuestionario publicado, borrador de respuestas, evaluación y envío final protegido.

### Modified Capabilities

- `candidate-access`: una sesión candidata vigente permite operar solo sobre su intento.

## Impact

NestJS y MongoDB existentes; rutas `/api/candidate/attempt`, `/answers`, `/submit`; documentación y tests. T-06 consumirá estas rutas con UX-02. No se usan IA ni datos reales para evaluar.
