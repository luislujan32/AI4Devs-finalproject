# Respuestas y formulario del postulante — T-07 y T-06

[README](../readme.md) · [Contrato P-01 a P-08](producto.md) · [Acceso T-05](candidatos-acceso.md) · [UX-02](backlog.md#ux-02--formulario-del-postulante).

La rama `feature/candidate-attempt-T07-LL` conecta cuestionario, guardado y envío al intento autenticado. Usa solo invitaciones/correos ficticios. El candidato ve preguntas y sus respuestas, nunca puntajes, pesos, umbral, criterios de evaluación, exclusiones ni informe. La rama posterior `feature/recruiter-results-T08-LL` permite [consultar el informe y registrar una revisión humana](resultados-recruiter.md).

## Recorrido del candidato

Después de verificar el correo, aparece una pregunta por paso con progreso y navegación anterior/siguiente. Las preguntas estructuradas ofrecen sus opciones y «No puedo confirmarlo»; esta última se registra como desconocida. Una pregunta opcional sin respuesta permanece omitida. El texto libre no tiene opción desconocida. Las preguntas obligatorias se identifican y deben tener respuesta para enviar; desconocido satisface la interacción, pero deja la evaluación pendiente.

Los cambios entre pasos permanecen en la memoria de la pestaña. **Guardar avance** reemplaza el borrador con su revisión esperada; solo después de HTTP 200 se muestra estado guardado. Un error o conflicto deja la edición visible; recargar la versión del servidor exige confirmar el descarte local. Se avisa al salir o recargar con cambios sin guardar.

La revisión final muestra respuesta, desconocido u omisión en cada pregunta y permite volver a editar. El envío se habilita con todas las obligatorias respondidas y confirmación explícita de que cierra la edición. Si hay cambios locales, el botón **Guardar y enviar respuestas** guarda primero y después envía con la revisión confirmada; un error de guardado conserva la edición y detiene el envío. Tras el recibo solo se ve fecha y confirmación; una recarga conserva ese estado. Se explica que las respuestas se comparten con el recruiter, el plazo de conservación de 90 días desde la invitación y el carácter declarado de los datos. No se usa `localStorage` ni `sessionStorage`.

## API y concurrencia

Todas las rutas siguientes requieren sesión candidata propia; las escrituras, `Origin` y `X-CSRF-Token`.

| Ruta | Contrato |
| --- | --- |
| `GET /api/candidate/attempt` | Título, descripción, preguntas visibles, respuestas propias, estado y `answerRevision`; sin identificador arbitrario ni reglas internas |
| `PUT /api/candidate/attempt/answers` | `{expectedRevision, answers}` reemplaza el arreglo completo si el intento sigue abierto y la revisión coincide; devuelve respuestas/revisión confirmadas |
| `POST /api/candidate/attempt/submit` | `{expectedRevision}`; valida obligatorias, calcula P-01 a P-08 y guarda estado/fecha/informe en una actualización condicionada; recibo `{status:'submitted',submittedAt}` |

Cada respuesta tiene `questionId` y `kind` (`option` con `optionId`, `text` con `text`, o `unknown`). Se rechazan IDs/opciones ajenas o duplicadas, formas incompatibles, campos extra y texto vacío. El arreglo vacío es un borrador válido. El guardado usa `answerRevision`; una versión vieja o intento enviado devuelve 409 sin sobrescribir. El envío reintentado, incluso con una revisión anterior, devuelve el mismo recibo mientras la invitación siga vigente. Dos envíos simultáneos no crean dos informes.

El informe se calcula sin IA. El denominador incluye los pesos de **todas** las preguntas puntuables. Si falta una respuesta conocida de alguna, `score=null`, pero las contribuciones conocidas permanecen. Una respuesta excluyente conocida no aceptada prevalece sobre información faltante. Desconocido y omitido tienen evidencias diferentes; texto libre solo aporta evidencia. Se compara la suma ponderada con `umbral × suma de pesos` antes de redondear cualquier presentación. El informe es un apoyo a la revisión humana, no una decisión automática.

## Evidencia local del 29/09/2026

`npm run test:attempt` pasó con dos ejemplos puros P-01/P-03/P-08 y cuatro escenarios HTTP/MongoDB/Mailpit: proyección sin reglas, guardado/validación/reanudación, requerido/doble envío/recibo, guardados simultáneos y vencimiento. La BD de prueba se crea con nombre aleatorio y se elimina al terminar. El [CI de la rama](https://github.com/luislujan32/AI4Devs-finalproject/actions/runs/36584509325) también terminó correctamente. En navegador integrado, una invitación ficticia recorrió código, dos preguntas, navegación atrás/adelante con respuesta local, guardado, recarga, desconocido, revisión, confirmación, envío y recibo persistido. El control de viewport del navegador integrado no aplicó el ancho móvil; la inspección visual a 375 px sigue pendiente de permisos de control de pantalla del Mac. No se han hecho pruebas observadas con postulantes reales ni auditoría completa de accesibilidad.

La [revisión UX del 03/10](ux-feedback-2026-10-03.md) registra los cambios posteriores al flujo. La consulta del recruiter y el cierre de SC se documentan en [T-08](resultados-recruiter.md). El despliegue y el E2E académico se reservan para la entrega final.
