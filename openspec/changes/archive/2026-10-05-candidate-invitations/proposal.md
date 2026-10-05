## Why

Screeningroom ya publica screenings, pero ninguna persona invitada puede acceder; falta el primer tramo del flujo principal de entrega 2. T-05 debe vincular una invitación a un screening publicado, entregar un acceso de prueba por correo local y crear una sesión limitada a esa invitación antes de exponer el futuro cuestionario.

## What Changes

- El recruiter propietario crea y lista invitaciones para sus screenings publicados; el sistema evita duplicados y entrega un enlace individual para compartir.
- El postulante solicita un código desde su enlace, lo recibe por correo y lo verifica para abrir una sesión propia, sin cuenta ni contraseña.
- El código vence, se acepta una sola vez, limita intentos/solicitudes y nunca aparece en respuestas API, logs ni almacenamiento del navegador.
- La interfaz presenta creación de invitaciones y acceso del postulante con los principios UX-02, usando solo datos ficticios durante desarrollo.
- Se mantienen las fronteras de recruiter/candidato, origen y CSRF; invitaciones vencidas o fuera de retención no dan acceso.

## Capabilities

### New Capabilities

- `candidate-access`: invitaciones propias, entrega local, desafío por correo, sesión de candidato y acceso limitado a un intento.

### Modified Capabilities

- `recruiter-workspace`: un recruiter puede crear y consultar invitaciones de un screening publicado propio.

## Impact

API NestJS, modelos existentes de invitation/session, servicio de correo local Mailpit, interfaz React de recruiter y acceso del postulante, pruebas HTTP/MongoDB y documentación. T-07/T-06 implementarán respuestas/evaluación/cuestionario después de este acceso. No se envían correos reales ni se alteran P-01 a P-08.
