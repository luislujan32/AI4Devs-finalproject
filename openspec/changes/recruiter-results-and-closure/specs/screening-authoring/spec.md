## ADDED Requirements

### Requirement: Close a published screening
El recruiter propietario SHALL poder cerrar un screening publicado mediante confirmación y revisión vigente. El cierre SHALL bloquear invitaciones nuevas, mantener configuración y resultados, y permitir copiar el cerrado a un borrador independiente.

#### Scenario: Confirmed closure
- **WHEN** el propietario confirma el cierre con la revisión actual
- **THEN** el estado pasa a cerrado, se registra fecha y no se admiten invitaciones nuevas

#### Scenario: Stale or foreign closure
- **WHEN** la revisión cambió, el screening ya está cerrado o pertenece a otro recruiter
- **THEN** devuelve 409 o 404 según corresponda sin cambiar datos
