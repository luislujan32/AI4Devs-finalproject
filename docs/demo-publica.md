# Demo pública para la entrega final

La demo usa una aplicación Docker en [Render Free](https://render.com/docs/free) y una base [MongoDB Atlas Free](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/). El contenedor sirve React, la API y un buzón de prueba en la misma URL. Los datos de producto persisten en Atlas. Brevo envía las invitaciones y códigos al correo personal autorizado del revisor; Mailpit captura únicamente direcciones ficticias.

**Publicada y verificada el 11/11/2026:** [Screeningroom](https://screeningroom-ll-demo.onrender.com) · [guía rápida del revisor](revision-final.md) · [buzón de pruebas](https://screeningroom-ll-demo.onrender.com/buzon/) · [estado y evidencia](entrega-final-verificacion-2026-11-11.md). Se verificaron acceso, conexión con Atlas y recorrido autenticado de los dos roles, incluido el cierre con resultados conservados.

El 11/11 también se activó y verificó [correo real con Brevo](correo-brevo.md), sin comprar un dominio. La guía de revisión siguiente usa este recorrido y conserva la alternativa ficticia con Mailpit.

## Configurar el despliegue

1. En Atlas, crear un clúster **Free** y un usuario con permiso `readWrite` solo para `screeningroom_demo_public`. Usar esa base en la ruta de la URI de conexión; conservar los parámetros del driver y codificar los caracteres especiales de la contraseña según corresponda. No cargar datos de ejemplo de Atlas.
2. En Render, crear un **Web Service**, conectar el fork de Luis y elegir la rama de preparación de la final. Elegir **Docker**, el `Dockerfile` de la raíz y el tipo de instancia **Free**, sin disco de pago. Usar `/api/health/ready` como health check.
3. En Atlas, permitir los [rangos de salida que muestra Render](https://render.com/docs/outbound-ip-addresses) para ese servicio. Mantener el acceso restringido a esos rangos.
4. Configurar estas variables en Render y desplegar:

| Variable | Valor |
| --- | --- |
| `MONGODB_URI` | URI de Atlas con la base `screeningroom_demo_public` |
| `SESSION_SECRET` | Secreto aleatorio, al menos 32 caracteres, estable entre despliegues |
| `DEMO_RECRUITER_PASSWORD` | Contraseña aleatoria del revisor de la app, de 16 a 128 caracteres base64 o base64url |
| `DEMO_MAIL_PASSWORD` | Otra contraseña aleatoria para el buzón, de 16 a 128 caracteres base64 o base64url |
| `MAIL_PROVIDER` | `brevo` para habilitar correo real; `mailpit` para solo direcciones ficticias |
| `BREVO_API_KEY` | Clave privada de API de Brevo, necesaria con proveedor `brevo` |
| `MAIL_FROM_EMAIL` | Remitente verificado de Brevo, necesario con proveedor `brevo` |

Generar cada secreto por separado con un gestor de contraseñas o con Node.js: `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Cargar los valores en el panel de Render. La aplicación usa el [origen HTTPS que provee Render](https://render.com/docs/environment-variables#all-runtimes). Si se configura `PUBLIC_ORIGIN` explícitamente, debe coincidir con el origen HTTPS sin barra final.

El arranque crea `revisor@example.test` y carga las quince preguntas aprobadas. Al reiniciar se conservan cuenta y datos. Mantener la contraseña del recruiter mientras se reutilice esta base; el arranque detecta una contraseña distinta y no reemplaza la cuenta.

También se puede usar **Generate** en Render para los tres secretos. Guardar las contraseñas de la cuenta privada y del buzón; no volver a generarlas en una base ya aprovisionada. La contraseña de Atlas se incorpora a `MONGODB_URI` y no se comparte. Desde el 12/11, el revisor usa una cuenta pública separada, aprovisionada expresamente después del despliegue y conservada en Atlas; no reemplaza la cuenta del arranque. [Registro del alta](acceso-publico-demo-2026-11-12.md).

## Cómo probar como revisor

Abrir [la aplicación](https://screeningroom-ll-demo.onrender.com). Acceso público: **`demo@example.test` / `ScreeningroomDemo2026`**. La [guía rápida](revision-final.md) reúne acciones y resultados esperados. Es una cuenta compartida: otros revisores pueden ver/modificar sus datos, incluidos correos. Usar nombres/respuestas ficticios y una dirección propia/autorizada de pruebas que se acepte compartir. La cuenta anterior, Mailpit, Atlas, Render, Brevo y el secreto de sesión mantienen sus credenciales privadas.

1. Abrir la app e iniciar sesión como `demo@example.test` con la contraseña pública indicada. Se ofrece un ejemplo publicado sin postulantes; para recorrer creación/publicación, crear un SC de Tecnología con una pregunta Sí/No requerida y puntuable. Configurar Sí = 100, No = 0, peso 3 y umbral 70; Sí como única respuesta que cumple el excluyente. Revisar y publicar.
2. En **Postulantes**, invitar al propio correo personal usando un nombre ficticio. Leer el mensaje en la bandeja de correo (revisar spam si hace falta) y seguir el enlace. Funciona una sola vez; se puede usar una ventana privada para separar los roles. Para probar sin correo externo, usar una dirección nueva `@example.test` y abrir **/buzon/** con las credenciales opcionales.
3. Como postulante, elegir **No**, guardar avance y cerrar acceso. Pedir un código, leerlo en el mismo correo y retomar la respuesta. Revisar, confirmar y enviar; verificar el recibo.
4. Como reclutador, abrir el informe: muestra 0/100 y el requisito incumplido. Registrar **Continuar** con un motivo ficticio y comprobar que la decisión queda separada del resultado. Cerrar el SC y volver a abrir su informe.

## Comprobaciones y límites

- El buzón solicita credenciales y su acceso web es de lectura. Solo contiene mensajes ficticios; los correos personales se envían por Brevo. Usar únicamente una dirección propia o autorizada, con nombres y respuestas ficticios. La base y sus credenciales están aisladas del desarrollo local.
- La app limita a 50 intentos externos por día UTC las invitaciones y códigos. La aceptación del proveedor no garantiza recepción en bandeja; el recorrido de recepción real fue confirmado con el correo autorizado de Luis. No se implementan webhooks de rebote/entrega.
- Render Free duerme tras 15 minutos sin visitas. La primera carga puede demorar alrededor de un minuto. Un reinicio puede vaciar el buzón; se puede pedir un código nuevo y retomar el intento conservado en MongoDB.
- Verificar el plan Free y los límites del workspace. Según [Render](https://render.com/docs/faq#all-of-my-services-run-on-free-instances-can-i-still-be-billed), sin método de pago el exceso de cuota suspende servicios o compilaciones. Si ya hay un método cargado, revisar los límites antes de desplegar.
- Antes de entregar: probar la URL desde una ventana privada, verificar login HTTPS, buzón sin credenciales, invitación, código, envío e informe; capturar evidencia y actualizar los enlaces. La prueba del contenedor en local no acredita el despliegue público.

**Ampliación con Brevo verificada, 11/11/2026:** se desplegó `d1c7e0a` y se envió la invitación al remitente expresamente autorizado por Luis. Confirmó recepción y enlace; Brevo registró entrega de invitación y códigos. Se comprobó guardar/salir/retomar con otro código real, envío, recibo tras recarga e informe 100/100 con datos ficticios. [Evidencia del correo real](correo-brevo.md#prueba-real-del-11112026).

**Verificado en local, 06/11/2026:** 64 pruebas unitarias/de integración, smoke y un E2E en Chromium. La imagen Linux amd64 inició con 512 MiB y 0,5 CPU contra un MongoDB aislado. Se verificaron banco de 15 preguntas, cookies seguras y enlaces con origen HTTPS, invitación y código, acceso anónimo al buzón rechazado, escrituras públicas bloqueadas y apertura de un mensaje en Chromium con credenciales. El reinicio conservó el screening y la invitación en MongoDB.

**Verificado en Render/Atlas, 11/11/2026:** despliegue exitoso del commit `a77466a`, página de acceso bajo HTTPS y comprobación de disponibilidad con `status: ready` y `database: connected`. Se mantuvieron los dos planes Free y se habilitaron únicamente los rangos de salida indicados por Render. Tras el ingreso de Luis a la app y al buzón, se verificaron creación/publicación, invitación, acceso directo del correo sin código, guardado/salida/reanudación con código, envío y recibo conservado tras recargar. El informe mostró 0/100 y el excluyente incumplido; continuar exigió motivo y la decisión se mostró en lista e informe sin alterar el cálculo. Tras el cierre autorizado por Luis, la recarga conservó estado cerrado, informe y decisión; la lista ya no ofreció enviar invitaciones. También se observó el arranque en frío de Render y la conservación de sesión e informe al volver la aplicación. [Capturas y pendientes](entrega-final-verificacion-2026-11-11.md).
