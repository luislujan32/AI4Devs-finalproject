# Invitaciones y acceso del postulante — T-05

[README](../readme.md) · [Reglas de producto](producto.md) · [UX-02](backlog.md#ux-02--formulario-del-postulante).

T-05 permite crear invitaciones individuales para un screening publicado propio y verificar el correo ficticio del postulante. El acceso ya funciona con MongoDB y Mailpit locales. La rama dependiente `feature/candidate-attempt-T07-LL` añade [cuestionario, guardado, revisión y envío](candidatos-formulario.md); un enlace por sí solo nunca muestra preguntas.

El [cierre posterior de un SC](resultados-recruiter.md) impide nuevas invitaciones, pero las ya enviadas conservan su plazo original de siete días y pueden terminarse.

## Recorrido local

1. Iniciar MongoDB y Mailpit con `npm run infra:up`, configurar `.env` y ejecutar la app según [desarrollo](desarrollo.md). Mailpit se abre en `http://127.0.0.1:8026`.
2. Entrar como recruiter ficticio, abrir un screening publicado e introducir un correo terminado en `example.test`. El nombre es opcional.
3. En Postulantes, enviar una invitación. Mailpit recibe un mensaje con el enlace `#invite=<publicId>` y el recruiter también puede copiarlo desde la lista. El enlace por sí solo **no autoriza** ver el cuestionario.
4. Abrir el enlace, pedir el código, leerlo en Mailpit e introducir los seis dígitos. El correo demuestra acceso a ese buzón de pruebas, no identidad civil. Una sesión vigente vuelve a abrir el mismo intento.

La API envía tanto la invitación inicial (HTML y texto con enlace) como el código posterior a Mailpit mediante su [API HTTP local de pruebas](https://mailpit.axllent.org/docs/usage/sending-messages/), restringida a `127.0.0.1`; no acepta direcciones reales ni envía correo fuera del equipo. Si falla el primer envío, se informa el error y se revierte la invitación aún intacta. Antes de trabajar con datos reales habrá que decidir proveedor de correo, HTTPS, avisos de privacidad y borrado operativo.

## Rutas

Todas las rutas están bajo `/api`. Las mutaciones exigen `Origin` permitido y `X-CSRF-Token`; el preacceso obtiene token/cookie en `GET /auth/csrf`. Las rutas del recruiter requieren su sesión y las del candidato su propia sesión.

| Ruta | Comportamiento |
| --- | --- |
| `POST /screenings/:id/invitations` | Recruiter propietario; `{candidateEmail, candidateName?}`; solo publicado, correo `example.test`; devuelve invitación/enlace opaco sin código |
| `GET /screenings/:id/invitations` | Lista hasta 100 invitaciones propias, sin HMAC ni desafíos |
| `POST /candidate/access/request` | Preacceso; `{publicId}`; entrega código a Mailpit y devuelve solo estado/espera |
| `POST /candidate/access/verify` | Preacceso; `{publicId, code}`; consume desafío y crea/rota cookie de sesión candidata |
| `GET /candidate/session` | Revalida sesión, invitación y plazo de conservación; devuelve estado propio sin preguntas ni reglas internas |
| `POST /candidate/logout` | Revoca sesión candidata |

La invitación dura siete días y se conserva como máximo 90 días desde la creación. El código aleatorio dura diez minutos, permite cinco fallos y se consume una vez. Entre envíos deben pasar 60 segundos; máximo cinco envíos por invitación/hora, más límite por IP. Reenviar reemplaza el código anterior sin reiniciar la ventana horaria. La sesión candidata dura hasta dos horas y nunca supera la invitación. Usa una cookie distinta de la del recruiter, de modo que verificar un código en el mismo navegador no cierra la sesión del recruiter. MongoDB puede limpiar por TTL más tarde: cada acceso aplica los plazos directamente. El código se guarda como HMAC vinculado a invitación y desafío; el valor en claro no aparece en respuestas del producto, logs ni almacenamiento del navegador.

`401` significa sesión o código inválido/vencido; `403`, origen/CSRF; `404`, invitación inexistente, vencida o fuera de retención; `409`, correo ya invitado a ese screening; `422`, forma inválida; `429`, límite temporal; `503`, fallo de entrega local. Un recruiter no puede usar su sesión en rutas candidatas y viceversa. Cada sesión candidata se limita a una sola invitación; el cliente no elige otro ID para leer un intento.

## Evidencia local del 28/09/2026

`npm run test:candidate` pasó con API HTTP, MongoDB aislado y Mailpit real: propiedad/borrador/duplicado, correo ficticio, CSRF, código recibido y de un uso, cinco fallos, reenvío y límite horario, verificaciones concurrentes, separación de principales, revocación por retención, logout. El test elimina solo su base aleatoria y deja los mensajes de prueba en Mailpit local. `npm run check` y regresiones se ejecutan antes de integrar. El navegador integrado mostró creación de invitación, enlace, solicitud, lectura del buzón, verificación y sesión tras recarga. El control de viewport del navegador integrado no aplicó el ancho móvil solicitado; la comprobación visual a 375 px sigue pendiente.

La evidencia de este ticket no cubría el cuestionario ni la evaluación; su implementación posterior está en [T-07/T-06](candidatos-formulario.md). Tampoco acredita E2E académico ni entrega de correo real.
