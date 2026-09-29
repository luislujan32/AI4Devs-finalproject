# Aplicación de los checkpoints del máster

[Desarrollo local](desarrollo.md) · [Contrato del proyecto](../AGENTS.md).

## Fuentes y autoridad

Luis aportó el 27/09/2026 trece checkpoints: contexto base de agentes, S3 y su transición, SDD/OpenSpec y módulos 4 a 12. Se revisaron sus principios, conclusiones y secciones pertinentes para este proyecto. Este documento registra su aplicación selectiva; no sustituye los materiales del curso ni afirma una auditoría de todos sus ejercicios y referencias externas.

Las pautas del proyecto final determinan las entregas. README y P-01 a P-08 conservan el contrato de Screeningroom; los cambios OpenSpec explicitan su implementación. Los checkpoints son conocimiento para explorar y decidir. Los ejemplos, restricciones laborales y preferencias históricas de otros proyectos no se convierten automáticamente en instrucciones de este repositorio. La solicitud actual de Luis autoriza avanzar en el fork.

## Aplicación por módulo

| Referencia | Criterio seleccionado | Aplicación en Screeningroom |
| --- | --- | --- |
| Contexto de agentes, S3 y transición | Harness proporcional; global breve; contexto específico bajo demanda | AGENTS enlaza contratos. Skills OpenSpec locales; sin añadir hooks, agentes por rol o workflows laborales |
| SDD/OpenSpec | Verificar la herramienta; change con escenarios; cierre actualiza specs vivas | CLI local fijada, schema spec-driven y config breve. T-00 se archiva con su contrato de infraestructura |
| M4, planificación | Comportamiento observable, límites, supuestos y contraejemplos antes de implementar | Cada cambio refiere tickets y reglas; decisiones de producto pendientes se consultan cuando afectan el cambio |
| M5, documentación | Capturar por qué y qué se comprobó; separar docs, API y operación | README orienta, producto conserva reglas, diseño OpenSpec registra decisiones, desarrollo registra comandos y límites |
| M6, privacidad | Datos mínimos, autoridad limitada, contenido externo no confiable | Fixtures ficticios. IA solo sugiere preguntas, sin acceso a candidatos ni publicación; revisar proveedor cuando se implemente T-04 |
| M7, testing | Criterio derivado del contrato; prueba verde no basta; evidencia proporcional | Ejemplos independientes del scoring, negativos de acceso y pruebas reales de persistencia en sus tickets; no imponer TDD o cobertura arbitraria |
| M8, BD | Identidad, ownership, lifecycle, fuente de verdad y frontera atómica antes del schema | T-01 distingue configuración publicada, intento, informe y revisión; índices de unicidad/retención y validación real en MongoDB |
| M9, backend | Separar contrato, existente, propuesta y pendiente; refactor conserva comportamiento | Diseño explica procedencia de las decisiones. Revisión comprueba cumplimiento funcional y calidad por separado |
| M10, frontend | Compilar, interactuar, persistir y verse bien requieren evidencias diferentes | En T-03/T-06/T-08 comprobar estados de carga/error, teclado y móvil; recargar para acreditar persistencia |
| M11, evidencia integrada | La prueba atraviesa las fronteras de lo que se afirma; modelar estados si ayuda | Envío único/concurrente y publicación requieren casos de transición; T-10 prueba recruiter → candidato → informe con BD real |
| M12, RAG | Elegir fuentes y garantías antes de componentes; no forzar recuperación vectorial | P-07 usa hasta cinco entradas del banco por área. Este alcance no requiere RAG ni vector DB. En T-04 evaluar salida, fallo y contenido malicioso |

No se incorporan tecnologías para demostrar que se estudió un módulo. Si una herramienta concreta pasa a ser necesaria, se verifica su documentación vigente y se justifica en el cambio pertinente.

## Contrato, evidencia y estado

Antes de un cambio no trivial: leer el contrato pertinente y código existente, explicar la diferencia esperada, buscar casos que puedan romperla y definir evidencia suficiente. Un supuesto que cambia una regla del producto queda como pregunta; una decisión técnica rutinaria dentro del alcance puede resolverse y documentarse.

La evidencia debe cubrir las fronteras de la afirmación: cálculo puro puede probarse sin navegador; guardado debe atravesar API/BD y releerse; interacción requiere ejecución de UI; apariencia exige inspección visual. Si algo falla, diagnosticar mecanismo, entorno, contrato o implementación antes de cambiar assertions. No reducir exigencias para lograr verde.

En persistencia, declarar qué es fuente de verdad, snapshot o derivado, quién escribe cada dato y qué debe ocurrir junto. Cuando existan datos que preservar, separar estado final y transición. No afirmar propiedades de datos o mejoras de rendimiento sin medirlas.

| Ticket o etapa | Evidencia prevista o disponible | Estado al 27/09 |
| --- | --- | --- |
| T-00 | Instalación limpia; tipos/lint/build; HTTP y MongoDB reales; pantalla, caída y recuperación local | Verificado localmente. No es flujo de producto ni despliegue público |
| T-01 | Casos de schema e índices en MongoDB aislado; restricciones de duplicados, ownership y CAS; fixtures repetibles | Implementado y verificado localmente; no es auth HTTP ni publicación completa |
| T-02 | Trece pruebas HTTP/MongoDB de login, sesiones, ownership, CSRF y límites; navegador escritorio/móvil y teclado | Implementado y verificado localmente con cuentas ficticias; integración pendiente |
| T-05 | Cinco pruebas HTTP/MongoDB/Mailpit: propiedad, OTP, límites, concurrencia y revocación; navegador ficticio | Implementado en rama de tarea; móvil visual pendiente |
| T-03 | Catorce pruebas HTTP/MongoDB de autoría/catálogo; navegador, recarga, conflicto, móvil y copia; carga repetida del banco aprobado | Implementado y verificado localmente; integración hacia entrega 2 pendiente |
| T-07/T-08 | Cálculo P-01–P-08, concurrencia de envío/revisión y persistencia | Pendiente |
| T-04 | Salida estructurada válida, ausencia de datos de candidatos, fallo recuperable y edición manual | Pendiente |
| T-06 | Responder, guardar, salir y reanudar; validación requerida, errores y envío en navegador | Pendiente |
| T-09/T-10 | Accesos, expiración/borrado, E2E principal, despliegue e instrucciones reproducibles | Pendiente |

## Ramas y cierre

El trabajo se publica en el fork de Luis. Entrega 1 conserva su contenido documental; entrega 2 integra los siguientes cambios. Una rama de trabajo puede borrarse después de fusionarla si no es la rama estable de la entrega. Antes de un PR comprobar repositorio, base y head; los PRs de desarrollo se fusionan hacia entrega 2.

T-00 fue aprobado en el PR 1 del fork con base entrega 1. Se preservó todo su código en entrega 2 y se revirtió solo en entrega 1, sin reescribir historial. Su contenido documental volvió a coincidir con la versión posterior a las correcciones de CodeRabbit. No fusionar ese revert hacia entrega 2. No se realizaron publicaciones en el repositorio académico.

Un cambio terminado se valida y archiva mediante la CLI con sincronización de sus deltas. Las tareas se marcan solo con evidencia; README/prompts registran resultados reales. El archivo de una especificación no convierte funcionalidades pendientes en implementadas ni acredita ejecución remota de CI.
