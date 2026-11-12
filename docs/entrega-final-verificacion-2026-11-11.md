# Entrega final — verificación del 11/11/2026

## Estado

[Demo pública](https://screeningroom-ll-demo.onrender.com) · [guía rápida del revisor](revision-final.md) · [buzón de pruebas](https://screeningroom-ll-demo.onrender.com/buzon/) · [configuración y recorrido](demo-publica.md#cómo-probar-como-revisor).

El código funcional, las pruebas y el despliegue están preparados. El recorrido público de los dos roles está verificado, incluido el cierre con resultados conservados tras recargar. Luis aprobó aplazar T-04. **Actualización del 12/11:** autorizó una cuenta de demo pública separada; URL, usuario y contraseña ya se incluyen en README/guía. Se comprobaron login, separación de datos y un ejemplo publicado sin postulantes. [Registro del acceso público](acceso-publico-demo-2026-11-12.md). La rama de entrega es [**`final-project-LL`**](https://github.com/luislujan32/AI4Devs-finalproject/tree/final-project-LL); el envío de Typeform sigue a cargo de Luis. El buzón ficticio mantiene acceso privado. Este documento distingue la evidencia local, de CI y pública.

## Pruebas automatizadas

- 71 pruebas unitarias/de integración: persistencia 14, acceso 13, screenings 24, invitaciones 7, intento/evaluación 6 y correo 7.
- Smoke de la API y comprobaciones de tipos, lint, compilación y OpenSpec.
- Dos E2E en Chromium, con configuración Mailpit y Brevo: creación/publicación, invitación, acceso por correo, guardado, salida y reanudación por código, envío, informe, decisión divergente con motivo y cierre con informe disponible. Usan bases aisladas y direcciones ficticias, sin enviar correo externo.
- [GitHub Actions del commit desplegado `a77466a`](https://github.com/luislujan32/AI4Devs-finalproject/actions/runs/43016005051): completado correctamente, incluyendo E2E. Se fijó Ubuntu 22.04 para mantener compatibilidad del contenedor MongoDB utilizado en CI.
- [GitHub Actions de la integración Brevo `bc84159`](https://github.com/luislujan32/AI4Devs-finalproject/actions/runs/43029389809): completado correctamente con las 71 pruebas, smoke y ambos E2E. El despliegue `d1c7e0a` incorpora esa implementación y documentación posterior.
- [GitHub Actions del PR de preparación final, cabeza `9df7804`](https://github.com/luislujan32/AI4Devs-finalproject/actions/runs/43071011321): completado correctamente. El cierre documental posterior debe comprobarse por separado; no se atribuye esta ejecución a commits futuros.
- [GitHub Actions del paquete documental `ba4c2a2`](https://github.com/luislujan32/AI4Devs-finalproject/actions/runs/43082855831): completado correctamente, incluidas las 71 pruebas, smoke y ambos E2E. La decisión de alcance posterior es documental y no modifica la implementación.

## Cierre documental y capturas locales del 11/11

Al contrastar las pautas finales se actualizaron README, configuración de ejemplo, guías de revisión y selección de workflows de IA. `npm run check` pasó de nuevo: tipos, lint, compilación y 15 elementos OpenSpec válidos. Se verificaron los archivos y anclas de los enlaces relativos de los documentos editados y el formato del diff.

Se volvió a ejecutar el recorrido Mailpit de los dos roles para generar cuatro capturas con una copia local del E2E existente, sin cambiar la suite versionada. Pasó creación/publicación, invitación, acceso, guardado/reanudación, envío, informe, decisión y cierre. La base temporal se limpió al terminar; los mensajes fueron ficticios. Este recorrido adicional de evidencia no aumenta el número de E2E de la suite ni sustituye la verificación pública descrita abajo. Las 71 pruebas tienen su evidencia de CI enlazada arriba; no se atribuye una nueva ejecución completa a este cambio documental.

- [Dashboard](evidencias/entrega-final-dashboard-local-2026-11-11.png), escritorio 1280 × 1100.
- [Revisión de configuración](evidencias/entrega-final-editor-local-2026-11-11.png), escritorio 1280 × 1100.
- [Postulantes](evidencias/entrega-final-postulantes-local-2026-11-11.png), escritorio 1280 × 1100.
- [Cuestionario](evidencias/entrega-final-cuestionario-local-2026-11-11.png), contenido completo con viewport móvil de 375 × 812.

Las capturas se inspeccionaron visualmente. Se esperó al guardado y a la carga de la lista; las imágenes de escritorio usan viewport para evitar el artefacto de barras fijas en la captura de página completa. Las vistas del recibo/informe público siguientes siguen correspondiendo a sus recorridos originales.

## Despliegue público observado

- Render: servicio Docker **screeningroom-ll-demo**, plan **Free**, Virginia. Rama `feature/entrega-final-demo-LL`, commit `a77466a`; despliegue manual exitoso. Despliegue automático desactivado.
- Atlas: proyecto independiente **Screeningroom Demo**, clúster **screeningroom-demo**, tier **Free**, base `screeningroom_demo_public`. Usuario de aplicación limitado a `readWrite` en esa base.
- Acceso de red: `74.220.49.0/24` y `74.220.57.0/24`, mostrados por Render y autorizados expresamente por Luis. Ambas reglas quedaron activas; son rangos compartidos de Render, con autenticación de base obligatoria.
- La aplicación mostró el formulario de acceso en su URL HTTPS. `/api/health/ready` devolvió `status: ready` y `database: connected`.
- Luis creó el usuario de base e introdujo los secretos directamente en los paneles. No se incorporan a código, capturas públicas ni este documento.
- Se actualizó después a `d1c7e0a` con Brevo configurado por Luis. Se verificó recepción real de invitación y códigos en el destinatario autorizado, reanudación, envío y un informe de 100/100. [Registro y capturas del correo real](correo-brevo.md#prueba-real-del-11112026).

El primer despliegue falló antes de configurar el acceso de red. Después de activar ambos rangos se desplegó el mismo commit correctamente. La pantalla de espera de Render no se consideró evidencia de que la aplicación estuviera lista.

![Acceso público de Screeningroom](evidencias/entrega-final-acceso-2026-11-11.png)

## Recorrido público autenticado

Luis confirmó el acceso a la app y al buzón con las credenciales guardadas. Se realizó esta prueba manual en Brave sobre el despliegue `a77466a`:

1. Crear **Soporte técnico · demo final** en Tecnología. Configurar una pregunta Sí/No sobre control de versiones, requerida, con peso 3, valores Sí = 100 y No = 0, requisito excluyente cumplido solo por Sí y umbral 70. El borrador se guardó y se publicó v1.
2. Invitar a **Alex Demo**, `alex-final-1111@example.test`. El correo llegó al buzón autenticado y su enlace abrió el cuestionario sin pedir código; el token de un uso desapareció de la URL.
3. Responder **No**, guardar y cerrar acceso. Pedir un código, leerlo en el buzón y retomar la misma respuesta guardada.
4. Revisar las respuestas. El envío estaba deshabilitado antes de confirmar la revisión; al confirmar y enviar apareció el recibo, conservado tras recargar, sin acciones de edición.
5. Recargar Postulantes: una respuesta recibida y una por revisar. Abrir el informe: **0/100**, umbral 70 y requisito excluyente incumplido, con la evidencia de la respuesta.
6. Elegir **Continuar**. El formulario rechazó el motivo vacío. Registrar un motivo ficticio de experiencia equivalente y volver a la lista: decisión **Continuar**, criterios **No cumple**, cero por revisar. Reabrir el informe conservó decisión y motivo sin modificar el cálculo.
7. Con autorización expresa de Luis, cerrar **Soporte técnico · demo final**. Recargar: estado **Cerrado**, informe 0/100, decisión **Continuar** y motivo conservados. Volver a Postulantes: no se ofrece invitar, se explica el cierre y el informe puede abrirse nuevamente.

Al retomar esta última comprobación, Render presentó su pantalla de arranque en frío. Tras despertar y recargar, la aplicación conservó la sesión del recruiter, el screening, las respuestas y la decisión. La primera solicitud de cierre no se había aplicado durante el arranque; se comprobó que seguía publicado antes de repetirla. Solo se dio por cerrado después de recibir la confirmación y verificarlo tras recargar.

![Recibo público tras recargar](evidencias/entrega-final-recibo-2026-11-11.png)

![Informe y decisión independiente del cálculo](evidencias/entrega-final-informe-2026-11-11.png)

![Evidencia del requisito y motivo de la decisión](evidencias/entrega-final-informe-detalle-2026-11-11.png)

![Informe conservado tras cerrar y recargar](evidencias/entrega-final-informe-cerrado-2026-11-11.png)

## Contraste con las pautas finales

Se contrastaron el checklist final y el gráfico facilitados por Luis con la [plantilla oficial](https://github.com/LIDR-academy-temp/AI4Devs-finalproject/blob/main/readme.md), el repositorio, el CI y el despliegue. Corresponde la **opción A**, con código en el fork público propio. Las pautas exigen 3–5 funcionalidades, unitarios/integración y al menos un E2E; hay cuatro capacidades operativas, 71 pruebas y dos E2E. La URL pública y las capturas aportan evidencia; en esta modalidad el video es opcional.

La documentación se reconcilia con el estado real: diagramas Render/Caddy/Atlas/Brevo/Mailpit, cifras actuales, estados de las cinco capacidades originales, variables de despliegue sin secretos y cinco workflows de IA seleccionados con el historial preservado. La generación IA no se presenta como implementada por haber empleado IA para construir el producto.

## Alcance confirmado y envío pendiente

- **Resuelto por Luis:** T-04 se aplaza para después de la entrega y conserva HU-02/P-07 y sus criterios en el backlog. La diferencia respecto de entrega 1 queda explícita. T-09 sigue parcial y sus límites permanecen visibles.
- **Rama académica:** **`final-project-LL`** contiene el paquete final; `finalproject-LL` conserva la entrega 2.
- **Acceso actualizado el 12/11:** cuenta pública independiente `demo@example.test`, con contraseña en README/guía, autorizada por Luis al no existir un campo para compartirla en Typeform. La cuenta anterior y Mailpit mantienen credenciales privadas. El acceso público ya está verificado; no queda una contraseña de app por enviar al revisor.
- **Envío formal pendiente:** Typeform con el enlace directo de la rama y el correo del calendario de formación. No hace falta un PR al máster; el PR interno #5 organiza la integración del fork y no formaliza la entrega.

## Límites conocidos

Se admiten correos personales autorizados para revisión mediante Brevo y `@example.test` mediante Mailpit; nombres y respuestas deben ser ficticios. El buzón de pruebas es compartido entre revisores y efímero; Atlas conserva los datos de producto. La instancia gratuita puede dormir y necesitar un arranque en frío. La prueba local del contenedor usó 0,5 CPU y 512 MiB; Render Free ofrece 0,1 CPU y 512 MiB, por lo que no se atribuye equivalencia de rendimiento.

La generación de preguntas mediante IA (T-04) está aplazada por decisión expresa de Luis. El borrado anticipado y la operación completa de privacidad (T-09) siguen pendientes. La creación manual y el banco están disponibles; la evaluación es determinista. El correo externo sirve para revisión académica voluntaria; el uso con postulantes reales queda fuera de esta demo.
