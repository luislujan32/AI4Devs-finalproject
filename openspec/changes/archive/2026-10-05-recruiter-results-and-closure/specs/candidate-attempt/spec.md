## ADDED Requirements

### Requirement: Existing invitation after screening closure
Un intento invitado antes del cierre SHALL poder leerse, guardarse y enviarse hasta el vencimiento de su invitación, sin extenderla por el cierre.

#### Scenario: Continue after closure
- **WHEN** el screening se cierra mientras una invitación previa sigue vigente
- **THEN** el candidato conserva su intento y puede enviar respuestas; el recruiter recibe el informe
