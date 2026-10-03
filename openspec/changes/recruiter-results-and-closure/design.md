## Decisiones

- `closed` es un estado terminal. El cierre usa `expectedRevision` y confirmación explícita; no altera preguntas, umbral ni informes. Un cerrado se puede copiar a un borrador nuevo.
- El alta de invitaciones exige estado `published`. El intento ya creado acepta `published` o `closed`, además de vigencia de invitación y retención.
- El recruiter accede al informe por `invitationId` solo si es propietario, el envío terminó y `purgeAt` sigue vigente. `expiresAt` limita al candidato, no la consulta del informe.
- `report` permanece inmutable tras el envío. `review` es un subdocumento separado cuya revisión empieza en 1; `expectedRevision=0` crea la primera. Una escritura concurrente devuelve 409. Solo se conserva la última revisión, de acuerdo con el MVP.
- La interfaz abre el informe desde la fila de respuestas recibidas y presenta cálculo, evidencia y decisión humana en bloques distintos. La fila enviada ya no ofrece copiar enlace.

## Riesgos y límites

- El cierre no revoca invitaciones anteriores: el diálogo lo explica. La eliminación temprana de datos y la política para datos reales siguen en T-09.
- Correo y cuentas siguen siendo ficticios. No hay notificaciones automáticas sobre decisiones humanas.
