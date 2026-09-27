# recruiter-workspace Specification

## Purpose
Permitir acceso, consulta de screenings propios y cierre de sesión en una interfaz con estados claros y sin almacenamiento persistente de credenciales.

## Requirements
### Requirement: Login and workspace interface
La UI SHALL permitir entrar/salir y cargar screenings propios, mostrar estados de carga, error, vacío y sesión vencida, sin fingir funciones de edición.
#### Scenario: Login and reload
- **WHEN** el recruiter entra con cuenta ficticia y recarga
- **THEN** recupera su sesión/listado desde API y MongoDB, sin password/token persistentes en almacenamiento del navegador
#### Scenario: Error and logout
- **WHEN** falla acceso/carga o se cierra sesión
- **THEN** comunica el estado correcto, permite reintentar y vuelve al acceso al salir sin conservar lista de otro usuario

