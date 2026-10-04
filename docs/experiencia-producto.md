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

## Protocolo de revisión por roles — 04/10/2026

Para cambios que crucen pantallas o alteren la tarea principal del recruiter, el agente principal prepara un encargo común: objetivo de la persona, capturas como **observaciones** (no requisitos por sí solas), contrato aprobado, comportamiento verificado en código, límites académicos y preguntas abiertas. Los revisores trabajan inicialmente en modo lectura y devuelven hechos con ruta, inferencias separadas, fuentes primarias enlazadas, alternativas, recomendación y criterios observables. Una fuente de diseño describe un patrón posible; no demuestra que ya funcione con nuestros usuarios.

| Revisor | Pregunta principal | Salida necesaria |
| --- | --- | --- |
| Producto | ¿Qué tarea, estado y efecto real representa cada acción? ¿Se promete algo que el sistema no hace? | Mapa de recorrido, estados y transiciones; alcance MVP, alternativas y decisiones estratégicas. |
| UX/UI | ¿Cómo encuentra, comprende y completa la tarea una persona, también en móvil y con teclado? | Arquitectura de información, jerarquía, lenguaje, patrón de lista/detalle, estados vacíos/error/éxito y comprobaciones de accesibilidad. |
| Viabilidad técnica, bajo demanda | ¿El cambio afecta una versión publicada, respuestas, ownership, concurrencia o listas grandes? | Invariantes, fuente de verdad, efecto en datos/API, migración si aplica y pruebas de borde. |

El agente principal contrasta los informes entre sí y con el código; no suma recomendaciones incompatibles ni delega la decisión final. Antes de implementar deja una propuesta única que indica: quién hace qué; qué cambia y qué permanece; dónde queda guardado; qué se ve después de volver, recargar o fallar; comportamiento con 0, 1 y más de 100 registros cuando corresponda; y evidencia que demostraría el resultado. Solo una elección estratégica se eleva a Luis. Los cambios menores de color, alineación, texto o espaciado se resuelven dentro del sistema visual ya acordado.

Los roles se convocan por necesidad, no como pasos obligatorios de todo ticket. La auditoría [C1–C6 del espacio recruiter](ux-workspace-audit-2026-10-04.md) necesitó producto y UX, más una revisión técnica puntual porque se propuso editar publicados y mostrar filtros/conteos sobre listados truncados. No hace falta un cuarto rol permanente por ahora: primero hay que aplicar y evaluar este protocolo.

## Prioridad de continuidad

Para Entrega 2: integrar y comprobar el flujo actual en `feature/entrega-2-LL`, incluida la revisión móvil y errores recuperables. Después, paginar Postulantes (hoy se consultan como máximo 100 por SC) antes de añadir filtros o métricas globales. Para una etapa posterior: historial completo de decisiones, solicitud real de aclaración, canales de correo externos e integración de etapas; cada uno requiere un efecto verificable, no una etiqueta que lo simule.
