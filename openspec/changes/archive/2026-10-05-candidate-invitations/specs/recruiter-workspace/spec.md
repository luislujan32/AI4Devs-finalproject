## MODIFIED Requirements

### Requirement: Login and workspace interface
La UI SHALL permitir entrar/salir y cargar screenings propios, mostrar estados de carga, error, vacío y sesión vencida, y crear/listar invitaciones propias para screenings publicados sin presentar una invitación como si fuera un intento enviado.

#### Scenario: Login and reload
- **WHEN** el recruiter entra con cuenta ficticia y recarga
- **THEN** recupera su sesión/listado desde API y MongoDB, sin password/token persistentes en almacenamiento del navegador

#### Scenario: Error and logout
- **WHEN** falla acceso/carga o se cierra sesión
- **THEN** comunica el estado correcto, permite reintentar y vuelve al acceso al salir sin conservar lista de otro usuario

#### Scenario: Invitation from published screening
- **WHEN** el recruiter abre un screening publicado propio y registra un correo ficticio
- **THEN** obtiene un enlace individual para compartir y ve solo las invitaciones de ese screening
