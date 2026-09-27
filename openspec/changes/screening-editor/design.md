## Context
Contrato aprobado P-01/P-02/P-04/P-06/P-08 y publicación representativa OpenAPI; existente T-01/T-02 verificado, sin escrituras HTTP de screenings. Luis autorizó continuar con datos ficticios. Banco de quince preguntas preparado y revisión solicitada; no inferir aprobación del silencio.

## Goals / Non-Goals
**Goals:** autoría manual/banco, persistencia, publicación validada/inmutable, copia aislada y UI usable con evidencia real.
**Non-Goals:** IA, invitaciones, candidatos, scoring de respuestas, informes o despliegue.

## Decisions
- Reutilizar Mongoose y guard T-02. Mover consultas existentes a módulo Screenings y añadir POST create, PUT replace-draft, POST publish/copy, GET question-bank y POST questions/from-bank. Ownership siempre desde sesión; ajeno/inexistente/id inválido → mismo 404; sesión/CSRF de T-02.
- Guardado reemplaza solo metadata/configuración permitida, con expectedRevision. Admitir campos incompletos de borrador según schema; rechazar tipos/campos desconocidos/rangos/id duplicado y referencias de banco falsificadas. Validar sin coerción antes del modelo, luego validar documento y escribir con filtro owner/id/draft/revision; un solo ganador por revisión. Campos omitidos se limpian explícitamente. No usar save() sobre documento cargado sin CAS.
- Publicación aplica P-01/P-02/P-08: texto/criterio, opciones estructuradas 2–8 (boolean dos), ids/labels, al menos una puntuable, valores completos 0–100, pesos 1–5, texto no puntuable/excluyente, referencias válidas, excluyente con aceptadas y no aceptadas, umbral 0–100. Requiere confirmConfiguration=true y expectedRevision; actualizar OpenAPI con input específico de publicación, preservando ExpectedRevision usado por otros ejemplos. Confirmación es declaración del recruiter, no un criterio impuesto. Se guarda publishedAt y revision+1 en la misma actualización atómica; no editable después.
- Copiar solo publicado propio; nuevos ids de screening/preguntas/opciones y referencias acceptedOptionIds remapeadas; borrar status publicado/fechas/revisión e invitaciones (no se copian). Banco se copia al borrador desde registro activo validado; reglas arrancan sin score/weight/exclusion, required=false. Edición posterior no altera catálogo.
- Editor local conserva cambios sin guardar, avisa antes de salir mediante control explícito de navegación; guardar/recargar distingue revisión persistida. Conflicto conserva edición local y exige recarga explícita sin sobrescribir. Desde publicado, configuración de solo lectura y acción copiar. Campos number conservan vacío como ausencia, no cero. Confirmación se reinicia tras cualquier cambio/guardado/copia de banco.
- Catálogo inicial JSON con metadata de revisión; CLI explícito rechaza pending y destinos fuera de screeningroom_demo_* antes de escribir. Aprobación humana requerida antes de cargar demo; tests usan su propio catálogo ficticio aislado. Validar las quince entradas/cinco por área y preflight de colisiones; insert-only, repetición conserva documentos ajenos. No auto-seed al arrancar API ni proponer puntajes definitivos.

## Risks / Trade-offs
Schema permite borradores inconsistentes entre campos → validador de publicación independiente y negativos. Escrituras simultáneas → CAS común para editar/publicar/agregar banco; nunca introducir fallback de sobrescritura. Copia de opciones → remapeo probado con excluyentes. UI falsa de banco → consultar BD, estado vacío si no está revisado/cargado; no simular catálogo aprobado. Listado limitado a cien, sin paginación en T-03.

## Migration Plan
Módulo nuevo sin borrar/migrar datos. Campos opcionales existentes; ampliar contrato documental publish aún no consumido externamente. Banco se carga solo tras revisión; publicación no revalida retrospectivamente documentos de fixtures. Mantener ramas T-01/T-02 como dependencias aún pendientes de integración en entrega 2 del fork.

## Open Questions
Aprobación de Luis para catálogo inicial pendiente. No bloquea implementación y pruebas de autoría manual.
