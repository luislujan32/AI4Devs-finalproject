# candidate-attempt Specification

## Purpose
Definir la lectura segura del cuestionario propio, el borrador de respuestas versionado y el envío único que genera una evaluación determinista sin revelar reglas internas al postulante.
## Requirements
### Requirement: Candidate questionnaire projection
El sistema SHALL servir a la sesión candidata solo el screening publicado y las respuestas de su invitación, sin puntajes, pesos, umbral, criterios internos o excluyentes.

#### Scenario: Read own attempt
- **WHEN** una sesión candidata vigente consulta su intento
- **THEN** recibe preguntas, respuestas, revisión y estado de esa invitación sin parámetros de identidad ajenos

### Requirement: Versioned answer draft
El sistema SHALL validar y reemplazar el conjunto de respuestas de un intento abierto con revisión esperada; SHALL conservar borradores incompletos y rechazar referencias, formas y revisiones inválidas.

#### Scenario: Save and resume
- **WHEN** un candidato guarda opciones, texto, desconocidos u omisiones válidos y luego vuelve a acceder
- **THEN** recupera exactamente la revisión y las respuestas confirmadas por el servidor

#### Scenario: Concurrent or submitted edit
- **WHEN** otra escritura adelantó la revisión o el intento fue enviado
- **THEN** el guardado recibe conflicto y no altera la versión persistida

### Requirement: Deterministic single submission
El sistema SHALL validar respuestas requeridas y calcular P-01 a P-08 sin IA; SHALL conservar estado, fecha e informe en una escritura condicional única. SHALL responder con el mismo recibo ante reintento de un envío completado y SHALL ocultar el informe interno al candidato.

#### Scenario: Known and unknown evidence
- **WHEN** una pregunta puntuable o excluyente se responde como desconocida o se omite siendo opcional
- **THEN** el informe diferencia ambas evidencias, mantiene el denominador y marca el resultado pendiente salvo precedencia de un excluyente incumplido

#### Scenario: Two simultaneous submissions
- **WHEN** dos peticiones intentan enviar la misma revisión
- **THEN** solo una persiste informe y fecha; ambas reciben el mismo recibo si el envío quedó completado

#### Scenario: Required question missing
- **WHEN** falta una respuesta requerida al enviar
- **THEN** se rechaza el envío sin cerrar el intento ni generar informe
