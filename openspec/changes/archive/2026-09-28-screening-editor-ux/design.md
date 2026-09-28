## Context

T-03 guarda y publica screenings correctamente, pero el editor presenta todas las preguntas y reglas en una página larga. La investigación UX-01 y la petición de Luis piden mejorar acciones, campos y explicaciones. El backend conserva ownership, CAS, validación y publicación inmutable; no se modifica el modelo ni el contrato P-01 a P-08.

## Goals / Non-Goals

**Goals:** reducir desplazamiento y carga cognitiva, hacer visible el estado de guardado, separar contenido de evaluación, facilitar banco/manual, evitar pérdidas accidentales y llevar al error concreto. Verificar escritorio, 375 px, teclado y recarga.

**Non-Goals:** autoguardado continuo, cambios de API/BD, banco personal/compartido, cuestionario real de candidato, scoring nuevo, IA o vista previa que simule el futuro recorrido de candidato.

## Decisions

- Tres secciones locales de presentación: Puesto, Preguntas y Revisión. No son documentos ni estados de servidor; el borrador sigue siendo una sola configuración con `expectedRevision`. Un índice compacto de preguntas selecciona una pregunta activa para editar, con el contenido en primer plano y evaluación en una subsección clara. Esto deja visibles las preguntas sin convertir cada una en un paso modal.
- Las acciones de agregar, quitar y ver ayuda se presentan como controles compactos. Añadir o quitar es una acción y conserva un `<button>` semántico aunque parezca enlace; solo navegación usa enlaces. Área objetivo mínima cómoda para tacto y foco visible. La ayuda esencial es texto junto al campo; la ampliación se abre con `<details>` accesible por teclado/tacto, sin depender de hover.
- Las acciones de guardado/revisión se muestran arriba en una barra persistente. El guardado continúa siendo explícito y condicionado por revisión. El estado «Cambios sin guardar» se mantiene hasta respuesta de API; 409 conserva edición local. Cambiar de sección no guarda ni descarta.
- «Agregar desde banco» filtra por área y texto en las entradas ya devueltas por `/api/question-bank`; la lista inicial cabe en el límite actual de cien. Si el borrador tiene cambios locales, la acción guarda primero con CAS y usa la revisión devuelta para copiar del banco. Ante error o 409 se conserva lo editado localmente y no se añade la entrada. No se hacen escrituras automáticas al teclear.
- Cambiar tipo o quitar pregunta pide confirmación visible cuando borraría contenido/reglas. La decisión se toma antes de mutar el estado local. El editor mantiene la copia del banco aislada y no preaprueba reglas.
- La revisión resume puesto, umbral, preguntas y reglas antes de publicar. Los `issues` del servidor siguen siendo fuente autoritativa; el cliente transforma sus mensajes conocidos en controles que abren la sección/pregunta y enfocan el campo correspondiente. Los mensajes desconocidos permanecen visibles como texto. No se suaviza la validación ni se publica con edición local pendiente.

## Risks / Trade-offs

- Estado de sección/pregunta desaparece al recargar → es solo navegación; la configuración persistida se restaura y se abre una sección útil por defecto.
- Guardar antes de copiar del banco puede fallar → la edición local permanece y la copia no se intenta; si guardó pero falló la copia, mostrar estado guardado y error sin perder la versión confirmada.
- Resumen cliente puede diferir del servidor → llamarlo orientación, no validez final; el servidor conserva decisión de publicación.
- Barra sticky puede tapar controles en móvil/zoom → verificar viewport pequeño, zoom y enfoque; aplicar desplazamiento compensado a destinos.

## Migration Plan

Solo frontend y documentación; no migración de BD. Los borradores/publicados existentes deben abrir con el nuevo editor. Compilar y probar contra base ficticia local, con relectura y dos pestañas para CAS. Revertir esta rama restaura el editor anterior sin transformar datos.

## Open Questions

La ubicación exacta de búsqueda/ayuda y la densidad de las tarjetas deberán contrastarse con recruiters. No bloquear esta primera mejora en espera de tests con personas; documentar como validación posterior.
