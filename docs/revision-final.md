# Revisión de Screeningroom — entrega final

[Volver al README](../readme.md) · [Evidencia y límites](entrega-final-verificacion-2026-11-11.md) · [Registro de IA](../prompts.md).

## Acceso

- **Aplicación:** https://screeningroom-ll-demo.onrender.com
- **Recruiter público de prueba:** `demo@example.test`.
- **Contraseña pública de demo:** `ScreeningroomDemo2026`.
- **Postulante:** no necesita una cuenta. Para probar el correo real, invitar a una dirección propia o expresamente autorizada y usar nombre/respuestas ficticios.
- **Alternativa con Mailpit:** las direcciones `@example.test` llegan al [buzón de pruebas](https://screeningroom-ll-demo.onrender.com/buzon/), cuyo acceso conserva Luis de forma privada. La contraseña pública de aplicación no abre ese buzón; el recorrido recomendado del revisor usa una dirección propia de pruebas.

**Cuenta compartida:** todos sus screenings, correos de invitados, respuestas y decisiones son visibles para otras personas que usen este acceso. Mantener nombres y respuestas ficticios; usar una dirección propia/autorizada de pruebas que se acepte compartir. La cuenta privada anterior y sus registros siguen separados. [Alta y verificación](acceso-publico-demo-2026-11-12.md).

Si Render muestra que la aplicación está despertando, esperar alrededor de un minuto y recargar. La contraseña publicada sirve únicamente para esta cuenta de la app, no para Atlas, Render, Brevo ni el buzón privado.

## Recorrido principal y resultados esperados

Hay un ejemplo publicado, **«Demo pública · Soporte técnico»**, sin postulantes al preparar el acceso. Para comprobar todas las acciones, usar un SC nuevo y una ventana privada para el candidato, manteniendo la sesión recruiter en la ventana principal. El nombre y las respuestas deben ser ficticios aunque el correo sea propio; la dirección de prueba será visible en la cuenta compartida.

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

Cuatro capacidades están implementadas: configuración/publicación, invitación/respuesta, informe determinista y decisión humana. Luis aprobó el 11/11 aplazar T-04, sugerencias de preguntas mediante IA, para después de esta entrega; su diseño sigue en el backlog y no está disponible. T-09 sigue parcial: borrado anticipado y gestión operativa de privacidad. [Decisión y trazabilidad](backlog.md#decisión-de-alcance-final--11112026).

La demo sirve para revisión académica voluntaria, no para evaluar postulantes reales. Brevo envía únicamente invitación y código; no recibe respuestas ni informes. El buzón ficticio es compartido y efímero; los datos de producto y las sesiones persisten en Atlas. Hay un límite de 50 intentos de correo externo por día UTC, además de los límites por invitación/IP; la aceptación del proveedor no garantiza recepción y no hay webhooks de entrega/rebote.

## Cierre formal

El alcance queda confirmado con T-04 aplazado y T-09 parcial documentado. Código, README, prompts y evidencias se comparten en [**`final-project-LL`**](https://github.com/luislujan32/AI4Devs-finalproject/tree/final-project-LL); `finalproject-LL` conserva la entrega 2.

1. El acceso público de aplicación ya está en el README y en esta guía; no requiere recibir una contraseña por otro canal. La cuenta privada y Mailpit mantienen sus credenciales reservadas.
2. Enviar [Typeform](https://lidr.typeform.com/proyectoai4devs), seleccionando entrega final, pegando el enlace de `final-project-LL` y usando el correo del calendario de formación.

El código se comparte desde el fork público propio. No se necesita un PR al repositorio del máster ni un video obligatorio para esta modalidad con URL pública y código accesible. Preparar la rama y su acceso no acredita el envío de Typeform.
