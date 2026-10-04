# Registro de uso de IA — Screeningroom

**Autor:** Luis Lujan (LL). **Etapas:** entrega 1 documental y desarrollo de entrega 2. **Actualización:** 4 de octubre de 2026.

Este registro documenta cómo se utilizó la IA y qué decisiones tomó el autor. Los workflows son resúmenes del trabajo real; solo los fragmentos expresamente marcados como literales reproducen instrucciones de la conversación. No se inventan prompts de implementación ni resultados de pruebas de una aplicación aún no desarrollada.

Los apartados 1–7 conservan el registro histórico de la entrega 1. El trabajo local posterior se registra en los workflows de entrega 2 al final del documento. Cada workflow describe el estado de ese momento; los posteriores registran sus resoluciones.

## Herramientas y alcance

| Herramienta o recurso | Uso efectivo en la etapa documental |
| --- | --- |
| ChatGPT, conversación y modo Work | Análisis de pautas, alternativas, reglas, historias y documentación |
| Entorno de ejecución del asistente | Preparación de Markdown, YAML y wireframes; comprobaciones documentales locales |
| Conexión con GitHub | Lectura de plantilla/fork y preparación de la documentación versionada |
| Documentación oficial | Contraste de las opciones de React, NestJS, MongoDB, npm y controles de acceso |
| Checkpoints del máster | Planificación verificable, documentación proporcional, límites de IA y manejo de datos |

**Modelos:** la identificación exacta de los modelos empleados en las conversaciones no quedó registrada de forma verificable; no se atribuyen nombres por inferencia. En las siguientes fases se anotará el modelo visible cuando esté disponible.

**Skills y agentes:** se utilizó la habilidad de gestión de archivos de Work para conservar borradores y anexos. No se utilizaron subagentes, comandos personalizados ni un harness propio instalado en este repositorio. Codex está previsto como apoyo para la implementación; no se afirma haber ejecutado el proyecto en la máquina del autor.

## 1. Descripción general del producto

### Workflow 1 — Acotar el MVP

**Entrada:** pautas académicas, necesidad de un screening independiente y alternativas de experiencia del candidato.

**Trabajo con IA:** comparar el recorrido web con opciones como mensajería, audio y lectura de CV; describir actores, valor, alcance y cinco capacidades principales.

**Intervención humana:** el autor priorizó un producto sencillo de usar, confirmó que todo el cuestionario debe poder completarse y que el recruiter toma la decisión final. Eligió el nombre Screeningroom y aportó su repositorio.

