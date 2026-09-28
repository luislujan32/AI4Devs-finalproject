# Screeningroom — Contrato de trabajo

## Contexto y fuentes

Proyecto individual AI4Devs. Stack aprobado: React/Vite/TypeScript, NestJS/Express, MongoDB/Mongoose, npm workspaces. Leer readme.md para orientación; cargar solo los documentos pertinentes al cambio.

- docs/producto.md: reglas funcionales previstas P-01 a P-08.
- docs/backlog.md: historias, tickets y dependencias.
- docs/openapi.yaml: tres operaciones representativas; no es la API completa.
- openspec/changes/: cambios propuestos y su evidencia; openspec/specs/: comportamiento incorporado al cerrar cambios.
- prompts.md: registro del uso real de IA.
- docs/harness.md: aplicación selectiva de los checkpoints del máster y evidencia por ticket.
- docs/datos.md: semántica de persistencia, fixtures y límites de T-01.
- docs/acceso.md: sesiones, cuentas ficticias, rutas implementadas y límites de T-02.
- docs/screenings.md: autoría, publicación, CAS y banco inicial revisado de T-03.
- docs/ux-screening-editor-research.md: diagnóstico, fuentes y primera mejora implementada del editor del recruiter.

## Repositorio y ramas

Trabajar y publicar únicamente en el fork luislujan32/AI4Devs-finalproject. El usuario prohíbe commits o publicaciones en LIDR-academy/AI4Devs-finalproject. Verificar remoto, rama y destino antes de publicar.

feature/entrega-1-LL conserva la entrega documental. feature/entrega-2-LL integra el desarrollo. Los PRs de desarrollo del fork deben apuntar a feature/entrega-2-LL; no usar entrega 1 como base. No fusionar su revert de T-00 en entrega 2. La entrega académica por PR/formulario es una acción distinta, que se acordará con Luis.

## Explore → Plan → Execute → Verify

Antes de un cambio no trivial, comprobar el código y contratos afectados, definir comportamiento esperado y evidencia proporcional. Usar OpenSpec para cambios de capacidades; no generar ceremonias para correcciones triviales.

Distinguir contrato aprobado, comportamiento existente verificado, propuesta y pendiente. Una contradicción no se resuelve ajustando los criterios al código: identificarla y corregir su causa. Si hace falta una nueva decisión de producto, consultarla; resolver autónomamente decisiones técnicas rutinarias dentro del alcance autorizado.

La instrucción del usuario para avanzar autoriza el trabajo acordado. Preservar cambios ajenos y evitar mutaciones destructivas. No agregar requisitos académicos, herramientas o abstracciones que no aporten al cambio. Buscar equivalentes antes de crear helpers; en este proyecto nuevo no exigir precedentes inexistentes.

## Reglas del producto

Preservar P-01 a P-08. Scoring determinista; texto libre sin puntuación ni exclusión por IA; desconocidos no equivalen a cero. Configuración publicada inmutable. Resultado y revisión humana independientes. Envío único con concurrencia controlada.

La IA solo propone preguntas, con revisión del recruiter. No enviar respuestas ni identidades de candidatos. Autorización por ownership; una sesión de candidato pertenece a una sola invitación. Datos ficticios en pruebas. No guardar secretos ni datos personales en código, logs, prompts o navegador.

El formulario del candidato debe aplicar los criterios de UX ya adoptados para el recruiter: pasos comprensibles, navegación y progreso visibles, campos claros, ayuda esencial a la vista y ampliación accesible sin hover, acciones compactas con semántica correcta, foco/teclado/tacto y diseño móvil. Mostrar guardado solo tras confirmación del servidor, conservar edición visible ante errores o conflictos, permitir revisar antes de enviar y explicar con precisión el efecto irreversible del envío. No exponer puntajes, pesos ni excluyentes al candidato.

## Evidencia y continuidad

Ejecutar comprobaciones aplicables; documentar sus resultados y límites reales. No presentar un scaffold como flujo principal completo ni intención como implementación. Actualizar README/prompts.md cuando cambie el estado o el workflow.

Comandos de trabajo: npm run check, npm run test:persistence, npm run test:auth, npm run test:screenings, npm run smoke, npm run spec:validate. La comprobación de infraestructura o persistencia no sustituye el E2E del producto.

Los checkpoints aportados se reconciliaron como conocimiento de referencia en docs/harness.md. No trasladar contratos empresariales al proyecto académico ni convertir recomendaciones pedagógicas en nuevos requisitos. La autorización actual del usuario para avanzar prevalece sobre gates históricos de otros proyectos.
