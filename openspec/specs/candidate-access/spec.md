# candidate-access Specification

## Purpose
Contrato implementado de candidate-access, consolidado desde los cambios aprobados.
## Requirements
### Requirement: Scoped invitation access
El sistema SHALL crear invitaciones individuales solo para screenings publicados del recruiter propietario y SHALL permitir listar únicamente las propias. Cada invitación SHALL tener enlace opaco, vigencia y plazo de retención, sin conceder acceso al cuestionario por el enlace solo.

#### Scenario: Create and list
- **WHEN** el recruiter crea una invitación con correo ficticio válido para un screening publicado propio
- **THEN** obtiene un enlace individual y la lista propia la muestra sin código de acceso

#### Scenario: Foreign, draft or duplicate
- **WHEN** intenta invitar desde un screening ajeno/borrador o repetir el mismo correo en el mismo screening
- **THEN** el servidor no crea otro intento ni expone datos ajenos

### Requirement: One-use email challenge
El sistema SHALL entregar un código aleatorio de seis dígitos al correo registrado mediante Mailpit para example.test o Brevo explícitamente configurado para direcciones reales de revisión. El código SHALL estar vinculado a invitación/desafío, ser válido diez minutos y consumible una vez. SHALL limitar fallos, reenvíos e intentos por IP; un reenvío SHALL invalidar el código previo sin reiniciar la ventana de envíos. Los envíos externos SHALL compartir el límite diario de la demo.

#### Scenario: Verify and consume
- **WHEN** el postulante solicita y verifica un código vigente correcto
- **THEN** se consume atómicamente y se crea una sesión de candidato para esa invitación, sin devolver código en HTTP

#### Scenario: Invalid, expired or replayed code
- **WHEN** el código es incorrecto, venció, agotó fallos o fue consumido
- **THEN** no se crea sesión y se comunica un error sin revelar el código esperado

#### Scenario: Request limits
- **WHEN** se solicita otro código antes de sesenta segundos, más de cinco en una hora o se excede el límite IP o diario externo
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

### Requirement: Invitation delivery
Al crear una invitación válida, el sistema SHALL enviar al correo registrado un mensaje con el nombre del screening, un enlace personal de acceso de un uso y recuperación por código si ese token ya no sirve. Direcciones example.test SHALL usar Mailpit; direcciones reales SHALL requerir Brevo configurado. SHALL distinguir aceptación del transporte de entrega final y SHALL conservar un envío incierto sin presentarlo como confirmado.

#### Scenario: Invitation email
- **WHEN** el recruiter invita a una dirección de prueba en un screening publicado
- **THEN** Mailpit recibe el mensaje con enlace que abre la invitación sin código en su primer uso; el flujo de código sigue disponible para reanudar sin sesión

#### Scenario: Real review invitation
- **WHEN** el recruiter invita a un correo real autorizado con Brevo configurado
- **THEN** Brevo recibe la invitación y Mailpit no recibe copia del mensaje real

#### Scenario: Delivery response is lost
- **WHEN** la respuesta del proveedor no permite confirmar si aceptó la invitación
- **THEN** el intento permanece disponible con aviso de correo sin confirmar y enlace compartible, también después de recargar

### Requirement: One-use email entry
El enlace entregado al correo SHALL incluir un token aleatorio independiente del enlace compartible. El servidor SHALL almacenar solo un resumen autenticado, consumirlo una vez de forma atómica y crear una sesión para esa invitación si sigue vigente. El navegador SHALL retirar el token de la URL. Un token inválido, usado o vencido SHALL ofrecer el flujo de código por correo.

#### Scenario: Open email link
- **WHEN** el candidato abre por primera vez el enlace vigente del mensaje
- **THEN** accede a su invitación sin ingresar un código adicional

#### Scenario: Shareable link or replay
- **WHEN** abre el enlace copiado por el recruiter o reutiliza un token ya consumido sin sesión
- **THEN** debe verificar su correo con un código antes de ver el cuestionario
