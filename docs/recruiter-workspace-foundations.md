# Espacio de trabajo del recruiter — primer bloque de la auditoría

04/10/2026. Implementación del cambio OpenSpec `recruiter-workspace-foundations`, derivado de [la auditoría C1–C6](ux-workspace-audit-2026-10-04.md). Se trabajó en el fork, con registros ficticios y sin cambiar P-01 a P-08.

## Comportamiento implementado

`GET /api/screenings` acepta `page`, `pageSize` (1–50), `status` y `search`; devuelve `screenings`, `total`, página, tamaño y resumen global. Cada fila tiene conteos de invitaciones no purgadas y respuestas enviadas sin decisión. `GET /api/screenings/:id/invitations` acepta página, tamaño, búsqueda por nombre/correo, cola Por revisar y filtros de respuesta, resultado y decisión. Devuelve total del filtro y resumen del SC. Ambas consultas restringen por propietario y ordenan por creación e identificador. Los parámetros mal formados devuelven 422. Los totales no dependen de la página visible.

El recruiter tiene encabezado con navegación a Screenings y menú con su nombre. El dashboard distingue estados, muestra trabajo pendiente y filtros; Postulantes presenta recepción, criterios y decisión en columnas alineadas o tarjetas con etiquetas en móvil. Sección e informe se reflejan en la URL; Atrás devuelve a la lista sin perder el filtro/página durante la sesión de pantalla. El informe ofrece salto accesible a respuestas y obtiene el nombre desde su propia respuesta para enlaces directos.

La confirmación de invitación aparece una vez, se puede cerrar y desaparece al cambiar de tarea. Un fallo conserva correo y nombre y aclara que no se envió. El correo de Mailpit tiene asunto concreto, fecha/hora absoluta en zona argentina, enlace personal, URL alternativa y la misma explicación de recuperación en HTML y texto. No atribuye empresa ni soporte inexistentes.

La acción de copia dice **«Crear SC basado en este»** porque genera un SC independiente. La configuración de cada invitación sigue fija. La decisión de Luis —editar solo para futuras invitaciones— se implementó después en el cambio separado [screening-configuration-versions](screening-versions.md), manteniendo el mismo SC e historial.

## Evidencia y límites

`npm run check` pasó con Node 24; `test:screenings` 19/19, `test:candidate` 7/7 y `test:attempt` 6/6 con bases aisladas, MongoDB y Mailpit locales. Las pruebas agregadas recorren 101 SC y 101 postulantes, totales, filtros, búsqueda literal y aislamiento entre cuentas. En navegador, con base ficticia separada de 4 SC y 25 postulantes, se comprobó dashboard, filtro Por revisar, informe, Atrás, invitación y reflujo a 375 px sin desbordamiento del documento. El foco por teclado llegó a la confirmación de invitación. No es una prueba de usabilidad con recruiters representativos ni un despliegue.

La versión activa y el historial se incorporaron en [el segundo bloque](screening-versions.md). T-04/T-09, integración de entrega 2, CI y despliegue conservan su planificación. La nueva lista usa paginación por página; altas concurrentes pueden desplazar filas entre páginas, aunque el orden tiene desempate determinista.
La representación del correo se comprobó por contenido HTML/texto y Mailpit; falta observarla en clientes de correo y a 320 px con personas usuarias.
