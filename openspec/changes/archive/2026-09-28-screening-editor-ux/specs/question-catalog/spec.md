## MODIFIED Requirements

### Requirement: Isolated bank copy
El servidor SHALL listar catálogo activo por área para recruiters y copiar texto/tipo/opciones/orientación a un borrador propio con ids nuevos y sin reglas automáticas. La interfaz SHALL permitir filtrar y buscar entre las entradas recibidas, además de mantener creación manual.

#### Scenario: Copy and edit
- **WHEN** se copia del banco y cambia la pregunta o el original
- **THEN** cada documento conserva su contenido independiente; el recruiter configura score/peso/excluyentes antes de publicar

#### Scenario: Inactive or unavailable bank
- **WHEN** no existe entrada activa o el banco no fue cargado
- **THEN** no se incorpora una pregunta falsa; la UI muestra vacío/error y permite edición manual

#### Scenario: Unsaved draft while adding from bank
- **WHEN** el recruiter elige una entrada del banco con cambios locales sin guardar
- **THEN** el editor guarda primero con revisión condicionada y copia solo si se confirma el guardado; un fallo conserva los cambios locales y no copia

#### Scenario: Search and filter
- **WHEN** el recruiter filtra por área o texto dentro del banco disponible
- **THEN** ve entradas coincidentes y puede añadir una, sin asignación automática de pesos, puntajes o excluyentes
