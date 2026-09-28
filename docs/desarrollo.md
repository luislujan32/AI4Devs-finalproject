# Desarrollo local de Screeningroom

[Volver al README](../readme.md).

## Alcance actual

T-00 prepara la base del proyecto: React/Vite, NestJS/Express, MongoDB/Mongoose y npm workspaces. GET /api/health/ready comprueba disponibilidad real de la API y MongoDB. No implementa todavía el recorrido de screenings y no equivale a la entrega 2 completa.

T-01 agrega [modelos, índices y operaciones de persistencia](datos.md), datos ficticios y pruebas con MongoDB real. T-01 no añade login, editor, OTP, cálculo ni endpoints de producto.

T-02 agrega [login/logout, sesiones persistentes y listado propio](acceso.md). La pantalla inicial ahora es el acceso del recruiter. T-03 agrega [editor, reglas, publicación, copia y banco inicial revisado](screenings.md); el recorrido del candidato sigue pendiente.

## Requisitos

- Node.js 24.21.0 y npm 11; la versión está fijada en .nvmrc. Con nvm instalado: `nvm install` y `nvm use` desde la raíz.
- Docker y Compose operativos. En el Mac se comprobó OrbStack.
- Puertos locales libres: 27018 para MongoDB, 1026/8026 para Mailpit, 3001 para API y 5173 para Vite.

Todos los comandos siguientes se ejecutan desde la raíz del repositorio.

## Preparar y ejecutar

```bash
npm ci
cp .env.example .env
npm run infra:up
npm run check
npm run demo -- --database screeningroom_demo_local
npm run dev
```

Si .env ya existe, conservarlo y comparar con .env.example en lugar de reemplazarlo. Contiene configuración local y está ignorado por Git. Antes de iniciar, generar SESSION_SECRET localmente como indica [acceso](acceso.md), y hacer coincidir la BD de MONGODB_URI con la del comando demo. No usar datos reales en este entorno.

Abrir http://127.0.0.1:5173. Vite envía las peticiones /api al backend, conservando el mismo origen para el navegador. El frontend permite entrar con una cuenta ficticia y consultar sus screenings; comunica errores y permite reintentar.

Mailpit está en http://127.0.0.1:8026. Su servicio SMTP está preparado en 127.0.0.1:1026; el envío de códigos se implementará en T-05.

La base de datos se conserva en un volumen de Compose. `npm run infra:down` detiene los servicios sin borrar ese volumen. El entorno local está ligado a localhost y no es una configuración de producción.

## Ejecutar la aplicación compilada

```bash
npm run build
npm start
```

Abrir http://127.0.0.1:3001. NestJS sirve el frontend compilado y la API bajo el mismo origen. GET /api/health/ready confirma MongoDB mediante un ping; una ruta /api desconocida conserva su 404.

## Comprobar la base

```bash
npm run check
npm run test:persistence
npm run test:auth
npm run test:screenings
npm run smoke
```

`check` comprueba tipos, lint, compilación de ambos workspaces y validez de las especificaciones OpenSpec. `smoke` inicia una API temporal y comprueba disponibilidad real, página y recursos compilados, 404 JSON y persistencia en MongoDB tras reconectar. Usa una base de prueba con nombre aleatorio y limpia solo esa base; no borra la base de desarrollo.

El contrato de indisponibilidad se comprueba también invocando el controlador real con una conexión aislada desconectada: debe devolver 503 sin URI. Esa comprobación aislada no demuestra por sí sola toda la recuperación HTTP ante una caída real del servidor.

Estos checks son evidencia de infraestructura; no son pruebas de las funcionalidades todavía pendientes ni el E2E del flujo principal requerido para la final. La configuración .github/workflows/check.yml reproduce las comprobaciones con MongoDB en CI. Un resultado local no acredita ejecución remota de CI.

test:persistence requiere la API compilada (incluida en check). Verifica los modelos y operaciones concretas en una BD de prueba aleatoria, incluidos índices, concurrencia y comando repetible de fixtures. La guía de [datos](datos.md) detalla límites y el comando de carga explícita en una BD separada.

## Trabajo con OpenSpec

