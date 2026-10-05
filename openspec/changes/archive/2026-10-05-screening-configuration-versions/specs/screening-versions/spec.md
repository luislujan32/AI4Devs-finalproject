## ADDED Requirements

### Requirement: Edición de próximas invitaciones
El sistema SHALL mantener un SC con una configuración activa inmutable y como máximo un borrador de cambios, sin mover invitaciones existentes.

#### Scenario: Preparar y activar versión
- **WHEN** el recruiter edita v1, invita A, publica v2 e invita B
- **THEN** A conserva v1 y B usa v2; dashboard y lista agrupan ambos bajo el mismo SC

#### Scenario: Recarga y descarte
- **WHEN** se recarga un borrador de cambios o se descarta con revisión actual
- **THEN** se recupera su contenido o se elimina solo ese borrador, preservando la activa y los postulantes

### Requirement: Publicación condicional e historial
El sistema SHALL validar las reglas existentes y activar solo una configuración con CAS; conservará todo historial oficial y ownership.

#### Scenario: Publicaciones concurrentes
- **WHEN** dos solicitudes publican la misma revisión
- **THEN** una gana y la otra obtiene 409; no hay dos versiones activas ni publicación de configuración parcial

#### Scenario: Cierre con cambios pendientes
- **WHEN** se intenta cerrar un SC con borrador de cambios
- **THEN** se pide publicar o descartar sin borrar ese borrador ni cerrar silenciosamente

### Requirement: Configuración fijada al postulante
El sistema SHALL leer, validar y evaluar cada intento con su configuración fijada; el informe y la lista identificarán la versión recibida.

#### Scenario: Invitación anterior sin referencia de versión
- **WHEN** una invitación legacy lee, guarda o envía después de activar v2
- **THEN** continúa con v1 sin alterar respuestas, informe ni revisión humana

#### Scenario: Carrera de invitación y publicación
- **WHEN** se solapan ambas solicitudes
- **THEN** la invitación fija una versión completa seleccionada durante su operación; solicitudes iniciadas después de confirmar publicación usan la nueva

#### Scenario: Copia independiente
- **WHEN** se crea otro SC basado en uno con versiones
- **THEN** copia la activa con IDs remapeados, sin invitaciones y sin reemplazar al original
