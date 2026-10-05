## ADDED Requirements

### Requirement: One-use email entry
El enlace entregado al correo SHALL incluir un token aleatorio independiente del enlace compartible. El servidor SHALL almacenar solo un resumen autenticado, consumirlo una vez de forma atómica y crear una sesión para esa invitación si sigue vigente. El navegador SHALL retirar el token de la URL. Un token inválido, usado o vencido SHALL ofrecer el flujo de código por correo.

#### Scenario: Open email link
- **WHEN** el candidato abre por primera vez el enlace vigente del mensaje
- **THEN** accede a su invitación sin ingresar un código adicional

#### Scenario: Shareable link or replay
- **WHEN** abre el enlace copiado por el recruiter o reutiliza un token ya consumido sin sesión
- **THEN** debe verificar su correo con un código antes de ver el cuestionario
