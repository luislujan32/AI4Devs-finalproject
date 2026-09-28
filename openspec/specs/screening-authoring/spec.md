# screening-authoring Specification

## Purpose
TBD - created by archiving change screening-editor. Update Purpose after archive.
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
- **THEN** congela metadata/preguntas y registra publishedAt; posteriores escrituras/agregar banco/publicar devuelven 409

### Requirement: Independent published copy
Una copia MUST crear otro borrador propio con identificadores nuevos y referencias de opciones remapeadas, sin invitaciones ni fecha publicada.
#### Scenario: Copy and edit
- **WHEN** se copia publicado y se cambia su pregunta/excluyente
- **THEN** el original permanece idéntico y la copia conserva referencias internas válidas

### Requirement: Usable authoring interface
La interfaz SHALL permitir crear/abrir, configurar preguntas, guardar/recargar y confirmar publicación; mostrar errores/carga/conflictos y lectura de publicados.
#### Scenario: Save and publish in browser
- **WHEN** el recruiter crea y guarda, recarga y publica tras revisar configuración
- **THEN** la UI confirma el estado persistido y permite copiar el publicado; campos vacíos no se convierten en cero
#### Scenario: Conflict recovery
- **WHEN** el servidor devuelve 409 al guardar
- **THEN** conserva edición local y permite recargar explícitamente la revisión actual antes de continuar
