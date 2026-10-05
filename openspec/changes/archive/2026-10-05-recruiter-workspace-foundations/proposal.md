## Why

La auditoría C1–C6 encontró que las listas se truncan a 100 elementos y presentan ese tamaño como total. Además, la navegación y los estados del trabajo recruiter dificultan encontrar screenings y postulantes. Corregir esta base permite usar el MVP con volúmenes reales sin inducir decisiones sobre información incompleta.

## What Changes

- Paginar y filtrar screenings e invitaciones en el servidor, con totales y orden estables, sin mezclar registros de otros recruiters.
- Dar al recruiter una estructura de aplicación reconocible, un dashboard compacto y una cola de postulantes alineada y filtrable.
- Hacer que la sección y el informe abiertos se puedan recuperar con Atrás/Adelante y enlaces directos.
- Mejorar las confirmaciones de invitación y el correo local con vencimiento absoluto y contenido equivalente en HTML y texto.
- Conservar intactas las reglas de publicación y revisión; el versionado para futuras invitaciones queda en un cambio separado.

## Capabilities

### New Capabilities

- `recruiter-listing`: Búsqueda, filtros, paginación, totales y navegación de las listas de screenings e invitaciones.

### Modified Capabilities

- `recruiter-workspace`: Estructura global, estados, navegación recuperable y confirmación accesible de invitaciones.

## Impact

T-02/T-05/T-08 y el flujo principal de entrega 2. Cambian respuestas de `GET /api/screenings` y `GET /api/screenings/:id/invitations` de forma aditiva; se modifican las vistas recruiter y el generador local de correo. No se requieren dependencias externas nuevas.
