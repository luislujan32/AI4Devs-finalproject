## Context

La API limita silenciosamente a 100 los screenings y las invitaciones. El navegador no dispone de total ni consulta filtrada; las vistas mezclan navegación, trabajo y acciones de ciclo de vida. El contrato P-04 mantiene inmutable la configuración publicada. La auditoría C1–C6 y la elección de Luis sobre futuras invitaciones delimitan este cambio.

## Goals / Non-Goals

**Goals:** consultas completas y autorizadas, cola de trabajo entendible, navegación recuperable, confirmaciones y correo claros.

**Non-Goals:** versión activa de SC publicados, pipeline de contratación, notificaciones externas, datos reales.

## Decisions

- Usar paginación de página con tamaño acotado, orden `createdAt, _id` y `countDocuments` con el mismo filtro. Se eligió frente a cargar todo en el cliente; es suficiente para este MVP y permite acceso directo a una página. Los inserts concurrentes pueden desplazar páginas, por eso la clave secundaria mantiene un orden determinista.
- Filtrar siempre por `ownerId` en MongoDB. Para postulantes incluir solo invitaciones no purgadas. Los contadores se calculan en el servidor sobre todo el conjunto autorizado, no desde el tamaño de la página. Búsqueda escapada para no aceptar expresiones regulares arbitrarias.
- Mantener un solo detalle de SC, pero representar sección e informe en el hash para navegación y enlaces directos. Borrador conserva editor; publicado abre Postulantes. El estado no actúa como control.
- Mostrar recepción, resultado calculado y decisión humana como dimensiones distintas en una lista alineada. La cola Por revisar significa respuestas enviadas sin decisión humana; Kanban queda fuera porque no existe un pipeline de etapas.
- Éxito de invitación anunciado una vez con `role=status`, retirado al cambiar de tarea; error persistente con `role=alert` y campos conservados.
- Pasar `expiresAt` persistido al generador de correo. El texto y HTML comparten asunto, CTA, vencimiento absoluto y recuperación. El correo no inventa empresa ni contacto.

## Risks / Trade-offs

- [Paginación por offset cambia ante altas concurrentes] → ordenar con desempate y refrescar totales al volver; un cursor puede incorporarse si el volumen lo justifica.
- [Consultas de conteo pueden crecer] → índices por dueño/estado y dueño/SC/fecha; medir antes de añadir agregaciones más complejas.
- [Rutas antiguas sin sección] → conservar la vista por defecto según estado.

## Migration Plan

Los parámetros son opcionales y la forma actual `screenings`/`invitations` se conserva; se agregan metadatos. No hay migración de documentos. Desplegar API y web juntas; el rollback conserva datos.

## Open Questions

La edición de un publicado y la versión activa se especificarán en un cambio independiente antes de tocar persistencia de invitaciones.
