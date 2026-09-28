# question-catalog Specification

## Purpose
TBD - created by archiving change screening-editor. Update Purpose after archive.
## Requirements
### Requirement: Reviewed initial catalog
El catálogo inicial MUST contener quince preguntas, cinco por área P-06, sin evaluación preaprobada; provisioning explícito valida revisión humana y preserva documentos existentes.
#### Scenario: Pending review
- **WHEN** se intenta cargar metadata de revisión pendiente
- **THEN** falla sin escribir; la autoría manual sigue disponible
#### Scenario: Repeat or collision
- **WHEN** se carga catálogo aprobado dos veces o existe un id con contenido diferente
- **THEN** repetir conserva registros/datos ajenos y colisión falla antes de insertar entradas restantes

### Requirement: Isolated bank copy
El servidor SHALL listar catálogo activo por área para recruiters y copiar texto/tipo/opciones/orientación a un borrador propio con ids nuevos y sin reglas automáticas.
#### Scenario: Copy and edit
- **WHEN** se copia del banco y cambia la pregunta o el original
- **THEN** cada documento conserva su contenido independiente; el recruiter configura score/peso/excluyentes antes de publicar
#### Scenario: Inactive or unavailable bank
- **WHEN** no existe entrada activa o el banco no fue cargado
- **THEN** no se incorpora una pregunta falsa; la UI muestra vacío/error y permite edición manual
