# Screeningroom — Contrato de trabajo

## Contexto y fuentes

Proyecto individual AI4Devs. Stack aprobado: React/Vite/TypeScript, NestJS/Express, MongoDB/Mongoose, npm workspaces. Leer readme.md para orientación; cargar solo los documentos pertinentes al cambio.

- docs/producto.md: reglas funcionales previstas P-01 a P-08.
- docs/backlog.md: historias, tickets y dependencias.
- docs/openapi.yaml: tres operaciones representativas; no es la API completa.
- openspec/changes/: cambios propuestos y su evidencia; openspec/specs/: comportamiento incorporado al cerrar cambios.
- prompts.md: registro del uso real de IA.

## Explore → Plan → Execute → Verify

Antes de un cambio no trivial, comprobar el código y contratos afectados, definir comportamiento esperado y evidencia proporcional. Usar OpenSpec para cambios de capacidades; no generar ceremonias para correcciones triviales.

Distinguir contrato aprobado, comportamiento existente verificado, propuesta y pendiente. Una contradicción no se resuelve ajustando los criterios al código: identificarla y corregir su causa. Si hace falta una nueva decisión de producto, consultarla; resolver autónomamente decisiones técnicas rutinarias dentro del alcance autorizado.

La instrucción del usuario para avanzar autoriza el trabajo acordado. Preservar cambios ajenos y evitar mutaciones destructivas. No agregar requisitos académicos, herramientas o abstracciones que no aporten al cambio. Buscar equivalentes antes de crear helpers; en este proyecto nuevo no exigir precedentes inexistentes.

## Reglas del producto

Preservar P-01 a P-08. Scoring determinista; texto libre sin puntuación ni exclusión por IA; desconocidos no equivalen a cero. Configuración publicada inmutable. Resultado y revisión humana independientes. Envío único con concurrencia controlada.

La IA solo propone preguntas, con revisión del recruiter. No enviar respuestas ni identidades de candidatos. Autorización por ownership; una sesión de candidato pertenece a una sola invitación. Datos ficticios en pruebas. No guardar secretos ni datos personales en código, logs, prompts o navegador.

## Evidencia y continuidad

Ejecutar comprobaciones aplicables; documentar sus resultados y límites reales. No presentar un scaffold como flujo principal completo ni intención como implementación. Actualizar README/prompts.md cuando cambie el estado o el workflow.

Comandos de trabajo: npm run check, npm run smoke, npm run spec:validate. La comprobación de infraestructura no sustituye el E2E del producto.

El harness mínimo local queda sujeto a reconciliación con la configuración canónica anterior que aporte Luis. No trasladar contratos empresariales al proyecto académico.
