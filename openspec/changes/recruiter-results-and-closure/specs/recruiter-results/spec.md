## ADDED Requirements

### Requirement: Owned report access
El sistema SHALL permitir consultar el informe completo únicamente al recruiter propietario de una invitación enviada y aún dentro de la retención, aunque el enlace del candidato haya vencido o el screening esté cerrado.

#### Scenario: Submitted report after invitation expiry
- **WHEN** el propietario abre un envío cuyo enlace venció pero cuya retención sigue vigente
- **THEN** recibe evidencia, cálculo y revisión vigente sin alterar el informe

#### Scenario: Foreign, pending or purged invitation
- **WHEN** se consulta una invitación ajena o purgada, o una propia sin envío
- **THEN** devuelve 404 para ajena/purgada o 409 para pendiente, sin exponer respuestas

### Requirement: Separate human review
El sistema SHALL registrar decisión humana, motivo, autor, fecha y revisión vigente sin modificar el informe calculado. SHALL exigir motivo al continuar con resultado negativo o pendiente y SHALL impedir sobrescribir una revisión más reciente.

#### Scenario: Override with reason
- **WHEN** el recruiter continúa pese a resultado negativo o pendiente e indica un motivo
- **THEN** se guarda una revisión humana separada y el resultado calculado permanece idéntico

#### Scenario: Concurrent reviews
- **WHEN** dos peticiones intentan guardar la misma revisión esperada
- **THEN** una persiste y la otra recibe 409 sin sobrescribir la primera
