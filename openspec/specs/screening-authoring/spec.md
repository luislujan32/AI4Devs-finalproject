# screening-authoring Specification

## Purpose
Definir autoría, publicación inmutable por versión y edición de futuras invitaciones con control de revisión.
## Requirements

### Requirement: Owned draft persistence
El servidor MUST crear y guardar configuración propia incompleta con validación de forma, campos permitidos y expectedRevision, sin permitir fijar propietario/status desde cliente.
#### Scenario: Reload an incomplete draft
- **WHEN** el recruiter guarda un borrador sin reglas completas y recarga
- **THEN** recupera metadata/preguntas y revisión persistidas sin publicación
#### Scenario: Concurrent changes
- **WHEN** dos guardados o guardado/publicación usan la misma revisión
- **THEN** solo uno conserva cambios; el otro obtiene 409 sin sobrescribir
#### Scenario: Foreign mutation
- **WHEN** intenta editar/publicar/copiar un id ajeno o inválido
- **THEN** recibe 404 equivalente a inexistente sin modificar datos

### Requirement: Validated immutable publication
El sistema SHALL validar P-01/P-02/P-08 y confirmación explícita del recruiter antes de congelar un borrador en una escritura condicionada con fecha/revisión.
#### Scenario: Incomplete or invalid evaluation
- **WHEN** faltan puntajes/pesos/umbral/confirmación, texto puntúa/excluye o una referencia/excluyente no es válido
- **THEN** devuelve 422 y conserva borrador y revisión
#### Scenario: Valid publication
- **WHEN** se publica una configuración válida confirmada con revisión vigente
- **THEN** congela metadata/preguntas y registra publishedAt; las escrituras directas sobre esa versión devuelven 409. La ruta separada de edición prepara otra configuración sin mutar la publicada

### Requirement: Independent published copy
Una copia MUST crear otro borrador propio con identificadores nuevos y referencias de opciones remapeadas, sin invitaciones ni fecha publicada.
#### Scenario: Copy and edit
- **WHEN** se copia publicado y se cambia su pregunta/excluyente
- **THEN** el original permanece idéntico y la copia conserva referencias internas válidas

### Requirement: Usable authoring interface
La interfaz SHALL permitir crear/abrir, configurar preguntas en una edición enfocada, guardar/recargar y confirmar publicación desde una revisión; mostrar estado de guardado, errores accionables, carga/conflictos y lectura de publicados. Las acciones compactas SHALL conservar semántica, foco y uso por teclado/tacto. Ayudas esenciales SHALL ser visibles junto al campo y las ampliaciones accesibles sin hover.

#### Scenario: Save and publish in browser
- **WHEN** el recruiter crea y guarda, recarga y publica tras revisar configuración
- **THEN** la UI confirma el estado persistido y permite copiar el publicado; campos vacíos no se convierten en cero

#### Scenario: Conflict recovery
- **WHEN** el servidor devuelve 409 al guardar
- **THEN** conserva edición local y permite recargar explícitamente la revisión actual antes de continuar

#### Scenario: Focused question editing
- **WHEN** hay varias preguntas en un borrador
- **THEN** el recruiter recorre un resumen compacto, abre una pregunta a la vez y configura contenido/evaluación sin perder las demás

#### Scenario: Destructive editing
- **WHEN** cambiar el tipo o quitar una pregunta eliminaría contenido o reglas
- **THEN** la UI explica el efecto antes de mutar y permite cancelar sin perder datos

#### Scenario: Publication correction
- **WHEN** el servidor devuelve problemas de configuración al publicar
- **THEN** la revisión conserva el borrador y ofrece controles que llevan a los campos/preguntas identificables, con el error también expresado en texto

### Requirement: Draft deletion
El sistema SHALL permitir al propietario eliminar un screening en estado borrador con su revisión actual. SHALL rechazar la eliminación de un screening publicado o ajeno.

#### Scenario: Delete a copied draft
- **WHEN** el propietario confirma eliminar una copia en borrador con revisión vigente
- **THEN** la copia deja de aparecer en su lista y el original publicado permanece intacto

#### Scenario: Reject stale or published deletion
- **WHEN** se intenta eliminar con una revisión antigua o sobre un screening publicado
- **THEN** la operación no borra el screening y comunica el conflicto

### Requirement: Close a published screening
El recruiter propietario SHALL poder cerrar un screening publicado mediante confirmación y revisión vigente. El cierre SHALL bloquear invitaciones nuevas, mantener configuración y resultados, y permitir copiar el cerrado a un borrador independiente.

#### Scenario: Confirmed closure
- **WHEN** el propietario confirma el cierre con la revisión actual
- **THEN** el estado pasa a cerrado, se registra fecha y no se admiten invitaciones nuevas

#### Scenario: Stale or foreign closure
- **WHEN** la revisión cambió, el screening ya está cerrado o pertenece a otro recruiter
- **THEN** devuelve 409 o 404 según corresponda sin cambiar datos

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
Un screening publicado o cerrado SHALL mantener inmutable su configuración y sus invitaciones. Editar para nuevas invitaciones SHALL preparar un borrador de configuración dentro del mismo SC; crear otro SC basado en este SHALL seguir siendo una copia independiente.

#### Scenario: Change after invitations
- **WHEN** el recruiter crea una nueva versión de un publicado
- **THEN** puede editar el borrador de cambios del mismo SC y los postulantes existentes conservan su configuración fijada
