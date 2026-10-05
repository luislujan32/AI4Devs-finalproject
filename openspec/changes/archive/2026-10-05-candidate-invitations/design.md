## Context

T-01 ya modela invitaciones, desafíos y sesiones; T-02 tiene cookies, origen, CSRF y límites; T-03 publica screenings. El README fija siete días de vigencia, código de seis dígitos/10 minutos, cinco fallos por desafío, reenvío tras 60 segundos y cinco envíos por invitación/hora, sesión de candidato de hasta dos horas y retención de 90 días. El enlace individual no autoriza leer preguntas. En desarrollo se usan correos `example.test` y Mailpit local.

## Goals / Non-Goals

**Goals:** crear/listar invitaciones de screenings publicados propios; compartir enlace opaco; solicitar/verificar código de correo; crear una sesión de candidato limitada a esa invitación; mostrar estados claros y accesibles en recruiter y postulante; probar ownership, vencimiento, concurrencia y límites.

**Non-Goals:** enviar invitaciones por correo automáticamente, usar direcciones reales, respuestas/cuestionario/envío/informe (T-07/T-06/T-08), identidad civil o MFA de alta garantía, despliegue SMTP público.

## Decisions

- `publicId` aleatorio de 32 bytes se comparte en fragmento URL `#invite=...`. Solo el recruiter propietario recibe ese enlace desde su sesión. El fragmento no viaja en `Referer`; aun así se trata como secreto y nunca se registra. El postulante debe pedir código al correo asociado antes de leer cualquier contenido del intento.
- `POST /screenings/:id/invitations` verifica screening publicado y owner, normaliza el correo y crea una invitación con `expiresAt=created+7 días` y `purgeAt=created+90 días`. `GET` lista solo las propias. En esta fase local se aceptan únicamente direcciones `example.test`; no hay envíos externos accidentales. Duplicados del mismo screening/correo reciben 409 sin reemplazar intentos.
- `POST /candidate/access/request` usa CSRF de preacceso y origen; un cambio condicionado de `Invitation.auth` establece challengeId aleatorio, HMAC del código vinculado a invitación/desafío, vencimiento y contador de fallos. Conserva la ventana horaria de envíos y la última solicitud para los límites de 5/h y 60 s. Se complementa con límite por IP en MongoDB. Nuevo código invalida el anterior sin reiniciar el límite. El mensaje local solo contiene código y duración, nunca puntajes ni respuestas.
- `POST /candidate/access/verify` usa el mismo control de origen/CSRF. Una actualización atómica exige challengeId/HMAC/vigencia/fallos; consume el código una vez y marca el intento en progreso. Un fallo incrementa el contador de forma condicionada. La sesión opaca se rota, se guarda con principal `candidate`, `invitationId` y expiración mínima entre dos horas y la invitación; cada petición revalida sesión, invitación y retención. La sesión del recruiter nunca autoriza rutas de candidato, ni viceversa.
- Mailpit se configura en modo local mediante su API HTTP de pruebas y un adaptador restringido a loopback. Ante fallo de envío se comunica que no pudo entregarse y se permite reintentar conforme a los límites; el código no se devuelve en HTTP al postulante ni logs. La UI no almacena tokens/códigos en `localStorage` ni `sessionStorage`.
- La pantalla del postulante es deliberadamente breve: solicitar código, introducirlo, reintentar/reanudar, entender vencimiento y estado; T-06 añadirá progreso/preguntas/revisión con UX-02 una vez que existan endpoints de respuestas. La interfaz del recruiter ubica invitaciones en el publicado y ofrece enlace copiable sin exponer datos de otros recruiters.

## Risks / Trade-offs

- Correo electrónico acredita acceso al buzón, no identidad ni un segundo factor NIST. La interfaz y la documentación lo nombran así; no se promete MFA. [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) guía mensajes y límites; [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) guía cookie y rotación.
- Mailpit puede aceptar un mensaje y fallar antes de la respuesta. Se permite pedir otro código tras el intervalo; el anterior se invalida. No se inserta otra invitación ni se devuelve código por la API del producto.
- Un código consumido y una sesión que falla al crearse requieren solicitar otro código. La prioridad es impedir reutilización concurrente.
- La URL del enlace puede quedar en historial del navegador. El fragmento evita enviarla como referer; el postulante necesita además código del correo. En producción se exigirá HTTPS y política de correo/retención revisada.

## Migration Plan

No migrar documentos existentes: `auth.lastRequestedAt` es opcional y la invitación actual ya tiene los demás campos. Configurar Mailpit local, compilar, probar en base aislada y demostrar con cuentas ficticias. Revertir esta rama retira endpoints/UI sin transformar screenings publicados.

## Open Questions

Antes de usar datos reales: responsable y contacto del aviso de privacidad, proveedor SMTP, dominio HTTPS y prueba de entrega/retención. No bloquean la demo ficticia.
