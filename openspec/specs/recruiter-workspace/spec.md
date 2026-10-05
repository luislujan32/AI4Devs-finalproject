# recruiter-workspace Specification

## Purpose
Permitir acceso, consulta de screenings propios y cierre de sesión en una interfaz con estados claros y sin almacenamiento persistente de credenciales.

## Requirements

### Requirement: Login and workspace interface
La UI SHALL permitir entrar/salir y cargar screenings propios, mostrar estados de carga, error, vacío y sesión vencida. En un screening publicado SHALL separar Preguntas y reglas de Postulantes, y mostrar invitaciones y estados solo en Postulantes. La sesión del recruiter SHALL seguir vigente al abrir una sesión candidata en el mismo navegador.

#### Scenario: Published workspace
- **WHEN** el recruiter abre un screening publicado
- **THEN** puede alternar entre configuración de solo lectura y postulantes invitados sin mezclar ambos flujos

#### Scenario: Candidate uses same browser
- **WHEN** un candidato verifica su correo en el mismo navegador
- **THEN** su sesión no revoca la del recruiter

#### Scenario: Login and reload
- **WHEN** el recruiter entra con cuenta ficticia y recarga
- **THEN** recupera su sesión/listado desde API y MongoDB, sin password/token persistentes en almacenamiento del navegador

#### Scenario: Error and logout
- **WHEN** falla acceso/carga o se cierra sesión
- **THEN** comunica el estado correcto, permite reintentar y vuelve al acceso al salir sin conservar lista de otro usuario

#### Scenario: Invitation from published screening
- **WHEN** el recruiter abre un screening publicado propio y registra un correo ficticio
- **THEN** obtiene un enlace individual para compartir y ve solo las invitaciones de ese screening

### Requirement: Results in published and closed workspaces
La interfaz SHALL listar postulantes en screenings publicados y cerrados, distinguir estados de respuesta y ofrecer consulta del informe para envíos completados sin ofrecer copiar un enlace ya utilizado.

#### Scenario: Review submitted candidate in closed screening
- **WHEN** el recruiter abre un screening cerrado y elige un postulante con respuestas recibidas
- **THEN** ve respuestas e informe y puede registrar la revisión humana; no ve formulario de nueva invitación

### Requirement: Dedicated candidate report view
La lista de postulantes SHALL abrir el informe de respuestas recibidas como una vista separada y SHALL ofrecer una sola acción clara para volver a la lista. Un error de carga SHALL permitir reintentar sin perder el contexto.

#### Scenario: Open and return
- **WHEN** el recruiter elige «Ver informe» en un postulante con respuestas recibidas
- **THEN** ve el informe sin el formulario ni la lista de invitaciones y puede volver a Postulantes

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
