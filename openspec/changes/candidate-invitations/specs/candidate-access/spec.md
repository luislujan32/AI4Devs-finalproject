## ADDED Requirements

### Requirement: Scoped invitation access
El sistema SHALL crear invitaciones individuales solo para screenings publicados del recruiter propietario y SHALL permitir listar únicamente las propias. Cada invitación SHALL tener enlace opaco, vigencia y plazo de retención, sin conceder acceso al cuestionario por el enlace solo.

#### Scenario: Create and list
- **WHEN** el recruiter crea una invitación con correo ficticio válido para un screening publicado propio
- **THEN** obtiene un enlace individual y la lista propia la muestra sin código de acceso

#### Scenario: Foreign, draft or duplicate
- **WHEN** intenta invitar desde un screening ajeno/borrador o repetir el mismo correo en el mismo screening
- **THEN** el servidor no crea otro intento ni expone datos ajenos

### Requirement: One-use email challenge
El sistema SHALL entregar un código aleatorio de seis dígitos al correo registrado mediante Mailpit local, vinculado a invitación/desafío, válido diez minutos y consumible una vez. SHALL limitar fallos, reenvíos e intentos por IP; un reenvío SHALL invalidar el código previo sin reiniciar la ventana de envíos.

#### Scenario: Verify and consume
- **WHEN** el postulante solicita y verifica un código vigente correcto
- **THEN** se consume atómicamente y se crea una sesión de candidato para esa invitación, sin devolver código en HTTP

#### Scenario: Invalid, expired or replayed code
- **WHEN** el código es incorrecto, venció, agotó fallos o fue consumido
- **THEN** no se crea sesión y se comunica un error sin revelar el código esperado

#### Scenario: Request limits
- **WHEN** se solicita otro código antes de sesenta segundos, más de cinco en una hora o se excede el límite IP
- **THEN** no se envía otro correo y se responde con límite temporal

### Requirement: Candidate session boundary
La sesión del candidato SHALL pertenecer a una sola invitación, vencer a más tardar en dos horas o con la invitación y comprobar vigencia/retención en cada operación. Una sesión de recruiter SHALL ser rechazada en rutas de candidato y viceversa; las mutaciones SHALL exigir origen y CSRF.

#### Scenario: Resume one attempt
- **WHEN** el postulante vuelve con sesión vigente o verifica un nuevo código de la misma invitación
- **THEN** accede al mismo intento y no a otro identificado por parámetros del cliente

#### Scenario: Expired invitation
- **WHEN** la invitación venció o salió de retención aunque MongoDB no haya ejecutado TTL
- **THEN** no puede emitir código ni leer/modificar el intento mediante sesión previa

### Requirement: Usable access interface
La interfaz SHALL ofrecer estados de solicitud, espera, verificación, reintento, sesión y vencimiento comprensibles para recruiter y postulante, con etiquetas, foco visible, teclado/tacto y vista móvil. SHALL mostrar éxito de acceso solo tras confirmación del servidor y SHALL evitar almacenamiento persistente de credenciales en JavaScript.

#### Scenario: Local candidate access
- **WHEN** un postulante ficticio abre su enlace, pide código y lo introduce
- **THEN** puede completar el acceso y reanudar la misma invitación tras volver a verificar, sin ver preguntas antes de autenticarse
