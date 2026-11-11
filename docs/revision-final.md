# Revisión de Screeningroom — entrega final

[Volver al README](../readme.md) · [Evidencia y límites](entrega-final-verificacion-2026-11-11.md) · [Registro de IA](../prompts.md).

## Acceso

- **Aplicación:** https://screeningroom-ll-demo.onrender.com
- **Recruiter de prueba:** `revisor@example.test`.
- **Contraseña de la aplicación:** Luis debe facilitarla por el canal privado de la entrega antes de enviar el formulario. Es la contraseña de demo guardada al configurar `DEMO_RECRUITER_PASSWORD`; no está publicada en Git.
- **Postulante:** no necesita una cuenta. Para probar el correo real, invitar a una dirección propia o expresamente autorizada y usar nombre/respuestas ficticios.
- **Alternativa sin correo externo:** invitar a una dirección nueva `@example.test` y leerla en [el buzón de pruebas](https://screeningroom-ll-demo.onrender.com/buzon/), usuario `revisor`, con su contraseña independiente. Este acceso es opcional para el recorrido con correo propio.

Si Render muestra que la aplicación está despertando, esperar alrededor de un minuto y recargar. Las contraseñas del revisor no son las credenciales de Atlas, Render o Brevo ni el secreto de sesión.

## Recorrido principal y resultados esperados

Usar un SC nuevo y una ventana privada para el candidato, manteniendo la sesión recruiter en la ventana principal. Así se evita mezclar los dos roles. El nombre y las respuestas deben ser ficticios aunque el correo sea propio.

| Paso | Acción | Resultado esperado |
| --- | --- | --- |
| 1. Crear | Iniciar sesión y elegir **Crear screening**. Título «Revisión final · prueba» y área Tecnología. Agregar una pregunta Sí/No: criterio «Control de versiones», pregunta «¿Trabajaste con control de versiones?» | El borrador conserva título, área y pregunta al terminar de guardar y recargar |
| 2. Configurar | Marcar respuesta requerida y puntuable; Sí = 100, No = 0, peso 3. Activar requisito excluyente y marcar solo Sí como válida. En Revisión, umbral 70 y confirmar revisión | La configuración explica puntuación y excluyente; puede publicarse sin errores |
| 3. Publicar e invitar | Publicar y abrir **Postulantes → Invitar postulante**. Usar correo propio/autorizado y nombre «Alex Demo» | Aparece una fila pendiente y llega el correo con el enlace; el buzón Mailpit solo se usa para `example.test` |
| 4. Responder y retomar | Abrir el enlace recibido en la ventana privada. Elegir **No**, **Guardar avance** y **Cerrar acceso**. Pedir un código, leer el correo y acceder nuevamente | El primer enlace permite acceso sin código adicional; al retomar se recupera la respuesta guardada |
| 5. Enviar | Revisar respuestas, confirmar el check y enviar. Recargar el recibo | El envío guarda cambios pendientes; aparece **Respuestas enviadas** y ya no permite editar |
| 6. Ver informe | Volver al recruiter, recargar Postulantes y abrir el informe del candidato | Puntaje **0/100**, umbral **70** y requisito incumplido, con evidencia de «No». El resultado no es una decisión automática de contratación |
| 7. Decidir | Elegir **Registrar decisión → Continuar** e indicar «Revisar experiencia equivalente en entrevista». Volver a la lista y reabrir el informe | El motivo es obligatorio por el resultado adverso. La decisión queda visible y persistida, separada del cálculo |
| 8. Cerrar | En **Acciones del SC**, cerrar este SC de prueba y confirmar. Recargar y reabrir el informe | El SC queda **Cerrado**, no admite nuevas invitaciones y conserva informe/decisión. Las invitaciones previas mantienen su vigencia |

Para comprobar un resultado favorable, usar otro correo autorizado o una dirección ficticia nueva y responder **Sí**: debe obtener 100/100 y cumplir el excluyente. No es necesario para demostrar el recorrido principal.

## Edición para futuras invitaciones

En un SC publicado, **Editar para nuevas invitaciones** prepara un borrador de cambios del mismo SC. Al publicar ese borrador, las invitaciones nuevas fijan la nueva versión. Las ya emitidas mantienen su cuestionario, umbral y reglas originales, incluso si todavía no se respondieron. [Contrato y comprobaciones de versiones](screening-versions.md).

## Pruebas automatizadas y ejecución local

La [guía de desarrollo](desarrollo.md#preparar-y-ejecutar) indica Node.js, Docker, variables, aprovisionamiento y arranque. Permite generar credenciales ficticias propias sin necesitar las de la demo pública.

| Verificación | Alcance |
| --- | --- |
| `npm run check` | Tipos, lint, compilación de frontend/backend y OpenSpec |
| `npm run test:persistence` | 14 pruebas de persistencia |
| `npm run test:auth` | 13 pruebas de acceso |
| `npm run test:screenings` | 24 pruebas de autoría, versiones y consultas |
| `npm run test:candidate` | 7 pruebas de invitaciones/acceso |
| `npm run test:attempt` | 6 pruebas de cálculo puro y envío/guardado HTTP |
| `npm run test:mail` | 7 pruebas de transporte/límites de correo, con Brevo simulado |
| `npm run smoke` | Disponibilidad, recursos compilados y persistencia |
| `npm run test:e2e` | Dos E2E en Chromium: los dos roles, correo, reanudación, envío, informe, decisión y cierre; candidato a 375 × 812 px |

Las suites y el E2E usan bases aisladas, datos ficticios y Mailpit. La configuración Brevo del E2E no envía correos externos. La [recepción real comprobada](correo-brevo.md#prueba-real-del-11112026) es evidencia manual independiente. Los resultados y ejecuciones de CI se enlazan en [la verificación final](entrega-final-verificacion-2026-11-11.md).

## Alcance y límites

Cuatro capacidades están implementadas: configuración/publicación, invitación/respuesta, informe determinista y decisión humana. T-04, sugerencias de preguntas mediante IA, continúa sin implementar y su alcance final está pendiente de decisión explícita. T-09 sigue parcial: borrado anticipado y gestión operativa de privacidad. Estas funciones no deben interpretarse como disponibles por aparecer en el diseño original.

La demo sirve para revisión académica voluntaria, no para evaluar postulantes reales. Brevo envía únicamente invitación y código; no recibe respuestas ni informes. El buzón ficticio es compartido y efímero; los datos de producto y las sesiones persisten en Atlas. Hay un límite de 50 intentos de correo externo por día UTC, además de los límites por invitación/IP; la aceptación del proveedor no garantiza recepción y no hay webhooks de entrega/rebote.

## Cierre formal

1. Resolver el estado de T-04 y registrar las limitaciones de T-09.
2. Entregar al revisor la contraseña de la aplicación por un canal privado; facilitar la del buzón solo si se ofrece el recorrido ficticio.
3. Consolidar código, README, prompts y evidencias en **`final-project-LL`**, desde el estado verificado. Conservar `finalproject-LL` como entrega 2.
4. Comprobar el enlace de esa rama y enviar [Typeform](https://lidr.typeform.com/proyectoai4devs), seleccionando entrega final y usando el correo del calendario de formación.

El código se comparte desde el fork público propio. No se necesita un PR al repositorio del máster ni un video obligatorio para esta modalidad con URL pública y código accesible. La rama final y el formulario todavía deben completarse; esta guía no acredita por sí sola su envío.