**Resultado:** [README, producto](readme.md#1-descripción-general-del-producto).

### Workflow 2 — Refinar pesos y excluyentes

**Fragmento literal del autor:**

> el postulante debe responder todo y luego el reclutador con el informe en la mano decide

**Trabajo con IA:** separar puntuación ponderada, incumplimiento excluyente, faltantes y revisión humana; concretar tipos de respuesta, escala, umbral y ejemplos.

**Intervención humana:** incorporación de pesos y preguntas excluyentes al MVP; conservar fortalezas declaradas aunque un requisito no se cumpla; permitir continuar con justificación. El autor delegó el refinamiento P-01 a P-08.

**Resultado:** [Contrato funcional](docs/producto.md). El cálculo es determinista; la IA no decide si un candidato supera el screening.

## 2. Arquitectura del sistema

### Workflow 1 — Elegir una estructura proporcionada

**Fragmento literal del autor:**

> NO hacer sobreingenieria aqui.

**Contexto:** acceso del recruiter y validación del postulante sin cuenta. El autor propuso un stack web con React, framework backend, monorepo y MongoDB como posibilidad.

**Trabajo con IA:** comparar opciones y elegir React + Vite + TypeScript, NestJS y MongoDB/Mongoose; definir un monolito modular con una única unidad de despliegue. Consultar documentación oficial y justificar el encaje con el producto.

**Resultado:** [Arquitectura](readme.md#2-arquitectura-del-sistema), con componentes, costes de la elección y estructura prevista.

### Workflow 2 — Delimitar acceso y manejo de datos

**Trabajo con IA:** proponer sesión del recruiter, códigos de un solo uso para candidatos, ownership, límites de solicitudes, minimización, retención y borrado. Distinguir control del buzón de certificación de identidad.

**Intervención humana:** requisito de validación sencilla para candidatos y referencia al módulo de ética. La generación de preguntas usa contexto del puesto, sin identidades ni respuestas de candidatos.

**Resultado:** flujo de acceso y [seguridad prevista](readme.md#25-seguridad). Son decisiones de diseño, no controles ya implantados ni una certificación legal.

### Workflow 3 — Planear verificación y despliegue

**Trabajo con IA:** definir pruebas unitarias del cálculo, integración con persistencia, componentes y un E2E del recorrido principal; describir infraestructura y despliegue futuro. Preparar bocetos de configuración, cuestionario e informe.

**Resultado:** [infraestructura](readme.md#24-infraestructura-y-despliegue), [tests previstos](readme.md#26-tests) y [wireframes](docs/wireframes.svg). Los bocetos son ilustraciones, no capturas de software ejecutado.

## 3. Modelo de datos

### Workflow 1 — Modelar configuración, intento y revisión

**Trabajo con IA:** distinguir usuario recruiter, screening, banco, invitación y sesión; elegir preguntas embebidas y un intento con respuestas/informe/revisión; explicitar ownership, restricciones, índices y conservación.

**Criterio humano aplicado:** conservar las reglas de cada screening publicado y separar el resultado calculado de la decisión del recruiter.

**Resultado:** [modelo de datos](readme.md#3-modelo-de-datos). La decisión de inmutabilidad evita construir un sistema complejo de versionado para el MVP.

## 4. Especificación de la API

### Workflow 1 — Seleccionar operaciones representativas

**Trabajo con IA:** describir publicación, envío final y consulta del informe en OpenAPI 3.0.3; definir actores, errores, revisión de concurrencia y respuesta idempotente al repetir un envío.

**Revisión:** limitar la entrega a tres operaciones representativas como pide la plantilla; reconocer que la implementación tendrá endpoints adicionales. El candidato no recibe el informe interno ni la configuración de scoring.

**Resultado:** [OpenAPI](docs/openapi.yaml).

## 5. Historias de usuario

### Workflow 1 — Traducir capacidades en aceptación observable

**Trabajo con IA:** redactar cinco historias y criterios Dado/Cuando/Entonces; relacionarlos con pesos, exclusiones, faltantes, acceso, reanudación e informe.

**Intervención humana:** confirmar el alcance general y delegar el equilibrio del primer MVP. Se destacan tres historias en el README y se conservan las otras dos en el backlog.

**Resultado:** [historias principales](readme.md#5-historias-de-usuario) y [historias adicionales](docs/backlog.md).

## 6. Tickets de trabajo

### Workflow 1 — Desglosar el trabajo

**Trabajo con IA:** organizar once tickets, identificar dependencias y detallar los tres ejemplos de datos, backend y frontend. Separar la API de respuestas/evaluación de su interfaz para evitar dependencias circulares.

**Revisión humana:** el autor pidió incluir más de tres tickets si aportaban utilidad. Se mantiene un backlog ampliado sin confundirlo con requisitos académicos adicionales.

**Resultado:** [tickets representativos](readme.md#6-tickets-de-trabajo) y [backlog](docs/backlog.md#tickets-y-dependencias).

## 7. Preparación de la entrega y pull requests

### Workflow 1 — Contrastar requisitos y preparar los archivos

**Trabajo con IA:** releer las pautas, consultar la plantilla oficial y el estado del fork; convertir el borrador en documentación de entrega, conservar su alcance y revisar enlaces, encabezados, reglas y estructura del contrato.

**Intervención humana:** confirmación de las iniciales LL y autorización explícita para modificar el fork y preparar la entrega. El trabajo se realiza desde Work/GitHub, sin acceso directo al clon del Mac del autor.

**Evidencia:** los cambios de documentación se versionan en `feature/entrega-1-LL`. Los PRs de implementación y sus verificaciones se registrarán cuando existan. El formulario académico es un paso separado de la preparación del repositorio.

## Qué se registrará durante el desarrollo

Por cada fase se añadirán las herramientas y modelos identificables, hasta tres prompts o workflows representativos, resultados relevantes, correcciones humanas y evidencia de verificación. No se requiere volcar todas las conversaciones ni conservar datos personales o secretos en este archivo.

## Entrega 2 — Workflow 1: base conectada y contrato de trabajo

**Entrada:** los tres textos del máster aportados por el autor, documentación de entrega 1 con las correcciones de CodeRabbit y autorización para avanzar pidiendo información faltante. Se distingue T-00 del requisito académico de un flujo principal operativo.

**Herramientas usadas:** Codex en el Mac, Git, OpenSpec 1.4.1 y sus skills locales de propuesta/aplicación, documentación oficial de Codex/Node/Vite/NestJS, npm, Docker Compose con OrbStack y navegador integrado para comprobar la interfaz.

**Modelo:** el nombre exacto del modelo seleccionado no se verificó en la interfaz; no se inventa una identificación. Los workflows anteriores describen la etapa documental desde Work; este apartado registra el trabajo local posterior.

**Trabajo con IA:** preparar propuesta, diseño, escenarios y tareas de bootstrap-workspace; construir npm workspaces React/NestJS, conexión real a MongoDB, frontend compilado servido por API y readiness; fijar runtime/dependencias e imágenes; agregar lint/tipos/build y comprobación de integración aislada; documentar comandos y límites. AGENTS.md adapta principios generales de Explore/Plan/Execute y evidencia, sin trasladar contratos empresariales. La configuración exacta del harness canónico anterior sigue pendiente de la información solicitada al autor.

**Intervención humana:** el autor priorizó respetar las pautas de entrega 2 y autorizó avanzar con OpenSpec. No se usaron subagentes, orquestación personalizada ni IA de producto; las funcionalidades y elección de proveedor siguen pendientes.

**Correcciones durante la ejecución:** fijar TypeScript 5.9 compatible con el analizador de lint consultado; diferenciar cancelación al desmontar la interfaz y timeout para que un fallo no deje el estado «Comprobando»; restaurar siempre servicios tras la prueba de caída; comprobar que el fallback SPA no sustituya errores API.

**Evidencia local:** instalación npm ci y checks desde una copia limpia; tipos, lint, build y OpenSpec estrictos; readiness HTTP 200 con MongoDB real; frontend compilado y recursos; 404 JSON de una ruta API inexistente; escritura recuperada tras reconexión en una base de prueba aislada y limpiada al terminar; contrato 503 con conexión aislada. Además se pausó el MongoDB local propio, se verificó 503 por HTTP y estado de fallo en navegador, se restauró y se recuperó con reintento. npm no reportó vulnerabilidades en la instalación. La configuración CI se incorpora; solo se afirmará ejecución remota cuando exista evidencia.

**Límites:** todavía no hay autenticación, screenings, banco, códigos, respuestas, evaluación ni informes. Estas comprobaciones no acreditan el flujo principal de la entrega 2 ni el E2E final. No se hizo despliegue público ni se contrataron servicios.


## Entrega 2 — Workflow 2: reconciliar checkpoints y separar ramas

**Entrada:** el autor aportó el directorio con trece checkpoints del máster, confirmó haber fusionado el PR 1 del fork y eliminado su rama, y autorizó commits en su fork prohibiéndolos en el repositorio académico.

**Trabajo con IA:** verificar metadatos del PR y árboles Git; recuperar entrega 2 con el código íntegro; revertir T-00 solo en entrega 1 para preservar su entrega documental, sin reescribir historial. Leer principios, conclusiones y secciones pertinentes de los checkpoints; adaptar planificación, documentación, privacidad, persistencia y evidencia al alcance de Screeningroom. Incorporar la restricción de publicación y base de PR en AGENTS/config/guía.

**OpenSpec:** validar y archivar bootstrap-workspace mediante la CLI, sincronizando cuatro requisitos a workspace-runtime. Preparar propuesta, diseño, escenarios y tareas de persist-domain-model (T-01); sus diez tareas siguen abiertas y no se afirma implementación de negocio.

**Validación ejecutada:** comparación exacta del árbol restaurado de entrega 1 con c2fc032; comparación del código preservado en entrega 2 con T-00 fusionado; consulta confirmó que el PR académico vuelve a mostrar seis archivos. La validación estricta OpenSpec pasó para la spec viva y el siguiente cambio; git diff --check sin errores. Las pruebas de runtime del workflow anterior conservan su evidencia histórica; no se presentan como nuevas ejecuciones ni como CI remoto.

**Decisiones humanas y límites:** directorio de referencia y restricción del fork aportados por Luis. Los checkpoints se tratan como conocimiento, sin trasladar contratos de otros proyectos o introducir herramientas por requisito pedagógico. No se usaron subagentes. No se publicaron commits, PRs ni comentarios en el repositorio académico; su PR existente refleja automáticamente los cambios de su rama fuente en el fork. La reconciliación de principios resuelve la consulta del workflow anterior; no afirma auditar una instalación completa de harness laboral.


## Entrega 2 — Workflow 3: implementar persistencia T-01

**Entrada:** Luis pidió continuar tras separar las ramas y reconciliar checkpoints. Se aplicó persist-domain-model siguiendo propuesta, diseño y escenarios existentes, en feature/persistencia-T01-LL creada desde entrega 2 del fork.

**Trabajo con IA:** definir cinco schemas Mongoose y objetos embebidos; registrar modelos en NestJS; esperar inicialización de índices; implementar consulta por propietario, creación de invitaciones sobre screenings publicados propios y guardado condicionado de preguntas de borrador; añadir fixtures insert-only y pruebas con Node test runner/MongoDB real, sin dependencias nuevas.

**Corrección durante el trabajo:** al contrastar el informe con OpenAPI se ajustó Evidence a status/source/answerText y campos numéricos nullable; no se conservó el formato de Answer como un contrato alternativo de evidencia. Se aclaró ese formato en el README y diseño. Se corrigieron tipos literales de TypeScript al compilar, sin debilitar validaciones.

**Evidencia ejecutada:** npm run check pasó (tipos, lint, build y OpenSpec); catorce pruebas de persistencia pasaron con MongoDB real, incluidos duplicados, ownership, CAS con dos escritores, límites, evidencia declarada, informe/revisión, sesiones y TTL. El comando real de fixtures se ejecutó dos veces dentro del test y conservó datos ajenos. npm run smoke volvió a pasar tras registrar modelos y esperar índices. Los tests usan una BD aleatoria y limpian solo esa BD.

**Entorno y límites:** la primera prueba recibió EPERM al conectar desde el sandbox; se ejecutó con acceso autorizado al MongoDB local y pasó. No se relajaron assertions ni se sustituyó la BD por un mock. No hubo rechazo de aprobación automática. No se afirma ejecución remota de CI, login, envío SMTP/OTP, publicación completa, algoritmo de evaluación, E2E del flujo principal ni despliegue. El usuario de fixtures está inactivo y sin credencial utilizable; no se solicita una contraseña por chat.

**Control humano:** Luis autorizó continuar y limitó las publicaciones al fork. Se consultó su preferencia de cuenta inicial para T-02; no bloquea persistencia. No se usaron subagentes ni datos reales. Herramientas: Codex desktop, skill local openspec-apply-change, CLI OpenSpec, Git, npm, Node/Mongoose y documentación oficial NestJS/Mongoose. No se atribuye un modelo exacto no verificado.


## Entrega 2 — Workflow 4: acceso del recruiter T-02

**Entrada y control humano:** Luis eligió cuentas ficticias para desarrollar y pospuso pruebas con cuentas reales. Se continuó recruiter-access en feature/acceso-T02-LL desde T-01 validado, pendiente de integración en entrega 2. Sin contraseñas por chat, datos reales ni subagentes.

**Trabajo con IA:** propuesta, diseño y escenarios OpenSpec; provisioning explícito de dos cuentas ficticias con Argon2id, sesiones opacas almacenadas como HMAC, cookie HttpOnly/SameSite, expiración absoluta de ocho horas, rotación/logout, CSRF/origen en login y mutaciones, límites atómicos persistentes por IP/correo y guard reutilizable. Interfaz de acceso/listado propio con carga, vacío, errores y logout. No se construyeron editor, publicación, OTP o informes.

**Correcciones y decisiones:** comparación CSRF por longitud en bytes antes de timingSafeEqual para evitar excepciones con Unicode; colección técnica de límites sin identificadores en claro; fixtures T-01 siguen inactivos y separados de las cuentas de demo; provisioning no sobreescribe identidades existentes; errores del CLI son genéricos para no volcar documentos/credenciales. Se normalizaron también los errores de conexión/JSON del login para mostrar mensajes propios en español. Argon2id/cookies tienen versiones exactas y lockfile; se consultaron las guías oficiales OWASP de passwords, sesiones y CSRF.

**Evidencia ejecutada:** tipos, lint, build y OpenSpec estrictos; trece pruebas con HTTP/API y MongoDB real, incluidas dos cuentas, negativos, expiración previa a TTL, inactivación/principal candidato, rotación, logout, reinicio, prelogin vencido/firma incorrecta y límites por correo/IP. Catorce pruebas de persistencia y smoke siguen pasando. Comando demo repetido conserva credenciales/datos. Navegador real: contraseña incorrecta, acceso/listados A/B, recarga, logout, campos limpios, Tab/Enter y diseño móvil de 375 × 812 sin desbordamiento. Fallo de conexión al detener temporalmente la API propia y recuperación mediante reintento tras restaurarla. Las contraseñas se leyeron directamente en memoria para la prueba local sin imprimirlas; archivos .local ignorados con modo 0600.

**Herramientas y límites:** Codex desktop, skills locales OpenSpec de propuesta/aplicación/archivo y CLI, Node test runner, MongoDB local, npm/Git y navegador integrado. No se inventa un nombre de modelo seleccionado. npm no reportó vulnerabilidades al instalar dependencias. Se configuró CI con el test de acceso, sin atribuir ejecución remota. Cookie Secure/configuración HTTPS se comprobó sin despliegue TLS. El listado se limita a cien entradas; no hay paginación, registro público ni recuperación de contraseña. No equivale al E2E principal ni a entrega 2 completa. Publicación únicamente en el fork; T-01/T-02 siguen pendientes de integración hacia entrega 2.


## Entrega 2 — Workflow 5: autoría y publicación T-03

**Entrada y control humano:** Luis pidió continuar, manteniendo cuentas ficticias y publicaciones solo en su fork. Se leyó producto/backlog/API y código T-01/T-02, se creó screening-editor mediante OpenSpec y se implementó en feature/screenings-T03-LL desde T-02. P-06 exige preguntas revisadas por el autor antes de carga: se prepararon quince propuestas sin puntajes/excluyentes y se solicitó revisión mediante pregunta asíncrona. No se infirió aprobación del silencio. El 28/09 Luis confirmó las opciones como banco inicial y se registraron autor/fecha antes de cargarlo.

**Trabajo con IA:** validar formas/rangos sin coerción, separar borrador incompleto de reglas de publicación; extraer consultas T-02 a módulo Screenings; crear/guardar/publicar/copiar y banco/copia mediante guard, ownership y CAS; interfaz React con metadata, preguntas/opciones, configuración y confirmación explícita, lectura protegida, navegación con aviso y recuperación de conflictos. Loader explícito con metadata de revisión, preflight y escrituras insert-only. Sin dependencias nuevas, subagentes, IA de producto ni datos reales.

**Correcciones de contrato y ejecución:** el recibo de publicación se conservó con sus cuatro campos OpenAPI en lugar de retornar documento completo; input de publicación agrega confirmConfiguration en schema específico, preservando ExpectedRevision de los otros ejemplos. Vacíos numéricos permanecen ausentes; texto libre nunca se puntúa/excluye. Se corrigió tipo literal de filtro Mongoose al compilar; se eliminó coerción de tipo de pregunta para que objetos inválidos reciban 422. Se evitó el estado transitorio vacío/no encontrado al cambiar de pantalla y la ayuda de borrador dentro de un publicado.

**Evidencia ejecutada:** tipos/lint/build/OpenSpec y catorce pruebas HTTP/MongoDB de screenings/catálogo pasaron: formas/ownership/CSRF, negativa/confirmación/inmutabilidad de publicación, CAS concurrente, copia/remapeo sin invitaciones, catálogo pendiente/repetido/colisión y banco hasta veinte preguntas. Trece pruebas de acceso, catorce de persistencia y smoke siguen pasando. Catálogos del test son ficticios y no acreditan la revisión humana solicitada. Los comandos reales del loader se ejecutaron dos veces en BD aislada, preservando entrada ajena.

**Navegador real:** crear/guardar incompleto y rechazo al publicar; configurar dos preguntas (puntuable/excluyente y texto), recargar, publicar y copiar; editar copia sin cambiar original. Dos pestañas demostraron conflicto con edición local conservada, cancelación de descarte y recuperación explícita. Inspección 375×812 sin overflow horizontal y Tab título→área. Antes de aprobación, el banco vacío se comunicó correctamente en demo; otro entorno aislado con una entrada ficticia verificó filtro, copia sin reglas preaprobadas, edición/recarga y original intacto en MongoDB. Se cerró API y limpió solo su BD/archivo temporales; credenciales no se imprimieron.

**Cierre con revisión humana:** tras la confirmación expresa de Luis, se cambió la metadata del catálogo a approved con su nombre y fecha real, y se renombró el archivo inicial. Se ejecutó el loader dos veces sobre la BD ficticia de demo: ambas terminaron sin reemplazar entradas; el navegador integrado mostró las quince entradas en tres áreas y cinco al filtrar Tecnología. Luis propuso para trabajo posterior investigar otras plataformas, reutilizar preguntas propias por categoría y explorar preguntas generales (estudios, licencia, antecedentes), sin aprobarlas para este banco ni cambiar P-06. Las propuestas se anotaron en backlog para definir acceso, pertinencia y manejo de datos.

**Estado y límites:** T-03 implementado y verificado localmente, con OpenSpec sincronizado/archivado; CI configurado con screenings, ejecución remota no verificada. Sin invitaciones, candidatos, evaluación de respuestas, informes ni E2E final/despliegue. La protección de publicación se aplica a rutas del producto, sin atribuir una restricción universal a administradores MongoDB. Cambios preparados para integrar en entrega 2 del fork; repositorio académico intacto. Herramientas: Codex desktop, skills OpenSpec locales y CLI, Git/npm/Node/Mongoose, navegador integrado; no se inventa modelo seleccionado.

## Entrega 2 — Workflow 6: investigación UX del editor

**Entrada humana:** Luis indicó que el formulario de creación de screenings ofrece una mala experiencia y pidió investigar buenas prácticas después. Se inspeccionó el editor ficticio de la demo, su presentación y el código; no se usaron datos de candidatos.

**Trabajo con IA y fuentes:** se contrastaron patrones de divulgación progresiva y asistentes de Nielsen Norman Group, revisión/errores de GOV.UK, agrupación de W3C WAI y funciones documentadas por Typeform, Google Forms y SurveyMonkey. Se distinguieron prácticas de formularios respondidos por candidatos de las necesidades de un constructor para recruiters. La investigación quedó en docs/ux-screening-editor-research.md con observaciones, inferencias, propuesta, prioridades y tareas de validación.

**Decisión y límite:** se registró UX-01 en el backlog. Se propone un resumen compacto de preguntas, edición enfocada y revisión antes de publicar, además de evitar pérdidas de configuración y enlazar errores. Es investigación experta y documentación, sin pruebas con recruiters ni cambios de interfaz/código. El contrato P-01 a P-08, el guardado explícito y la publicación inmutable no se alteraron.

## Entrega 2 — Workflow 7: aplicar UX-01 al editor

**Entrada humana:** Luis pidió aplicar las mejoras del editor, compactar los controles para agregar preguntas/respuestas, mejorar campos y explicar conceptos mediante ayudas contextuales. Autorizó continuar en su fork; el repositorio académico permanece fuera de las escrituras.

**Trabajo con IA:** OpenSpec `screening-editor-ux` guió propuesta, decisiones, escenarios y tareas. Se cambió solo la presentación del recruiter: Puesto/Preguntas/Revisión, pregunta activa, búsqueda del banco, ayudas accesibles sin hover, acciones visualmente compactas con botones semánticos, revisión de opciones/reglas, confirmación antes de cambios destructivos y errores que enfocan campos. El guardado previo a añadir del banco usa la revisión devuelta por la API; no se introdujo autoguardado al escribir ni cambios del contrato de datos.

**Correcciones humanas y técnicas:** la preferencia de Luis por enlaces se interpretó como reducción visual de las acciones, manteniendo `<button>` para operaciones que modifican datos. Se evitó una ayuda solo por hover para conservar uso táctil/teclado. Una inspección a 375 px detectó un desborde de la ayuda abierta; en móvil se la pasó al flujo del documento. Se añadieron etiquetas diferenciadas para puntajes/respuestas y detalle de valores en la revisión.

**Evidencia:** `npm run check`, 14 pruebas de screenings, 13 de acceso y 14 de persistencia pasaron. En navegador real y cuenta ficticia: crear puesto, añadir desde banco con cambios locales, crear pregunta manual y tercera respuesta, configurar puntajes/peso, guardar y recargar; error de publicación por umbral con foco en el campo, publicación y copia; conflicto entre dos pestañas 409 con edición local preservada y descarte explícito. A 375 px no hubo desbordamiento horizontal tras abrir la ayuda. No se hicieron pruebas observadas con recruiters, auditoría completa de accesibilidad ni E2E automatizado del producto. El flujo del candidato sigue pendiente.

**Herramientas/modelo:** Codex desktop, OpenSpec 1.4.1, React/TypeScript/CSS, npm y navegador integrado. No se verificó un nombre exacto del modelo seleccionado ni se lo inventa.

## Entrega 2 — Workflow 8: aprobar UX-01 y fijar UX-02

**Decisión humana:** Luis aprobó la nueva interfaz de creación de screenings y pidió que el formulario del postulante aplique las mismas técnicas de UX/UI. Los ajustes finos de campos quedan para revisión posterior.

**Trabajo con IA:** se integraron por avance directo T-01/T-02/T-03 y UX-01 en `feature/entrega-2-LL` del fork. Se añadió UX-02 como criterio explícito de aceptación de T-06: progreso y navegación claros, controles y ayudas accesibles, guardado confirmado, recuperación ante error, revisión final y móvil. No se afirma implementación del cuestionario ni validación con postulantes.

**Elección del modelo:** Luis indicó que usa GPT-6 Sol Extra High. Se contrastó con la guía oficial de selección de OpenAI: es adecuado para análisis y verificación profundos de este desarrollo; tareas pequeñas pueden requerir menos esfuerzo. Esta orientación no implica que el modelo usado en workflows anteriores haya sido el mismo.

## Entrega 2 — Workflow 9: invitaciones y acceso candidato T-05

**Entrada humana:** Luis aprobó avanzar con el postulante y pidió aplicar el estilo UX/UI renovado a su formulario. Indicó usar cuentas ficticias ahora y reales solo en pruebas posteriores. Las publicaciones se limitan a su fork.

**Trabajo con IA:** cambio OpenSpec `candidate-invitations` con propuesta, diseño, escenarios y tareas. La implementación suma invitaciones solo de screenings publicados propios, correo `example.test`, enlace individual, código aleatorio de seis dígitos y un uso, controles de reenvío/fallos/IP, sesión candidata ligada a una invitación, separación de recruiter y candidato, interfaz de invitaciones y acceso con etiquetas/errores/foco. No se simuló el cuestionario como si ya estuviera operativo: T-07/T-06 siguen para respuestas, evaluación y formulario.

**Ajuste técnico durante la prueba:** el puerto SMTP local aceptaba conexión pero no respondía al saludo en el entorno de prueba. Se cambió el adaptador ficticio a la API HTTP local de Mailpit, restringida a loopback y correos `example.test`; se actualizó diseño y documentación. No se habilitó envío externo ni se agregó una dependencia nueva.

**Evidencia:** pruebas HTTP/MongoDB/Mailpit aisladas de ownership, duplicado, CSRF, código correcto/incorrecto/usado, cinco fallos, reenvío y límite horario, concurrencia y revocación por retención. En navegador se creó invitación ficticia desde publicado, se abrió enlace, se leyó código de Mailpit y se confirmó acceso/sesión. Se comprobó una recarga con sesión vigente. El control de viewport integrado no aplicó 375 px; la revisión visual móvil se deja para T-06. No se afirma envío a correo real, identidad civil, CI remoto ni E2E principal.

**Herramientas y límites:** Codex desktop, OpenSpec, Node/TypeScript, MongoDB/Mailpit locales, navegador integrado y Git. Los códigos de prueba solo circularon dentro del equipo y no se imprimieron en documentación. Sin subagentes. Se sigue la decisión humana de usar únicamente el fork para commits/PRs de desarrollo.

## Entrega 2 — Workflow 10: respuestas, evaluación y formulario T-07/T-06

**Entrada humana:** Luis pidió continuar con el postulante y aplicar al formulario las técnicas UX/UI del editor aprobado. Se trabajó sobre la rama dependiente de T-05, con cuentas e invitaciones ficticias, sin modificar el repositorio académico.

**Trabajo con IA:** cambios OpenSpec `candidate-attempt` y `candidate-form-ux` delimitan API/cálculo y presentación. El backend proyecta solo preguntas visibles, valida respuestas por tipo, guarda con revisión optimista y calcula un informe determinista P-01 a P-08 al enviar. La UI usa una pregunta por paso, progreso, respuestas desconocidas separadas de omisiones, guardado confirmado, edición preservada ante error, revisión editable, confirmación de envío y recibo sin informe interno.

**Ajustes de criterio:** la orientación copiada del banco es para el recruiter y se excluyó de la proyección candidata. La comparación del umbral usa sumas ponderadas antes de redondear; un excluyente incumplido prevalece sin ocultar faltantes. Las contribuciones conocidas permanecen cuando el puntaje global es nulo. El envío repetido conserva el primer recibo y no recalcula.

**Evidencia:** dos pruebas puras y cuatro de HTTP/MongoDB/Mailpit pasaron, incluidas formas inválidas, ownership de sesión, CSRF, reanudación, CAS de guardado, vencimiento, obligatoriedad, doble envío y no exposición de reglas. El navegador integrado recorrió una invitación ficticia, dos preguntas, navegación con edición local, guardado, recarga, desconocido, revisión, envío y recibo persistido. `npm run check` y todas las regresiones locales pasaron; el [CI de la rama candidata](https://github.com/luislujan32/AI4Devs-finalproject/actions/runs/36584509325) terminó correctamente. La revisión visual a 375 px y permisos de control de pantalla del Mac seguían pendientes; no se afirma evaluación de usabilidad con candidatos reales.

**Límites:** T-08 todavía debe exponer informe y revisión humana al recruiter. El aviso de datos de la demo refleja 90 días de retención y no sustituye una política de privacidad para datos reales. El cálculo apoya decisiones humanas; no se usa IA para evaluar ni se toman decisiones de contratación automáticas. Herramientas: Codex desktop, OpenSpec, TypeScript/NestJS/React, MongoDB/Mailpit locales y navegador integrado; sin subagentes.

## Entrega 2 — Workflow 11: revisión del recorrido completo con observaciones de Luis

**Entrada humana:** Luis probó la interfaz y aportó ocho capturas. Pidió eliminar copias, separar las invitaciones de la configuración, mejorar etiquetas, ayudas y diseño móvil, enviar la invitación por correo, simplificar el envío final, aclarar la sesión y ubicar las respuestas del recruiter.

**Trabajo con IA:** contrastar las capturas con código y pruebas; investigar patrones oficiales de agrupación de tareas, revisión, confirmación y ayudas; registrar decisiones y pendientes en [la revisión UX](docs/ux-feedback-2026-10-03.md) y OpenSpec `screening-workflow-ux`. Implementar áreas Configuración/Postulantes, eliminación segura de borradores, invitación HTML/texto a Mailpit, cookies independientes para recruiter/candidato, guardado seguido del envío, selector de preguntas móvil y textos más claros.

**Correcciones y límites:** se identificó que ambos principales usaban una cookie `sr_session`: verificar a un candidato en el mismo navegador podía desplazar al recruiter y aparentar un vencimiento prematuro. El informe ya se guarda en MongoDB pero su vista y revisión humana siguen en T-08. Mailpit entrega solo dentro de la demo con `example.test`; no se afirma correo real. La duración futura de la sesión y archivado de publicados requieren decisión humana. No se usaron subagentes ni datos reales.

**Evidencia local:** `npm run check` y pruebas de screenings, auth, candidate y attempt pasaron con MongoDB/Mailpit locales. Se comprobó por navegador el acceso público del candidato a un ancho efectivo de 375 px sin desbordamiento horizontal; la revisión del editor autenticado a ese ancho y el recorrido completo posterior a estos cambios siguen pendientes. No se atribuye un modelo exacto al trabajo sin evidencia verificable.

## Entrega 2 — Workflow 12: segunda revisión y prioridades

**Entrada humana:** Luis validó la mejora general mediante seis capturas y propuso estados más visibles, revisar el texto del correo, evitar código al abrir desde el email, mejorar el recibo y reconsiderar la copia del enlace tras recibir respuestas. Solicitó conocer el estado real del proyecto y los próximos pasos.

**Análisis con IA:** contrastar cada observación con la rama implementada y el backlog; investigar documentación primaria sobre etiquetas de estado, confirmaciones y tokens de enlace. Se documentó la diferencia entre el enlace actual (idéntico en email y botón copiar) y la propuesta de dos credenciales con acceso diferente. Se priorizó T-08 porque el informe ya se persiste pero aún no es visible para el recruiter. No se equiparó un correo más un código al mismo buzón con dos factores independientes.

**Resultado y límite:** se actualizaron [la revisión UX](docs/ux-feedback-2026-10-03.md) y [el backlog](docs/backlog.md) como propuestas, sin cambiar el acceso ni presentar funcionalidades futuras como terminadas. Se mantienen datos ficticios; no se usaron subagentes ni datos reales. El modelo exacto del turno no se verificó en la interfaz.

## Entrega 2 — Workflow 13: informes, revisión humana y cierre T-08

**Entrada humana:** Luis aprobó avanzar con la vista de resultados y revisión del recruiter, y añadió que un SC publicado debe poder cerrarse conservando acceso a los resultados de postulantes.

**Trabajo con IA:** cambio OpenSpec `recruiter-results-and-closure`; lectura del informe solo para el propietario y dentro de retención, aunque haya vencido el enlace; revisión humana versionada y separada del cálculo con motivo obligatorio al continuar frente a resultado negativo o pendiente. La interfaz muestra respuestas y criterios, distingue los estados de postulantes y reemplaza la copia de enlace por consulta cuando ya hay envío. El cierre confirmado congela configuración y nuevas invitaciones, mantiene intentos previos hasta su vencimiento y permite consultar informes o copiar el SC como nuevo borrador.

**Ajuste humano incorporado:** la regla de cierre se explicita antes de confirmar: no revoca las invitaciones enviadas y no borra resultados. No se decidió implantar correo real, acceso sin código desde el email, borrado temprano ni una decisión de contratación automática.

**Evidencia local:** `npm run check`, 17 pruebas de screenings, seis de intento, cinco de invitaciones, trece de acceso, catorce de persistencia y smoke pasaron con MongoDB/Mailpit locales; se verificaron propiedad, CSRF, informes tras vencer el enlace, revisión concurrente, cierre y continuidad de la invitación existente. En navegador con base ficticia aislada se abrió el informe, se guardó una revisión humana, se cerró el SC y se recargó conservando postulantes/resultados; a 375 px no se observó desbordamiento horizontal. La rama aún requiere integración en `feature/entrega-2-LL` y CI integrado. Se usaron Codex desktop, OpenSpec, Node/TypeScript, React/NestJS y datos ficticios; sin subagentes. No se atribuye un modelo exacto sin verificarlo.

## Entrega 2 — Workflow 14: correcciones de la revisión de Luis

**Entrada humana:** Luis señaló el error de informe/cierre, la confusión entre «Ocultar respuestas» y «Cerrar informe», la edición bloqueada de publicados, la copia, el guardado desigual, duplicados del banco, publicación sin preguntas, umbral inalcanzable y código redundante al abrir desde el correo. Confirmó que el banco debe ofrecer guía sin valores automáticos.

**Trabajo con IA:** cambio OpenSpec `review-feedback-ux`. Se encontró que la demo mantenía una API anterior sin rutas T-08 y se reinició con el build actualizado. El editor pasó a guardado automático serializado para todos los campos con revisión optimista y reintento; el informe ocupa una vista propia. La UI explica la inmutabilidad del publicado y crea una nueva versión vinculada al original. El servidor evita repetir una pregunta del banco y rechaza umbrales superiores al máximo ponderado posible. El enlace de correo usa una credencial de un uso; el enlace compartido mantiene código.

**Criterios humanos y límites:** se conservaron las preguntas y reglas de personas ya invitadas; no se asignan puntajes de forma automática a preguntas del banco. La entrega de correo sigue siendo solo local y ficticia. El token del correo prueba acceso al mensaje, no identidad civil ni un segundo factor independiente.

**Evidencia:** `npm run check` pasó con Node del runtime local; `npm run test:screenings` pasó 18 casos y `npm run test:candidate` seis casos con bases de prueba aisladas y Mailpit. Las pruebas iniciales dentro del sandbox no pudieron conectar a servicios locales; se repitieron con acceso local autorizado. En navegador y base ficticia separada se verificaron autoguardado de título tras recarga, bloqueo de publicación vacía e imposible, publicación válida, apertura directa desde el correo sin código, envío del cuestionario, informe separado, cierre con resultados conservados y nueva versión vinculada al original. El control de viewport integrado no cambió el ancho efectivo a 375 px; esa inspección y CI de la rama de integración siguen pendientes. No se usaron subagentes ni datos reales.

## Entrega 2 — Workflow 15: auditoría de producto y UX de resultados

**Entrada humana:** Luis mostró que el informe era visualmente plano, poco claro por pregunta, la confirmación «Revisión humana guardada» no explicaba nada, la decisión desaparecía en Postulantes y el formulario reaparecía al volver. Preguntó qué hacía «Solicitar aclaración» y pidió que las decisiones pequeñas no dependan de revisar cada pantalla.

**Trabajo con IA:** dos subagentes independientes auditaron el contrato de producto y la UX, sin editar código; se contrastaron sus propuestas con P-01 a P-08, el modelo persistido y fuentes primarias de GOV.UK, W3C, Atlassian y Greenhouse. Coincidieron en separar respuesta, resultado y decisión, presentar causas del resultado sin inventar un umbral por pregunta, y cerrar el formulario tras guardar. Se documentaron estas reglas en `docs/ux-resultados-revision.md` y OpenSpec `recruiter-review-ux` antes de ampliar el flujo.

**Decisión de producto:** «Solicitar aclaración» solo persistía un enum; no contactaba al postulante. Se retiró de nuevas revisiones y se conserva la lectura explicada de registros previos. La revisión vigente continúa siendo interna; una solicitud real se diseñará aparte. La lista obtiene un resumen mínimo sin respuestas ni motivo. El informe muestra factores relevantes, valor por respuesta, peso, decisión, motivo y fecha; tras guardar queda en lectura con acción explícita para cambiar.

**Evidencia y límites:** `npm run check` pasó y la prueba de screenings cubrió proyección del resumen, rechazo de nuevas aclaraciones y reemplazo de decisión. En una base ficticia aislada, el navegador mostró los tres ejes en Postulantes, una decisión distinta del resultado, registro/confirmación, regreso, recarga, edición y cancelación; a 375 px efectivos no hubo desbordamiento horizontal. No se alteró la fórmula ni el informe enviado. El listado actual limita 100 invitaciones y necesitará paginación antes de escalar. Se usaron solo cuentas ficticias; no se atribuye un modelo exacto a los subagentes sin evidencia verificable.

## Entrega 2 — Workflow 16: auditoría del espacio recruiter y mejora del harness

**Entrada humana:** Luis aportó seis capturas C1–C6. Señaló falta de estructura y jerarquía en dashboard, detalle, postulantes, informe, invitaciones y correo; propuso evaluar Kanban y editar SC publicados. Pidió optimizar los revisores de producto y UX para reducir las decisiones pequeñas que llegan a su revisión. Aclaró que una edición debería afectar **solo futuras invitaciones**.

**Trabajo con IA:** dos subagentes de solo lectura revisaron por separado producto y UX/UI; un tercero, convocado para esta tarea, verificó consecuencias de versionado y de listas de más de 100 registros. El agente principal contrastó sus hallazgos con código y P-04, abrió fuentes primarias de Carbon, GOV.UK, W3C y Greenhouse, y consolidó propuestas y criterios de aceptación en [la auditoría C1–C6](docs/ux-workspace-audit-2026-10-04.md). Se afinó el encargo de los revisores en [el criterio de experiencia](docs/experiencia-producto.md) y se corrigió contexto desactualizado de OpenSpec. Los agentes no editaron código ni datos.

**Correcciones y decisiones:** un Kanban no representa los tres ejes actuales ni etapas de contratación reales; se propone lista filtrable y un informe de detalle. La edición directa de un publicado alteraría intentos que leen el SC actual; el objetivo es versionar y dirigir nuevas invitaciones a una versión activa, preservando las emitidas. Los conteos y filtros necesitan API paginada: las listas actuales terminan en 100 y `items.length` no es un total. No se añaden agentes permanentes por ceremonia; la revisión técnica se pide cuando cambian invariantes o escala.

**Evidencia y límites:** investigación de código y fuentes oficiales, sin cambios de interfaz ni pruebas observadas con recruiters. El informe es una propuesta; no afirma que paginación, versiones activas o nuevo diseño estén implementados. Los nombres exactos de los modelos de estos subagentes no se comprobaron, por lo que no se atribuyen.
