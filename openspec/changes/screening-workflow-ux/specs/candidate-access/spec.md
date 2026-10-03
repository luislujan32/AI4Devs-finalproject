## ADDED Requirements

### Requirement: Invitation delivery
Al crear una invitación válida, el sistema SHALL enviar un mensaje local de prueba al correo ficticio con el nombre del screening, un enlace individual y explicación del código de acceso posterior. SHALL informar fallo de entrega sin presentar la invitación como enviada.

#### Scenario: Invitation email
- **WHEN** el recruiter invita a una dirección de prueba en un screening publicado
- **THEN** Mailpit recibe el mensaje con enlace y el candidato puede solicitar su código después de abrirlo
