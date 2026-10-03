# Backlog de Screeningroom

[Volver al README](../readme.md). Las historias HU-01, HU-03 y HU-04 y los tres tickets representativos se documentan allí. Este anexo conserva las dos historias adicionales y la planificación completa.

## HU-02 — Obtener sugerencias de IA

**Como** recruiter, **quiero** propuestas relacionadas con el puesto y el área, **para** reducir el trabajo de redacción.

- **Dada** una descripción y un área, **cuando** solicito sugerencias, **entonces** recibo hasta cinco preguntas con criterio y orientación para revisar.
- **Dada** una sugerencia, **cuando** la acepto, **entonces** se agrega al borrador sin puntajes, pesos ni excluyentes aprobados automáticamente; puedo editarla.
- **Dada** una sugerencia rechazada, **cuando** continúo, **entonces** el cuestionario no se modifica.
- **Dado** un fallo del proveedor o salida inválida, **cuando** finaliza la solicitud, **entonces** se comunica el fallo y siguen disponibles edición manual y banco.
- **Dado** un texto con instrucciones maliciosas en la vacante, **cuando** se usa como contexto, **entonces** el generador carece de herramientas y credenciales para publicar o consultar candidatos.

## HU-05 — Registrar revisión humana

**Como** recruiter, **quiero** registrar mi decisión después de leer el informe, **para** conservar el criterio aplicado al candidato.

- **Dado** un informe, **cuando** registro una revisión, **entonces** elijo continuar, no continuar o solicitar aclaración y se guardan autor y fecha.
- **Dado** un resultado distinto de «Supera los criterios», **cuando** decido continuar, **entonces** debo indicar el motivo.
- **Dada** una revisión, **cuando** se guarda o modifica, **entonces** el informe calculado permanece intacto; se conserva la revisión vigente.
- **Dada** una revisión modificada desde otra pestaña, **cuando** guardo una versión anterior, **entonces** recibo conflicto y debo recargar.
- **Dada** una decisión guardada, **cuando** se consulta, **entonces** no se interpreta como una acción ya ejecutada en otro sistema.

## Tickets y dependencias

| Ticket | Resultado | Dependencias de construcción |
| --- | --- | --- |
| T-00 | Monorepo, configuración, tipos, lint y pipeline mínimo | Diseño revisado |
| T-01 | Schemas, índices y fixtures | T-00 |
| T-02 | Login/logout y ownership del recruiter | T-01 |
| T-03 | Editor, reglas, copia, banco y publicación | T-02 |
| T-04 | Sugerencias IA con revisión y recuperación ante error | T-03 |
| T-05 | Invitaciones, código en Mailpit local y sesión de candidato | T-02, T-03 |
| T-06 | Cuestionario, guardado y reanudación | T-03, T-05, T-07 para integración |
| T-07 | API de respuestas, evaluación y envío final | T-01, T-03, T-05 |
| T-08 | Informe y revisión humana | T-07 |
| T-09 | Avisos, retención, borrado y comprobación de accesos | T-05, T-08; controles básicos desde cada ticket |
| T-10 | E2E completo, despliegue, instrucciones y evidencia | T-04, T-06, T-08, T-09 |

T-07 implementa la API de respuestas y evaluación; T-06 consume ese contrato. La interfaz puede avanzar con datos simulados antes de integrar el backend. Las pruebas de cada regla se realizan con su ticket, no se acumulan todas en T-10.

## UX-01 — Mejorar la creación de screenings

Luis señaló que el editor ofrecía una mala experiencia. La [investigación UX/UI del editor](ux-screening-editor-research.md) recoge la inspección, fuentes, decisiones aplicadas y evidencia de navegador. **Primera mejora aprobada por Luis e integrada en `feature/entrega-2-LL`; validación con recruiters pendiente.** No cambia el alcance funcional de T-03 ni el contrato P-01 a P-08.

Próximo paso: observar con recruiters la navegación Puesto/Preguntas/Revisión y la edición de una pregunta activa. Comparar tareas de creación/guardado/publicación en escritorio y móvil con la versión previa; registrar dudas, errores, vueltas atrás y tiempo. Evaluar si hacen falta deshacer, reordenar/duplicar preguntas, vista previa del candidato cuando exista T-06 y mejoras del banco personal/compartido. Conservar ownership, CAS, validación del servidor y publicación inmutable.

