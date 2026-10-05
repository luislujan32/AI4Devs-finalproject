## ADDED Requirements

### Requirement: Automatic complete draft persistence
El editor SHALL guardar automáticamente todos los campos de un borrador incompleto con control de revisión. SHALL informar pendiente, guardando, guardado o error; ante un error SHALL mantener la edición local y permitir reintentar.

#### Scenario: Edit fields and leave
- **WHEN** el recruiter edita título, descripción, umbral o preguntas y el servidor confirma el guardado
- **THEN** al volver encuentra todos los cambios sin necesidad de un botón de guardado

### Requirement: Reachable publication threshold
La publicación SHALL calcular el máximo posible del promedio ponderado a partir de las opciones puntuables y SHALL rechazar un umbral superior a ese máximo. El editor SHALL explicar la relación entre valor, peso y umbral antes de publicar.

#### Scenario: Impossible threshold
- **WHEN** el umbral es 90 y el máximo posible con las opciones configuradas es 80
- **THEN** el screening sigue como borrador y se explica qué valores revisar

### Requirement: Unique bank source per screening
Un screening SHALL admitir una sola incorporación de cada pregunta activa del banco. La interfaz SHALL marcar como agregada la entrada ya usada.

#### Scenario: Repeated bank addition
- **WHEN** el recruiter intenta incorporar otra vez la misma pregunta del banco
- **THEN** el servidor rechaza la operación sin modificar el borrador

### Requirement: Explicit configuration version
Un screening publicado o cerrado SHALL mantener inmutable su configuración y sus invitaciones. La acción de nueva versión SHALL crear un borrador independiente con referencia al screening de origen.

#### Scenario: Change after invitations
- **WHEN** el recruiter crea una nueva versión de un publicado
- **THEN** puede editar el borrador nuevo y los postulantes existentes siguen asociados al original
