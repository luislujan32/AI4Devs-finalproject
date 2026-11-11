# Demo pública para la entrega final

La demo usa una aplicación Docker en [Render Free](https://render.com/docs/free) y una base [MongoDB Atlas Free](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/). El contenedor sirve React, la API y un buzón de prueba en la misma URL. Los datos de producto persisten en Atlas. Mailpit captura solo correos ficticios; se puede probar la invitación y el código sin un dominio ni un proveedor de correo externo.

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

Generar cada secreto por separado con un gestor de contraseñas o con Node.js: `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Cargar los valores en el panel de Render. La aplicación usa el [origen HTTPS que provee Render](https://render.com/docs/environment-variables#all-runtimes). Si se configura `PUBLIC_ORIGIN` explícitamente, debe coincidir con el origen HTTPS sin barra final.

El arranque crea `revisor@example.test` y carga las quince preguntas aprobadas. Al reiniciar se conservan cuenta y datos. Mantener la contraseña del recruiter mientras se reutilice esta base; el arranque detecta una contraseña distinta y no reemplaza la cuenta.

También se puede usar **Generate** en Render para los tres secretos. Guardar las contraseñas de la app y del buzón para entregarlas al revisor. No volver a generarlas en una base ya aprovisionada. La contraseña del usuario de Atlas es otra credencial: se incorpora a `MONGODB_URI` y no se comparte con el revisor.

## Cómo probar como revisor

La URL se incorpora al README después de verificar el despliegue. Compartir las contraseñas ficticias por el canal de entrega acordado para el revisor, sin publicarlas en Git.

1. Abrir la app e iniciar sesión como `revisor@example.test` con la contraseña de demo. Crear un screening de Tecnología, agregar una pregunta Sí/No y marcarla requerida y puntuable. Configurar Sí = 100, No = 0, peso 3 y umbral 70. Marcar Sí como única respuesta que cumple el requisito excluyente. Revisar y publicar.
2. En **Postulantes**, enviar una invitación a un correo nuevo que termine en `@example.test`, por ejemplo `alex-demo-01@example.test`. Abrir **/buzon/** en la misma URL e ingresar con el usuario `revisor` y la contraseña del buzón. Abrir el correo y seguir el enlace. El enlace funciona una sola vez; se puede usar una ventana privada para separar los roles.
3. Como postulante, elegir **No**, guardar avance y cerrar acceso. Pedir un código, leerlo en el buzón y retomar la respuesta. Revisar, confirmar y enviar; verificar el recibo.
4. Como reclutador, abrir el informe: muestra 0/100 y el requisito incumplido. Registrar **Continuar** con un motivo ficticio y comprobar que la decisión queda separada del resultado. Cerrar el SC y volver a abrir su informe.

## Comprobaciones y límites

- El buzón solicita credenciales y el acceso web es de lectura. No se usan direcciones, nombres ni respuestas reales. La base y sus credenciales están aisladas del desarrollo local.
- Render Free duerme tras 15 minutos sin visitas. La primera carga puede demorar alrededor de un minuto. Un reinicio puede vaciar el buzón; se puede pedir un código nuevo y retomar el intento conservado en MongoDB.
- Verificar el plan Free y los límites del workspace. Según [Render](https://render.com/docs/faq#all-of-my-services-run-on-free-instances-can-i-still-be-billed), sin método de pago el exceso de cuota suspende servicios o compilaciones. Si ya hay un método cargado, revisar los límites antes de desplegar.
- Antes de entregar: probar la URL desde una ventana privada, verificar login HTTPS, buzón sin credenciales, invitación, código, envío e informe; capturar evidencia y actualizar los enlaces. La prueba del contenedor en local no acredita el despliegue público.

**Verificado en local, 06/11/2026:** 64 pruebas unitarias/de integración, smoke y un E2E en Chromium. La imagen Linux amd64 inició con 512 MiB y 0,5 CPU contra un MongoDB aislado. Se verificaron banco de 15 preguntas, cookies seguras y enlaces con origen HTTPS, invitación y código, acceso anónimo al buzón rechazado, escrituras públicas bloqueadas y apertura de un mensaje en Chromium con credenciales. El reinicio conservó el screening y la invitación en MongoDB. En Render queda comprobar TLS y conexión real con Atlas.
