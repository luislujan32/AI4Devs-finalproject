## ADDED Requirements

### Requirement: Navigable recruiter workspace
La UI SHALL mostrar navegación global a Screenings y un menú identificable del recruiter; el detalle publicado SHALL abrir en Postulantes y permitirá llegar a Preguntas y reglas. Sección e informe SHALL conservarse en la URL.

#### Scenario: Open report and return
- **WHEN** el recruiter abre un informe y usa Atrás
- **THEN** vuelve a la lista de postulantes con su contexto de filtro y página

### Requirement: Clear invitation feedback
La UI SHALL anunciar una invitación efectivamente enviada una vez y mostrar la nueva fila como estado persistente. Un error SHALL conservar datos del formulario y explicar que no se envió.

#### Scenario: Send invitation
- **WHEN** Mailpit acepta el correo
- **THEN** se cierra el formulario, se anuncia el destinatario una vez y la invitación aparece en la lista

### Requirement: Consistent invitation email
El correo HTML y texto SHALL mostrar puesto, acción, vencimiento absoluto y recuperación de acceso equivalentes.

#### Scenario: Email delivery
- **WHEN** se crea una invitación
- **THEN** ambas versiones reflejan la fecha persistida y el enlace personal correcto
