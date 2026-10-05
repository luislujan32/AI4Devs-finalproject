## ADDED Requirements

### Requirement: Complete authorized screening list
La API SHALL devolver páginas acotadas de screenings propios con total del filtro, búsqueda por título y filtro de estado; el orden SHALL tener desempate estable.

#### Scenario: More than one hundred screenings
- **WHEN** un recruiter tiene 101 screenings y consulta las páginas
- **THEN** puede acceder al registro 101 y el total indica 101

#### Scenario: Ownership and filters
- **WHEN** filtra por Cerrado o busca un título
- **THEN** solo se cuentan y muestran los screenings propios que coinciden

### Requirement: Complete authorized invitation list
La API SHALL devolver páginas acotadas de invitaciones no purgadas del screening propio, con total, búsqueda y filtros de recepción, resultado y decisión.

#### Scenario: Work queue
- **WHEN** el recruiter filtra Por revisar
- **THEN** ve respuestas enviadas sin decisión humana, incluso después de las primeras 100 invitaciones

#### Scenario: Other recruiter's data
- **WHEN** un recruiter consulta un screening ajeno
- **THEN** no obtiene invitaciones ni contadores
