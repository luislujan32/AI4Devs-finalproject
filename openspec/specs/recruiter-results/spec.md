# recruiter-results Specification

## Purpose
Contrato implementado de recruiter-results, consolidado desde los cambios aprobados.

## Requirements

### Requirement: Owned report access
El sistema SHALL permitir consultar el informe completo únicamente al recruiter propietario de una invitación enviada y aún dentro de la retención, aunque el enlace del candidato haya vencido o el screening esté cerrado.

#### Scenario: Submitted report after invitation expiry
- **WHEN** el propietario abre un envío cuyo enlace venció pero cuya retención sigue vigente
- **THEN** recibe evidencia, cálculo y revisión vigente sin alterar el informe

#### Scenario: Foreign, pending or purged invitation
- **WHEN** se consulta una invitación ajena o purgada, o una propia sin envío
- **THEN** devuelve 404 para ajena/purgada o 409 para pendiente, sin exponer respuestas

### Requirement: Separate human review
El sistema SHALL registrar por separado el resultado calculado y una decisión humana vigente de continuar o no continuar. SHALL exigir motivo al continuar con resultado negativo o pendiente, impedir sobrescribir una revisión más reciente y mostrar la decisión en Postulantes y en el informe. SHALL mantener legibles las revisiones históricas de aclaración sin admitir nuevas solicitudes de aclaración hasta que exista un flujo de comunicación real.

#### Scenario: Decision visible after return and reload
- **WHEN** el recruiter registra una decisión y vuelve a Postulantes o reabre el informe
- **THEN** ve por separado el estado de respuestas, el resultado calculado y la decisión vigente; el formulario está cerrado y puede abrirlo para cambiarla

#### Scenario: Historical clarification record
- **WHEN** el recruiter consulta una revisión histórica de aclaración
- **THEN** se explica que era un pendiente interno sin mensaje enviado y puede reemplazarse; una nueva escritura con esa decisión se rechaza

#### Scenario: Override with reason
- **WHEN** el recruiter continúa pese a resultado negativo o pendiente e indica un motivo
- **THEN** se guarda una revisión humana separada y el resultado calculado permanece idéntico

#### Scenario: Concurrent reviews
- **WHEN** dos peticiones intentan guardar la misma revisión esperada
- **THEN** una persiste y la otra recibe 409 sin sobrescribir la primera

### Requirement: Explain result by criterion
El sistema SHALL mostrar excluyentes incumplidos y datos pendientes junto al valor puntuado y peso de cada respuesta estructurada, sin atribuir un umbral individual a una pregunta ni cambiar el resultado por una revisión humana.

#### Scenario: Override of an exclusion
- **WHEN** hay un requisito excluyente incumplido y el recruiter registra continuar con motivo
- **THEN** el requisito, el puntaje global y la decisión humana permanecen visibles como datos independientes
