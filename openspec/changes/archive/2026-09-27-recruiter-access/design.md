## Context

Contrato: acceso por correo/contraseña, provisioning administrativo, Argon2id, cookies HttpOnly/SameSite=Lax/Secure en HTTPS, ocho horas como máximo y CSRF/origen (README). Existente: T-01 verificado, sin auth HTTP. Luis confirmó cuentas ficticias para desarrollar; cuentas reales se aprovisionarán después y nunca se usarán como fixtures.

## Goals / Non-Goals

**Goals:** login/logout persistentes, UI real, consultas de screenings propios y evidencia de aislamiento entre dos cuentas ficticias.
**Non-Goals:** registro público, recuperación de contraseña, editor, publicación, OTP o cuestionario de candidato.

## Decisions

- Reutilizar sessions de T-01 mediante un servicio pequeño de sesiones opacas, sin cambiar a un store con otro formato ni usar JWT/localStorage. Cookie sr_session aleatoria (32 bytes); guardar su HMAC, token CSRF y expiración absoluta en MongoDB. SESSION_SECRET fuera de Git. No renovar la duración al consultar. Reautenticar rota token y elimina sesión anterior; logout elimina sesión y cookie. Cada consulta verifica vigencia, principal y usuario activo.
- Argon2id con 19 MiB, dos pasadas, paralelismo uno, parámetros explícitos. Usar @node-rs/argon2 sin postinstall y versiones fijadas. Respuesta 401 indistinguible para inexistente/inactivo/contraseña incorrecta; verificación de hash ficticio cuando no hay cuenta activa.
- Login también es mutación: GET /auth/csrf entrega nonce con cookie HttpOnly firmada, válida quince minutos; POST login exige nonce y origen. Sesión autenticada usa otro token CSRF. Todas las mutaciones comprueban origen permitido explícito; desarrollo admite los dos orígenes locales de Vite/API, producción exige PUBLIC_ORIGIN HTTPS y Secure. No confiar en cabeceras de proxy no configuradas.
- Límite persistente en colección técnica auth_limits: por IP y correo normalizado, claves HMAC sin guardar identificadores en claro; ventanas de quince minutos, 50 solicitudes por IP y 10 por correo. Incremento atómico y TTL; no es una sexta entidad de negocio. Límites son decisión técnica inicial y configurados como constantes revisables, sin bloqueo permanente de cuentas.
- API: GET /auth/csrf, POST /auth/login, GET /auth/session, POST /auth/logout; GET /screenings y GET /screenings/:id protegidos. Login retorna usuario mínimo, CSRF y expiresAt; no devuelve cookie como token JSON ni hash. Id inválido, inexistente o ajeno → 404; principal candidato/sesión ausente/vencida → 401. El guard es reutilizable para T-03, pero aún no hay escrituras de screenings HTTP.
- Provisioning ficticio explícito: dos recruiters y screenings de demo en BD screeningroom_demo_*. Contraseñas aleatorias solo en archivo ignorado .local con modo 0600; no imprimirlas ni versionarlas. Repetir conserva credenciales y documentos ajenos. Provisioning administrativo posterior recibe password por stdin, no argumentos/URL; crea sin sobreescribir cuenta existente. Sin recuperación por UI.
- UI de login/listado, estados vacío/error/cargando, expiración y logout; sin acciones falsas de editor. Contraseña y CSRF viven solo durante la interacción, sin almacenamiento persistente del navegador. Probar HTTP con BD aislada, reinicio de API y navegador real; cobertura actual no equivale al E2E final de candidatos.

## Risks / Trade-offs

Cookies y CSRF → parser mantenido, comparación constante, firmas, origen explícito y pruebas negativas. Hash costoso → rate limit antes de verificar. TTL demorado → fechas verificadas al consultar. Key ausente → inicio rechazado; producción sin HTTPS → rechazado. Sesión de otra cuenta → ownership desde sesión, jamás desde un ownerId del cliente. Demo confundida con fixture histórico → BD separada y usuarios de T-01 siguen inactivos.

## Migration Plan

Añadir secreto local/configuración sin reemplazar .env; instalar lockfile y aprovisionar demo por comando explícito. Nuevos índices técnicos no borran datos existentes. Cambiar SESSION_SECRET invalida sesiones/prelogin tokens; no requiere borrar volúmenes. T-01 aún pendiente de integración: T-02 se desarrolla sobre su rama validada.

## Open Questions

Ninguna bloqueante. Pruebas reales posteriores requerirán provisioning local; no solicitar secretos por chat.
