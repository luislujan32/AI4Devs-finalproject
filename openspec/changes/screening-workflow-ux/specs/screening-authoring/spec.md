## ADDED Requirements

### Requirement: Draft deletion
El sistema SHALL permitir al propietario eliminar un screening en estado borrador con su revisión actual. SHALL rechazar la eliminación de un screening publicado o ajeno.

#### Scenario: Delete a copied draft
- **WHEN** el propietario confirma eliminar una copia en borrador con revisión vigente
- **THEN** la copia deja de aparecer en su lista y el original publicado permanece intacto

#### Scenario: Reject stale or published deletion
- **WHEN** se intenta eliminar con una revisión antigua o sobre un screening publicado
- **THEN** la operación no borra el screening y comunica el conflicto
