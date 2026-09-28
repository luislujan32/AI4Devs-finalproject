## Why

Luis observó que el editor de T-03 ofrece una mala experiencia: tarjetas extensas, acciones lejanas y campos difíciles de comprender. UX-01 debe mejorar la creación y revisión de screenings antes de ampliar el flujo de entrega 2, sin alterar las reglas P-01 a P-08 ni la frontera de publicación.

## What Changes

- Organizar el editor en Puesto, Preguntas y Revisión, con estado de guardado y acción de guardar visibles.
- Mostrar un listado compacto de preguntas y editar una a la vez; usar acciones pequeñas con apariencia de enlace para agregar preguntas/opciones, manteniendo semántica de botón y área táctil accesible.
- Mejorar jerarquía, etiquetas, estados, ayudas contextuales y controles de configuración. Mostrar información esencial junto al campo; usar ayuda desplegable para explicaciones adicionales en lugar de tooltips solo de hover.
- Evitar pérdida silenciosa al cambiar tipo o quitar preguntas; llevar errores de publicación al campo afectado y revisar antes de confirmar.
- Mejorar exploración del banco con filtro/búsqueda en el editor y conservar la opción manual.

## Capabilities

### New Capabilities

Ninguna. Es una mejora de capacidades existentes.

### Modified Capabilities

- `screening-authoring`: navegación, edición enfocada, ayudas, prevención de pérdida y revisión/publicación con errores accionables.
- `question-catalog`: exploración y selección de entradas desde el editor sin asignar reglas automáticas.

## Impact

Principalmente `apps/web/src/Workspace.tsx` y estilos. Las rutas, el modelo, la base de datos y el contrato OpenAPI no cambian. Documentación de uso, evidencia de navegador, teclado y móvil, registro de IA y backlog UX-01 se actualizan. No se añaden dependencias ni datos reales.