## UX-02 — Formulario del postulante

Luis aprobó la primera mejora del editor y pidió aplicar las mismas técnicas de UX/UI al recorrido del postulante (T-06). Esta es una condición de aceptación de ese ticket, no una afirmación de que el formulario ya exista. El diseño debe adaptar los patrones a quien responde: pasos cortos y progreso entendible, texto y opciones legibles, navegación atrás/adelante sin perder respuestas, controles compactos pero cómodos al tacto, etiquetas y foco visibles, ayudas que se abren con toque/teclado y explicaciones esenciales siempre presentes. Debe distinguir «sin responder» de «No puedo confirmarlo», mostrar estado de guardado confirmado por el servidor, conservar lo escrito ante fallo/conflicto, permitir revisión final y explicar que el envío cierra la edición. En móvil se comprobarán 375 px y teclado; en ningún paso se revelarán pesos, puntajes ni reglas excluyentes. Se verificará con cuentas e invitaciones ficticias antes de usar datos reales.

## Ideas posteriores propuestas por Luis (28/09/2026)

- Investigar cómo otras plataformas organizan y configuran sus bancos de preguntas antes de decidir cambios de producto. Esta investigación queda para una etapa posterior; no modifica el contrato P-06 ni el alcance de T-03.
- Permitir que un recruiter guarde una pregunta propia para reutilizarla dentro de la categoría correspondiente. Antes de implementarlo, definir si el banco será personal, compartido o ambos; quién puede publicar/modificar una entrada compartida y cómo evitar duplicados. Copiarla a un screening debe seguir dejando reglas de evaluación sin preaprobar.
- Explorar una categoría de preguntas generales, además de las tres áreas iniciales. Luis mencionó nivel de estudios, licencia de conducir y antecedentes penales como ejemplos para investigar, no como preguntas aprobadas para el banco actual. Definir pertinencia, tipo de respuesta, acceso y tratamiento de esos datos antes de incorporarlos; no convertirlos en filtros o excluyentes universales.

**Criterio de terminado por ticket:** criterios observables satisfechos; control de acceso aplicable; pruebas de riesgos del cambio; tipos/lint sin errores; documentación y registro de IA actualizados cuando cambie el contrato; sin secretos ni datos reales en fixtures.

**Hitos académicos:** entrega 1, 24/09, documentación; entrega 2, 22/10, flujo principal operativo con web/API/BD; final, 12/11, funcionalidades, tests, evidencia y registro de IA.

## Próximo tramo priorizado — revisión del 03/10/2026

1. **T-08 implementado en `feature/recruiter-results-T08-LL`:** el recruiter consulta respuestas/informe, registra revisión humana y puede cerrar un SC publicado sin perder resultados. El cierre impide nuevas invitaciones; las existentes conservan su plazo. [Contrato y evidencia local](resultados-recruiter.md).
2. **Integrar y probar entrega 2:** incorporar de forma ordenada las ramas dependientes T-05, T-06/T-07, UX posterior y T-08 en `feature/entrega-2-LL` del fork; ejecutar el recorrido recruiter → correo → candidato → informe → revisión → cierre con datos ficticios, más móvil de 375 px y fallos recuperables. Verificar CI sobre la rama integrada antes del formulario académico.
3. **T-04 y T-09:** completar sugerencias de preguntas con revisión humana; después cerrar avisos, retención y borrado operativo antes de usar datos reales. El cierre de SC ya está implementado; el borrado anticipado de invitaciones y datos sigue pendiente.
4. **T-10 para entrega final:** pruebas E2E, despliegue, correo real solo cuando estén definidos proveedor/seguridad/privacidad, `prompts.md` y evidencia de funcionamiento.

La [segunda revisión UX](ux-feedback-2026-10-03.md#segunda-prueba-de-luis-mejoras-aplicadas-y-propuestas-pendientes) originó el acceso directo de un uso desde el correo, el informe como vista propia, el guardado automático y reglas más claras de publicación en `feature/review-feedback-LL`. Siguen pendientes los ajustes finos del texto del correo y del recibo, y la verificación móvil a 375 px. La duración de sesión más larga requiere una decisión tras probar de nuevo la corrección de cookies independientes.
