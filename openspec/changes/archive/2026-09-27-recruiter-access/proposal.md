## Why

T-01 ya persiste el dominio, pero aún no hay acceso autenticado. T-02 debe permitir entrar/salir como recruiter y consultar solo sus screenings, como base del editor y flujo principal de entrega 2.

## What Changes

- Añadir provisioning explícito de cuentas ficticias y un comando administrativo para cuentas posteriores, sin registro público ni contraseñas en Git/chat.
- Implementar login/logout, consulta de sesión, Argon2id, sesiones persistidas de hasta ocho horas, cookies y protección CSRF/origen.
- Proteger lectura/listado de screenings mediante sesión de recruiter y ownership; cuentas inactivas, sesiones vencidas y principals de candidato no acceden.
- Incorporar pantalla real de acceso y listado propio con estados vacío/error/sesión vencida; edición queda para T-03.
- Verificar HTTP, MongoDB y navegador, incluidos negativos entre dos cuentas ficticias y límites contra fuerza bruta.

## Capabilities

### New Capabilities
- `recruiter-auth`: credenciales, sesiones y protección de mutaciones del recruiter.
- `recruiter-workspace`: interfaz de acceso y lectura de screenings propios.

### Modified Capabilities
Ninguna: se reutilizan workspace-runtime y domain-persistence.

## Impact

NestJS, modelos existentes, React, comandos de demo/provisioning, dependencias de Argon2id/cookies y checks. El cambio se basa en T-01 verificado, aún pendiente de integración a entrega 2. Sin OTP, candidatos, registro público, recuperación de contraseña, editor ni scoring. Luis eligió cuentas ficticias; las pruebas reales posteriores usarán provisioning local separado.
