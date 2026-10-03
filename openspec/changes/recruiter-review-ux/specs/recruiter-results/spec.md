## MODIFIED Requirements

### Requirement: Separate human review
El sistema SHALL registrar por separado el resultado calculado y una decisión humana vigente de continuar o no continuar. SHALL exigir motivo al continuar con resultado negativo o pendiente, impedir sobrescribir una revisión más reciente y mostrar la decisión en Postulantes y en el informe. SHALL mantener legibles las revisiones históricas de aclaración sin admitir nuevas solicitudes de aclaración hasta que exista un flujo de comunicación real.

#### Scenario: Decision visible after return and reload
- **WHEN** el recruiter registra una decisión y vuelve a Postulantes o reabre el informe
- **THEN** ve por separado el estado de respuestas, el resultado calculado y la decisión vigente; el formulario está cerrado y puede abrirlo para cambiarla

#### Scenario: Historical clarification record
- **WHEN** el recruiter consulta una revisión histórica de aclaración
- **THEN** se explica que era un pendiente interno sin mensaje enviado y puede reemplazarse; una nueva escritura con esa decisión se rechaza

### Requirement: Explain result by criterion
El sistema SHALL mostrar excluyentes incumplidos y datos pendientes junto al valor puntuado y peso de cada respuesta estructurada, sin atribuir un umbral individual a una pregunta ni cambiar el resultado por una revisión humana.

#### Scenario: Override of an exclusion
- **WHEN** hay un requisito excluyente incumplido y el recruiter registra continuar con motivo
- **THEN** el requisito, el puntaje global y la decisión humana permanecen visibles como datos independientes
