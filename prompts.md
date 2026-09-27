# Registro de uso de IA — Screeningroom

**Autor:** Luis Lujan (LL). **Etapas:** entrega 1 documental y comienzo de entrega 2. **Actualización:** 27 de septiembre de 2026.

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
