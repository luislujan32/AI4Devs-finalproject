## ADDED Requirements

### Requirement: Approved domain representation

La persistencia SHALL representar las cinco colecciones y objetos embebidos del README §3, conservar separación entre configuración, intento, informe y revisión, y validar límites estructurales sin exigir a un borrador configuración completa de publicación.

#### Scenario: Incomplete draft
- **WHEN** se guarda un borrador con configuración de evaluación todavía incompleta y estructura válida
- **THEN** se conserva como draft; su guardado no equivale a publicación válida

#### Scenario: Invalid structure
- **WHEN** se intenta persistir ids de pregunta u opción duplicados, una revisión no entera, más de veinte preguntas o texto que excede un límite del contrato
- **THEN** la operación se rechaza y no se conserva el documento inválido

#### Scenario: Independent report and review
- **WHEN** se persiste una invitación con respuestas, informe y revisión humana
- **THEN** informe y revisión se conservan en campos distintos; el score nulo conserva su significado de cálculo incompleto

### Requirement: Real uniqueness guarantees

MongoDB MUST aplicar unicidad a email normalizado de usuario, publicId de invitación y pareja screeningId/candidateEmail normalizado, con los demás índices del modelo aprobado.

#### Scenario: Duplicate user email
- **WHEN** se intenta crear un segundo usuario cuyo email normalizado coincide con uno existente
- **THEN** MongoDB rechaza la duplicación incluso bajo escrituras concurrentes

#### Scenario: Duplicate invitation
- **WHEN** se intenta crear otra invitación para el mismo screening y correo normalizado
- **THEN** la segunda escritura se rechaza; otro screening puede invitar al mismo correo

#### Scenario: Duplicate public identifier
- **WHEN** dos invitaciones usan el mismo publicId
- **THEN** solo una puede quedar persistida

### Requirement: Owned references and conditional writes

Las operaciones concretas de persistencia SHALL comprobar referencias y ownership y SHALL condicionar escrituras concurrentes a owner, estado y revisión esperada. Las referencias del banco MUST conservarse como origen informativo de contenido copiado.

#### Scenario: Foreign screening reference
- **WHEN** se intenta crear una invitación sobre un screening inexistente, sin publicar o ajeno al owner de la operación
- **THEN** no se crea la invitación ni se devuelve contenido del screening ajeno

#### Scenario: Concurrent revisions
- **WHEN** dos escrituras sobre el mismo documento válido usan la misma revisión esperada
- **THEN** solo una tiene éxito y la lectura posterior confirma una sola revisión nueva

#### Scenario: Bank copy
- **WHEN** una pregunta copiada se lee después de cambiar su entrada original del banco
- **THEN** conserva el contenido persistido en el screening

### Requirement: Retention is separate from access

La persistencia SHALL declarar TTL para purgeAt y expiración de sesiones y MUST documentar que eliminación eventual no sustituye comprobación explícita de vigencia ni una política completa de borrado.

#### Scenario: Declared TTL indexes
- **WHEN** se inspeccionan índices de las colecciones en la BD de prueba
- **THEN** están presentes los TTL de los campos del contrato; no se atribuye a su existencia una prueba de bloqueo de acceso expirado

### Requirement: Repeatable isolated fixtures and evidence

El proyecto SHALL proporcionar carga explícita y repetible de datos ficticios y pruebas de restricciones contra MongoDB real. La carga MUST preservar datos ajenos y la limpieza de tests MUST limitarse a su propia BD aleatoria.

#### Scenario: Repeat fixture command
- **WHEN** se ejecuta dos veces la carga en su destino de prueba junto a un documento ajeno
- **THEN** los fixtures no se duplican y el documento ajeno permanece intacto

#### Scenario: Integration test isolation
- **WHEN** termina la prueba de schemas, índices y escrituras condicionadas
- **THEN** se limpian solo los datos de la BD creada por la prueba y se conservan los de desarrollo
