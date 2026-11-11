# Entrega final — verificación del 11/11/2026

## Estado

[Demo pública](https://screeningroom-ll-demo.onrender.com) · [buzón de pruebas](https://screeningroom-ll-demo.onrender.com/buzon/) · [instrucciones para el revisor](demo-publica.md#cómo-probar-como-revisor).

El código funcional, las pruebas y el despliegue están preparados. Falta completar el recorrido público autenticado, conservar sus capturas, compartir las dos contraseñas de revisión y consolidar la rama de entrega. Este documento distingue la evidencia local y de CI de lo observado en la infraestructura pública.

## Pruebas automatizadas

- 64 pruebas unitarias/de integración: persistencia 14, acceso 13, screenings 24, invitaciones 7 e intento/evaluación 6.
- Smoke de la API y comprobaciones de tipos, lint, compilación y OpenSpec.
- Un E2E en Chromium: creación/publicación, invitación, acceso por correo, guardado, salida y reanudación por código, envío, informe, decisión divergente con motivo y cierre con informe disponible. Usa una base aislada y datos ficticios.
- [GitHub Actions del commit desplegado `a77466a`](https://github.com/luislujan32/AI4Devs-finalproject/actions/runs/43016005051): completado correctamente, incluyendo E2E. Se fijó Ubuntu 22.04 para mantener compatibilidad del contenedor MongoDB utilizado en CI.

## Despliegue público observado

- Render: servicio Docker **screeningroom-ll-demo**, plan **Free**, Virginia. Rama `feature/entrega-final-demo-LL`, commit `a77466a`; despliegue manual exitoso. Despliegue automático desactivado.
- Atlas: proyecto independiente **Screeningroom Demo**, clúster **screeningroom-demo**, tier **Free**, base `screeningroom_demo_public`. Usuario de aplicación limitado a `readWrite` en esa base.
- Acceso de red: `74.220.49.0/24` y `74.220.57.0/24`, mostrados por Render y autorizados expresamente por Luis. Ambas reglas quedaron activas; son rangos compartidos de Render, con autenticación de base obligatoria.
- La aplicación mostró el formulario de acceso en su URL HTTPS. `/api/health/ready` devolvió `status: ready` y `database: connected`.
- Luis creó el usuario de base e introdujo los secretos directamente en los paneles. No se incorporan a código, capturas públicas ni este documento.

El primer despliegue falló antes de configurar el acceso de red. Después de activar ambos rangos se desplegó el mismo commit correctamente. La pantalla de espera de Render no se consideró evidencia de que la aplicación estuviera lista.

![Acceso público de Screeningroom](evidencias/entrega-final-acceso-2026-11-11.png)

## Pendiente de verificación pública

- Acceder a la app y al buzón con las credenciales de revisión.
- Repetir el flujo de los dos roles en la URL pública, incluyendo retomar mediante código, envío, informe, decisión y cierre.
- Conservar capturas del recibo y del informe sin enlaces de acceso ni secretos.
- Entregar las contraseñas de la app y del buzón al revisor mediante el canal acordado y consolidar la rama `finalproject-LL` tras verificarla.

## Límites conocidos

Solo se admiten datos ficticios y correos `@example.test`. El buzón es compartido entre revisores y efímero; Atlas conserva los datos de producto. La instancia gratuita puede dormir y necesitar un arranque en frío. La prueba local del contenedor usó 0,5 CPU y 512 MiB; Render Free ofrece 0,1 CPU y 512 MiB, por lo que no se atribuye equivalencia de rendimiento.

La generación de preguntas mediante IA (T-04), el borrado anticipado y la operación completa de privacidad (T-09) siguen pendientes. La creación manual y el banco están disponibles; la evaluación es determinista. El correo externo y el uso con postulantes reales quedan fuera de esta demo académica.