La CLI está fijada como dependencia del proyecto. Las skills locales de Codex están en .codex/skills; AGENTS.md aporta el contexto operativo común. Se puede trabajar con la CLI sin instalar comandos globales.

```bash
npx openspec list
npx openspec show workspace-runtime
npm run spec:validate
```

T-00 está cerrado en openspec/changes/archive/2026-09-27-bootstrap-workspace; su contrato de infraestructura vive en openspec/specs/workspace-runtime/spec.md. El contrato funcional previsto continúa en docs/producto.md. [Aplicación de los checkpoints y evidencia por ticket](harness.md).

T-01 está cerrado en openspec/changes/archive/2026-09-27-persist-domain-model, con sus diez tareas completas y evidencia local. Su contrato está sincronizado en openspec/specs/domain-persistence/spec.md. T-02 está cerrado en openspec/changes/archive/2026-09-27-recruiter-access; sincroniza recruiter-auth y recruiter-workspace. T-03 se cerró en OpenSpec como screening-editor y sincroniza screening-authoring y question-catalog. Las ideas posteriores de banco quedan en [backlog](backlog.md#ideas-posteriores-propuestas-por-luis-28092026).

## Ramas de trabajo

El remoto origin debe ser el fork luislujan32/AI4Devs-finalproject. Trabajar sobre feature/entrega-2-LL o una rama de tarea creada desde ella. Antes de publicar comprobar remoto, rama y cambios; antes de un PR confirmar que la base es feature/entrega-2-LL en el fork.

feature/entrega-1-LL conserva la documentación entregada. No fusionar su revert de T-00 hacia entrega 2: ese revert solo separó la documentación del desarrollo ya preservado. Borrar ramas temporales después de fusionarlas es normal; conservar las ramas estables de cada entrega. No publicar commits, PRs ni comentarios en el repositorio académico dentro del trabajo de desarrollo.

## Evidencia del 27/09/2026

- npm ci, tipos, lint, compilación y OpenSpec estrictos pasaron desde una copia limpia sin node_modules, dist ni .env.
- La comprobación de integración pasó en esa copia, usando MongoDB real y una base de prueba aislada.
- La página de desarrollo se verificó en el navegador integrado: conexión confirmada, fallo al pausar el MongoDB propio, reintento y recuperación tras restaurarlo.
- La prueba de caída real confirmó HTTP 503 genérico en un plazo acotado. La BD se restauró y volvió a responder 200.
- npm no reportó vulnerabilidades en la instalación. Imágenes MongoDB/Mailpit fijadas por digest.
- El pipeline está configurado; su ejecución remota se verificará al publicar el cambio.

Son resultados del entorno local descrito; no acreditan funcionalidades de screening ni un despliegue público.


## Evidencia local de T-01

Tipos, lint, compilación y OpenSpec pasaron. Las catorce pruebas de persistencia con MongoDB real y la prueba de infraestructura pasaron tras la implementación final. La integración por PR hacia entrega 2 sigue pendiente; no se acredita ejecución remota de CI. Detalles en docs/datos.md y prompts.md.

## Evidencia local de T-02

Tipos, lint, build, OpenSpec, trece pruebas HTTP/MongoDB de acceso, catorce de persistencia y smoke pasaron. Demo ejecutada dos veces, sin imprimir ni cambiar contraseñas. Navegador real: contraseña incorrecta, login A/B y listados aislados, recarga, logout, formulario limpio, Tab/Enter y diseño de 375 × 812 sin desbordamiento horizontal. Cookie Secure se comprobó por construcción; no se hizo un despliegue TLS ni una auditoría completa de accesibilidad. Estado de CI remoto e integración por PR pendientes. Detalles y límites en docs/acceso.md.

## Evidencia local de T-03

Check y 41 pruebas (14 screenings/catálogo, 13 acceso, 14 persistencia), más smoke, pasaron. Navegador verificó creación/guardado/recarga/publicación/copia, rechazo de configuración incompleta, conflicto entre pestañas y recuperación, móvil/teclado. Tras la aprobación de Luis, se cargaron quince entradas del banco en la demo dos veces sin duplicados; el navegador mostró las tres áreas y cinco entradas al filtrar Tecnología. No se afirma CI remoto. Detalles en screenings.md.
