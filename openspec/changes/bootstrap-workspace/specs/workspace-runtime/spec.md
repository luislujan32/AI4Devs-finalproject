## ADDED Requirements

### Requirement: Reproducible workspace
El proyecto MUST proporcionar frontend y API en npm workspaces, dependencias fijadas, versión Node documentada y comandos para comprobar tipos, lint y compilación.

#### Scenario: Clean installation
- **WHEN** se instala con npm ci en la versión Node indicada y se ejecuta npm run check
- **THEN** ambos workspaces pasan tipos y lint y generan sus compilados sin requerir secretos externos

### Requirement: Real database readiness
La API SHALL devolver 200 en GET /api/health/ready solo si MongoDB responde al ping, y 503 con error genérico si no puede confirmar disponibilidad.

#### Scenario: Available database
- **WHEN** MongoDB está operativo y el navegador consulta disponibilidad mediante la API
- **THEN** la respuesta es 200 y la interfaz confirma la conexión

#### Scenario: Unavailable database
- **WHEN** la conexión no está disponible o el ping supera el límite
- **THEN** readiness responde 503 sin exponer URI, credenciales ni detalles del driver

### Requirement: Same-origin frontend and API
La aplicación compilada SHALL servir frontend y API desde NestJS bajo un mismo origen. Las rutas /api inexistentes MUST conservar su error HTTP en lugar de devolver HTML de la SPA.

#### Scenario: Compiled application
- **WHEN** se abre la raíz de la API tras compilar ambos workspaces
- **THEN** se entrega la página de Screeningroom con sus recursos compilados

#### Scenario: Missing API route
- **WHEN** se consulta una ruta /api que no existe
- **THEN** la respuesta es 404 y no contiene la página del frontend

### Requirement: Development infrastructure and evidence
El proyecto SHALL documentar servicios locales de MongoDB y correo de prueba, ligados a localhost, y una comprobación aislada de integración que no modifique datos ajenos.

#### Scenario: Infrastructure verification
- **WHEN** se ejecuta la comprobación de integración con MongoDB operativo
- **THEN** se verifica lectura/escritura persistente tras reconexión y la integración HTTP; se limpian solo datos de la base de prueba creada por esa ejecución
