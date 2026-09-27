# recruiter-auth Specification

## Purpose
Autenticar recruiters aprovisionados y autorizar recursos propios mediante sesiones persistentes, vigencia explícita y protección de mutaciones.

## Requirements
### Requirement: Provisioned recruiter credentials
El sistema MUST autenticar cuentas administrativamente aprovisionadas con Argon2id, sin registro público ni credenciales versionadas.
#### Scenario: Fictional demo accounts
- **WHEN** se ejecuta provisioning de demo dos veces
- **THEN** conserva las cuentas/credenciales ficticias y documentos ajenos; contraseñas quedan solo en archivo local ignorado
#### Scenario: Invalid credentials
- **WHEN** cuenta inexistente, inactiva o contraseña incorrecta intenta entrar
- **THEN** recibe el mismo 401 sin información de existencia; el límite persistente responde 429 al agotarse

### Requirement: Server-side session lifecycle
Sesiones SHALL persistir en MongoDB con cookie opaca HttpOnly, SameSite=Lax y Secure en HTTPS, máximo ocho horas, rotación al entrar y revocación al salir.
#### Scenario: Persistence and restart
- **WHEN** se reinicia la API con la misma configuración después de login
- **THEN** la cookie válida conserva acceso y su vencimiento original
#### Scenario: Expired or revoked session
- **WHEN** sesión vencida, revocada, candidata o de usuario inactivo consulta una operación recruiter
- **THEN** recibe 401 aun si el TTL todavía no eliminó su documento
#### Scenario: Rotation and logout
- **WHEN** se reautentica y luego sale
- **THEN** la cookie anterior y la cookie revocada dejan de autorizar acceso

### Requirement: Mutation protection
Mutaciones MUST exigir token CSRF y origen permitido, incluido login; secretos/token de sesión no se retornan como datos de negocio.
#### Scenario: CSRF and origin failures
- **WHEN** login/logout omite token, presenta token incorrecto o usa origen ajeno
- **THEN** responde 403 sin crear/destruir una sesión válida

### Requirement: Owned recruiter resources
El servidor SHALL derivar ownership de una sesión válida y no de datos del cliente.
#### Scenario: Two recruiters
- **WHEN** un recruiter lista screenings o consulta el id de otro
- **THEN** ve solo los propios y el ajeno devuelve 404, igual que uno inexistente
