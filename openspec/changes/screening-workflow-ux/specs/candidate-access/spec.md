## ADDED Requirements

### Requirement: Invitation delivery
Al crear una invitación válida, el sistema SHALL enviar un mensaje local de prueba al correo ficticio con el nombre del screening, un enlace personal de acceso de un uso y recuperación por código si el token ya no sirve. SHALL informar fallo de entrega sin presentar la invitación como enviada.

#### Scenario: Invitation email
- **WHEN** el recruiter invita a una dirección de prueba en un screening publicado
- **THEN** Mailpit recibe el mensaje cuyo primer uso vigente abre la invitación sin código; el código sigue disponible para retomar sin sesión
