## MODIFIED Requirements

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
