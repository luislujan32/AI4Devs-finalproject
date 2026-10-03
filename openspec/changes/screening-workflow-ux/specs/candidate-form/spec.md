## ADDED Requirements

### Requirement: Save before final submit
La interfaz SHALL permitir enviar una revisión completa con cambios locales pendientes. SHALL guardar esos cambios primero y usar la revisión confirmada por el servidor para el envío; si el guardado falla, SHALL conservar la edición y no enviar.

#### Scenario: Submit unsaved review
- **WHEN** el candidato confirma una revisión válida con cambios locales
- **THEN** el sistema guarda y envía en secuencia, y muestra recibo solo tras la confirmación final
