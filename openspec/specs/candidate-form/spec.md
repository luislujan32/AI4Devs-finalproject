# candidate-form Specification

## Purpose
Contrato implementado de candidate-form, consolidado desde los cambios aprobados.

## Requirements

### Requirement: Clear stepwise questionnaire
La interfaz SHALL mostrar una pregunta por etapa con progreso, anterior/siguiente, controles legibles y navegación por teclado/tacto. SHALL diferenciar respuesta desconocida de pregunta omitida y comunicar obligatoriedad.

#### Scenario: Work through questions
- **WHEN** un postulante responde, retrocede o avanza antes de guardar
- **THEN** ve su edición local intacta y un estado claro de cambios sin guardar

### Requirement: Honest persistence and recovery
La interfaz SHALL mostrar «guardado» solo tras confirmación del servidor; SHALL conservar edición visible ante error o conflicto y pedir confirmación antes de descartarla o cerrar acceso.

#### Scenario: Save conflict
- **WHEN** el servidor rechaza una revisión desactualizada
- **THEN** la edición permanece en pantalla y recargar la versión guardada exige una decisión explícita

### Requirement: Review and final submission
La interfaz SHALL mostrar un resumen editable de todas las respuestas y omisiones antes de enviar; SHALL impedir envío de obligatorias omitidas, guardar primero cualquier cambio pendiente y explicar que el envío cierra edición. SHALL presentar recibo sin evaluación interna solo tras confirmación del servidor.

#### Scenario: Submit completed attempt
- **WHEN** el postulante revisa, confirma y envía sus respuestas, aunque haya cambios locales pendientes
- **THEN** ve confirmación y ya no puede editar las respuestas

### Requirement: Save before final submit
La interfaz SHALL permitir enviar una revisión completa con cambios locales pendientes. SHALL guardar esos cambios primero y usar la revisión confirmada por el servidor para el envío; si el guardado falla, SHALL conservar la edición y no enviar.

#### Scenario: Submit unsaved review
- **WHEN** el candidato confirma una revisión válida con cambios locales
- **THEN** el sistema guarda y envía en secuencia, y muestra recibo solo tras la confirmación final
