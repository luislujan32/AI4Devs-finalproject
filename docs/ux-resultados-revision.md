# Producto y UX del informe y la revisión

3 de octubre de 2026 · revisión de C1–C4 con datos ficticios.

## Problema y modelo de estados

La Entrega 1 separó en P-03/P-05 el resultado calculado de la decisión humana, pero no definió cómo se verían al guardar, regresar a Postulantes o reabrir un informe. Esa falta de contrato de interacción produjo el formulario permanentemente abierto y la decisión invisible en el listado. El criterio de diseño para esta etapa es mostrar siempre tres ejes independientes:

| Eje | Estados | Significado |
| --- | --- | --- |
| Respuestas | Por responder, En curso, Respuestas recibidas | Solo describe la invitación y el envío |
| Resultado de criterios | Cumple, No cumple, Requiere revisión | Cálculo determinista con las reglas publicadas; nunca cambia por una decisión humana |
| Decisión humana | Sin decisión, Continuar, No continuar | Registro interno del recruiter; no mueve etapas externas ni contacta al postulante |

La UI debe conservar los tres ejes en la lista y mostrar los dos últimos en el informe. El listado devuelve solo el resumen mínimo de resultado y revisión, no respuestas ni motivo. El informe conserva evidencia, valor puntuado, peso, exclusión, motivo y fecha.

## Reglas de interpretación y recorrido

- Un valor 0/100 en una pregunta es el valor asignado a esa respuesta, **no** un suspenso por pregunta. El umbral se compara con el promedio ponderado global. Solo un excluyente no aceptado se rotula «requisito excluyente incumplido».
- Las respuestas desconocidas o ausentes no valen cero: si afectan puntuación, el puntaje global queda pendiente. Se destacan junto a los excluyentes sin confirmar.
- El recruiter puede registrar «Continuar» con un resultado negativo o pendiente si explica el motivo. El informe no se recalcula ni se oculta. El resumen de revisión hace visible la discrepancia.
- Antes de decidir se presenta «Sin decisión registrada» y una acción para abrir el formulario. Tras guardar se confirma la decisión específica y el formulario se cierra. Al reabrir se muestra la decisión, motivo y fecha; «Cambiar decisión» abre campos prellenados y «Cancelar» no modifica el registro.
- «Solicitar aclaración» era un estado interno sin mensaje, destinatario ni respuesta. Se retiró de nuevas revisiones y de la API de escritura. Los registros anteriores siguen legibles y explican que no hubo solicitud enviada. Una aclaración real requiere diseñar correo, contenido, autorización, respuesta, plazo y efecto sobre el informe antes de reintroducirse.

## Jerarquía visual

Base neutra y verde oscuro; acentos semánticos discretos: verde para cumplimiento o continuación, terracota para incumplimiento o no continuar, ámbar para información pendiente y azul grisáceo para el valor de una respuesta. Cada acento se acompaña de texto. El resumen del resultado va primero; luego la decisión humana y los factores que requieren atención; finalmente las respuestas completas. Las tarjetas de criterio muestran valor y peso sin inventar un umbral individual.

Esta decisión sigue la guía de [etiquetas de estado de GOV.UK](https://design-system.service.gov.uk/components/tag/) y los [lozenges semánticos de Atlassian](https://atlassian.design/components/lozenge): pocos estados consistentes, con texto y color. La [confirmación de GOV.UK](https://design-system.service.gov.uk/patterns/confirmation-pages/) pide explicar qué ocurrió y qué sigue; la guía [W3C de mensajes de estado](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html) respalda anunciar el guardado sin quitar el foco. [WCAG sobre uso del color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color) impide depender solo del tono. La [vista de scorecards de Greenhouse](https://support.greenhouse.io/hc/en-us/articles/4414777492891-Scorecard-overview) sirve como referencia de separación entre evidencia por criterio y recomendación global; no implica copiar su flujo.

## Criterios de aceptación y siguientes decisiones

Probar con cuentas ficticias: puntaje bajo sin excluyente, excluyente incumplido con puntaje alto, respuesta desconocida, continuación justificada contra el resultado, regreso a lista, recarga, cambio y cancelación, revisión simultánea con conflicto, y registro histórico de aclaración. Comprobar teclado y reflujo a 375 px. No presentar una captura de escritorio como validación móvil.

**Evidencia de esta iteración:** con una base ficticia aislada se observó en navegador la lista con tres ejes, un excluyente incumplido con decisión humana de continuar, un resultado positivo con decisión humana de no continuar, un registro histórico de aclaración, guardado y confirmación de una decisión, vuelta a Postulantes, recarga, edición precargada y cancelación sin guardar. A 375 px efectivos, `scrollWidth` fue 375 px en lista e informe; las tarjetas se apilaron y no hubo desplazamiento horizontal. Aún falta observación con recruiters reales y una auditoría completa de accesibilidad.

Para más de 100 postulantes, el límite actual del listado requiere paginación de servidor antes de añadir filtros o métricas globales. También quedan fuera del MVP el historial completo de revisiones, una solicitud real de aclaración y el movimiento/aviso automático de etapas. Esas capacidades necesitan contrato de producto, privacidad y pruebas propios; no se simulan con etiquetas.
