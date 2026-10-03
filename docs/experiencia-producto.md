# Criterio de experiencia para Screeningroom

3 de octubre de 2026. Complementa las reglas funcionales [P-01 a P-08](producto.md); no cambia su fórmula ni extiende por sí mismo el alcance de la Entrega 2.

## Qué faltaba

La Entrega 1 definió entidades y reglas, pero dejó implícitas transiciones visibles: qué muestra una pantalla al guardar, al volver, al recargar, ante un error o al modificar una decisión. Esas omisiones obligaron a Luis a detectar detalles de producto durante pruebas manuales. Desde esta revisión, cada capacidad nueva debe describir **acción, efecto real, estado persistido y estado que verá la persona después** antes de implementarse. No se trasladarán a Luis decisiones rutinarias de etiqueta, jerarquía o feedback.

## Recorridos y responsabilidades

| Recorrido | Estado actual | Regla de experiencia para próximos cambios |
| --- | --- | --- |
| Crear screening | Borrador con autoguardado, revisión y publicación | Mostrar persistencia confirmada, qué falta para publicar y consecuencias de congelar la configuración |
| Invitar | Correo ficticio con enlace directo y enlace compartido verificado | Mostrar envío y estado por persona; no llamar «enviado» a un intento fallido ni mezclar invitación con configuración |
| Responder | Pasos, avance, guardado, revisión y envío único | Preservar lo escrito, distinguir omisión de desconocido, explicar cuándo se pierde la edición |
| Evaluar y decidir | Informe determinista y decisión humana interna | Separar recepción, resultado y decisión; explicar discrepancias y conservar el estado al volver o recargar |
| Cerrar screening | Impide invitaciones nuevas, conserva intentos previos y resultados | Explicar el efecto antes de cerrar y mostrar el estado cerrado sin eliminar acceso a evidencias |

## Lista de comprobación de diseño por capacidad

1. Definir estados vacíos, en curso, completos, con error y de regreso a la vista; distinguir lo que el sistema **registra** de lo que realmente **envía o ejecuta**.
2. Dibujar la jerarquía de información antes del código: dato principal, estado, explicación y siguiente acción. Usar color semántico sobrio acompañado de texto; no convertir estados en botones.
3. Resolver el recorrido de extremo a extremo con datos ficticios: acción → confirmación concreta → lista → reapertura → edición/cancelación. Comprobar qué ve la otra persona solo si el producto comunica algo.
4. Verificar teclado, foco, ayudas sin depender de hover, contraste y reflujo a 375 px. Registrar cualquier comprobación no ejecutada como pendiente, no como aprobada.
5. Revisar contrato y permisos del servidor con casos límite: concurrencia, ausencia de datos, publicación/retención, sesión vencida y más registros de los que cabe mostrar.

El agente de producto debe cuestionar promesas implícitas y estados imposibles; el de UX debe revisar jerarquía, lenguaje, accesibilidad y retorno. Ambos contrastan sus hallazgos con los contratos existentes. La implementación y las pruebas se completan antes de pedirle a Luis una revisión; su intervención se reserva para decisiones estratégicas como comunicaciones reales con candidatos, tratamiento de datos reales o integración con un ATS externo. La [revisión específica de resultados](ux-resultados-revision.md) muestra cómo aplicar este criterio.

## Prioridad de continuidad

Para Entrega 2: integrar y comprobar el flujo actual en `feature/entrega-2-LL`, incluida la revisión móvil y errores recuperables. Después, paginar Postulantes (hoy se consultan como máximo 100 por SC) antes de añadir filtros o métricas globales. Para una etapa posterior: historial completo de decisiones, solicitud real de aclaración, canales de correo externos e integración de etapas; cada uno requiere un efecto verificable, no una etiqueta que lo simule.
