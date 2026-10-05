## Why

La copia independiente no permite editar un SC publicado como una sola tarea. La decisión de Luis es aplicar cambios solo a futuras invitaciones, preservando toda configuración e informe anterior (T-03/T-05/T-06).

## What Changes

- Mantener una identidad de SC, una configuración activa y un borrador de cambios.
- Publicar cambios activa una versión inmutable para nuevas invitaciones; las previas conservan su versión.
- Consultar configuraciones históricas y mostrar la versión aplicada por postulante/informe.
- Descartar solo el borrador de cambios; impedir cierre mientras exista para evitar pérdida silenciosa.
- Copiar sigue creando otro SC independiente desde la configuración activa.

## Capabilities

### New Capabilities
- `screening-versions`: edición futura, activación condicional e historial inmutable del SC.

### Modified Capabilities

Ninguna: se conserva el contrato de autoría inicial y evaluación; se amplía con versiones explícitas.

## Impact

Persistencia de configuraciones, servicios de screenings/invitaciones/intentos/informes y navegación del recruiter. Sin proveedor ni dependencia nueva. Datos anteriores se resuelven como v1; no se reconstruyen versiones inexistentes. Aporta al flujo principal de entrega 2 sin modificar el scoring ni la decisión humana.
