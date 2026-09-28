## MODIFIED Requirements

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
