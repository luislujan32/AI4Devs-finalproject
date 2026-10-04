## Context

El intento lee Screening por invitation.screeningId. Mutarlo cambiaría reglas ya recibidas. MongoDB local es standalone: no suponemos transacciones. Revisión de producto/UX propone un SC, versión activa y un borrador; revisión técnica confirma documentos inmutables con activación CAS como alternativa que conserva todo el historial.

## Goals / Non-Goals

**Goals:** editar futuras invitaciones, conservar v1 legacy, navegación clara, historial e informes estables.
**Non-Goals:** mover invitaciones existentes, etapas de contratación, correos de actualización o reabrir SC cerrado.

## Decisions

- Screening conserva identidad, estado y revision CAS; incluye activeConfigurationId, initialConfigurationId, configurationVersion y una lista de IDs oficiales. editingDraft contiene solo una configuración editable.
- ScreeningConfiguration almacena configuración publicada inmutable y su número explícito. Insertar antes de CAS y activar el puntero en un único update del SC garantiza que nunca apunte a un documento inexistente. Un perdedor elimina solo su documento nuevo; interrupción antes del CAS puede dejar un documento no referenciado, invisible al usuario.
- La primera edición congela configuración original como v1 antes de activar cualquier cambio. Invitaciones sin configurationId resuelven initialConfigurationId; si el SC nunca tuvo versiones, leen la configuración original. Nunca usan la activa nueva como fallback.
- Nuevas invitaciones fijan configurationId/number leídos de un SC publicado. Revalidar estado/puntero antes del correo, reintentar selección ante cambio. Pedidos solapados con publicación pueden conservar la versión anterior seleccionada; los iniciados después de la confirmación usan la nueva. No se promete atomicidad entre MongoDB y SMTP.
- Cerrar con editingDraft devuelve conflicto y pide publicar/descartar. Copy usa configuración activa, crea otra identidad y remapea IDs.
- UI edición con URL recuperable, autosave a ruta separada, revisión de cambios y publicación explícita. Listado único agrega todas las invitaciones. Historial solo lectura y versión visible en informe/lista.

## Risks / Trade-offs

- Huérfano si proceso cae antes de CAS → no aparece en IDs oficiales; no se activa ni usa en invitaciones. No se introduce GC en esta iteración.
- Instancia antigua del servidor → reiniciarla antes de habilitar edición; root conserva preguntas originales pero los servicios nuevos resuelven versiones.
- Conflicto entre guardado/publicación/cierre → filtro status+revision+borrador; 409 conserva edición local.
- Configuraciones extra requieren una lectura → listas proyectan solo metadata; el intento carga su versión por ID y propietario.

## Migration Plan

Sin reescritura de invitaciones: congelación v1 idempotente al abrir edición. Reiniciar servidor actualizado; preservar BD. Rollback a binario anterior después de publicar versiones no es compatible con nuevas invitaciones: conservar versión actual y corregir hacia adelante.

## Open Questions

Ninguna para el alcance autorizado. Datos/decisiones anteriores se conservan, sin reconstruir historial previo inexistente.
