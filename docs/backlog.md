# Backlog de Screeningroom

[Volver al README](../readme.md). Las historias HU-01, HU-03 y HU-04 y los tres tickets representativos se documentan allí. Este anexo conserva las dos historias adicionales y la planificación completa.

### HU-02 — Obtener sugerencias de IA

**Como** recruiter, **quiero** propuestas relacionadas con el puesto y el área, **para** reducir el trabajo de redacción.

- **Dada** una descripción y un área, **cuando** solicito sugerencias, **entonces** recibo hasta cinco preguntas con criterio y orientación para revisar.
- **Dada** una sugerencia, **cuando** la acepto, **entonces** se agrega al borrador sin puntajes, pesos ni excluyentes aprobados automáticamente; puedo editarla.
- **Dada** una sugerencia rechazada, **cuando** continúo, **entonces** el cuestionario no se modifica.
- **Dado** un fallo del proveedor o salida inválida, **cuando** finaliza la solicitud, **entonces** se comunica el fallo y siguen disponibles edición manual y banco.
- **Dado** un texto con instrucciones maliciosas en la vacante, **cuando** se usa como contexto, **entonces** el generador carece de herramientas y credenciales para publicar o consultar candidatos.

### HU-05 — Registrar revisión humana

**Como** recruiter, **quiero** registrar mi decisión después de leer el informe, **para** conservar el criterio aplicado al candidato.

- **Dado** un informe, **cuando** registro una revisión, **entonces** elijo continuar, no continuar o solicitar aclaración y se guardan autor y fecha.
- **Dado** un resultado distinto de «Supera los criterios», **cuando** decido continuar, **entonces** debo indicar el motivo.
- **Dada** una revisión, **cuando** se guarda o modifica, **entonces** el informe calculado permanece intacto; se conserva la revisión vigente.
- **Dada** una revisión modificada desde otra pestaña, **cuando** guardo una versión anterior, **entonces** recibo conflicto y debo recargar.
- **Dada** una decisión guardada, **cuando** se consulta, **entonces** no se interpreta como una acción ya ejecutada en otro sistema.

## Tickets y dependencias

| Ticket | Resultado | Dependencias de construcción |
| --- | --- | --- |
| T-00 | Monorepo, configuración, tipos, lint y pipeline mínimo | Diseño revisado |
| T-01 | Schemas, índices y fixtures | T-00 |
| T-02 | Login/logout y ownership del recruiter | T-01 |
| T-03 | Editor, reglas, copia, banco y publicación | T-02 |
| T-04 | Sugerencias IA con revisión y recuperación ante error | T-03 |
| T-05 | Invitaciones, SMTP, OTP y sesión de candidato | T-02, T-03 |
| T-06 | Cuestionario, guardado y reanudación | T-03, T-05, T-07 para integración |
| T-07 | API de respuestas, evaluación y envío final | T-01, T-03, T-05 |
| T-08 | Informe y revisión humana | T-07 |
| T-09 | Avisos, retención, borrado y comprobación de accesos | T-05, T-08; controles básicos desde cada ticket |
| T-10 | E2E completo, despliegue, instrucciones y evidencia | T-04, T-06, T-08, T-09 |

T-07 implementa la API de respuestas y evaluación; T-06 consume ese contrato. La interfaz puede avanzar con datos simulados antes de integrar el backend. Las pruebas de cada regla se realizan con su ticket, no se acumulan todas en T-10.

**Criterio de terminado por ticket:** criterios observables satisfechos; control de acceso aplicable; pruebas de riesgos del cambio; tipos/lint sin errores; documentación y registro de IA actualizados cuando cambie el contrato; sin secretos ni datos reales en fixtures.

**Hitos académicos:** entrega 1, 24/09, documentación; entrega 2, 22/10, flujo principal operativo con web/API/BD; final, 12/11, funcionalidades, tests, evidencia y registro de IA.
