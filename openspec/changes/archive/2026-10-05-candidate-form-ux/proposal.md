## Why

Luis aprobó la mejora UX del editor del recruiter y pidió aplicar los mismos principios al formulario del postulante. T-05 resuelve acceso; T-07 aporta respuestas y envío. Falta presentar ese flujo de forma comprensible y recuperable para el candidato.

## What Changes

- Una pregunta por paso, progreso, navegación anterior/siguiente y edición desde revisión.
- Opciones/entrada de texto claras, desconocido distinto de omisión, obligatoriedad visible y avisos de uso de datos.
- Guardado solo confirmado por el servidor, cambios locales preservados ante error/conflicto y aviso al salir.
- Revisión final y confirmación explícita antes del envío irreversible; pantalla de recibo sin scoring.
- Diseño táctil/teclado/móvil y comprobación con invitaciones ficticias.

## Capabilities

### New Capabilities

- `candidate-form`: recorrido del postulante conectado con la API de intento.

## Impact

React/CSS, documentación UX-02, pruebas de navegador y flujo T-07. No se exponen reglas de evaluación ni se guardan datos del postulante en localStorage.
