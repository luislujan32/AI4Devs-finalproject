# Contrato funcional de Screeningroom

Entrega 1 · Luis Lujan · 23 de septiembre de 2026.

Las reglas siguientes definen el comportamiento previsto del MVP. [Volver al README](../readme.md).

### P-01 — Tipos

Sí/no y opción única admiten puntuación y condiciones excluyentes. Texto libre solo aporta evidencia: no recibe puntuación ni exclusión automática. Sí/no se representa con dos opciones; opción única admite de 2 a 8. Se admite además «No puedo confirmarlo», reservado como respuesta desconocida, sin puntaje y sin considerarse incumplimiento. Texto libre no admite esa opción especial: se responde o se deja vacío si es opcional.

Cada pregunta tiene un criterio identificable. No se agregan todavía varios indicadores o fórmulas por pregunta. Máximo 20 preguntas por screening; cada pregunta puede ser puntuable, excluyente, ambas o solo informativa.

### P-02 — Puntuación

Cada opción puntuable recibe un valor entero entre 0 y 100. Cada pregunta puntuable tiene peso entero de 1 a 5. El recruiter confirma estos valores y el umbral entero de 0 a 100; no se publica con un umbral universal impuesto por el sistema. La plantilla inicial del editor puede sugerir valores, pero el recruiter debe revisarlos antes de publicar.

**Puntaje = suma(peso × valor de respuesta) / suma(pesos de todas las preguntas puntuables).**

Debe existir al menos una pregunta puntuable. Si falta la respuesta conocida de cualquiera de ellas, el puntaje global es nulo y figura «Cálculo pendiente». No se cambia el denominador para favorecer o perjudicar al candidato. Las contribuciones conocidas siguen visibles. La comparación con el umbral usa los valores sin redondear —equivalente a comparar la suma ponderada con umbral × suma de pesos—; la UI muestra un decimal.

### P-03 — Precedencia del resultado

| Condición | Resultado general | Detalle |
| --- | --- | --- |
| Algún excluyente tiene respuesta conocida no aceptada | No supera los criterios | Motivo: requisito excluyente; conservar además faltantes y puntaje si puede calcularse |
| Sin excluyente incumplido, pero falta respuesta conocida para puntuar o verificar un excluyente | Pendiente de revisión | Motivo: información insuficiente; puntaje nulo solo si falta información puntuable |
| Datos suficientes, excluyentes cumplidos y puntaje >= umbral | Supera los criterios | Motivo: criterios satisfechos |
| Datos suficientes, excluyentes cumplidos y puntaje < umbral | No supera los criterios | Motivo: puntuación insuficiente |

Una pregunta excluyente no puntuable desconocida puede dejar el resultado pendiente aunque el puntaje numérico esté completo. `incomplete` indica faltantes que afectan evaluación; el detalle muestra también preguntas informativas opcionales sin respuesta.

### P-04 — Publicación

La publicación congela preguntas, opciones, pesos, umbral y excluyentes. No se edita el publicado. Una copia crea otro borrador con nuevos identificadores y sin invitaciones. Un candidato iniciado o enviado siempre conserva la configuración que recibió.

### P-05 — Revisión

Resultado calculado y decisión humana son campos distintos. Se permite continuar pese a un resultado negativo o pendiente, con justificación obligatoria. La revisión vigente conserva autor, fecha y motivo; al editarla se reemplaza esa revisión, no el informe. El historial de revisiones queda fuera del MVP.

### P-06 — Banco inicial

Catálogo inicial previsto de 15 preguntas, cinco por área: **Comercio y atención al cliente; Administración y operaciones; Tecnología**. Son categorías iniciales del producto, no una taxonomía profesional exhaustiva. Preguntas genéricas revisadas por el autor antes de cargarlas; los puestos fuera del catálogo admiten creación manual. No se necesitan subáreas para el primer flujo.

Copiar del banco incorpora texto, tipo, opciones y orientación. El recruiter configura para cada puesto puntuación, peso, obligatoriedad y exclusión. Editar la copia no cambia el original. El ticket T-03 debe entregar las 15 entradas revisadas; su contenido se redactará y revisará durante la implementación.

### P-07 — Sugerencias con IA

Hasta cinco sugerencias por solicitud. Contexto: área, descripción y hasta cinco entradas relevantes del banco, seleccionadas por área sin buscador vectorial. Cada sugerencia contiene pregunta, criterio, tipo, opciones cuando corresponda y orientación. El recruiter acepta o descarta y configura la evaluación. La generación no asigna reglas definitivas, no publica ni evalúa candidatos. Un fallo no bloquea el flujo manual.

### P-08 — Obligatoriedad y faltantes

`required` exige proporcionar una respuesta antes de enviar; no equivale a requisito excluyente. En preguntas estructuradas, «No puedo confirmarlo» satisface la interacción requerida pero deja la evaluación pendiente. Una pregunta puntuable o excluyente opcional puede omitirse: se conserva como faltante y se aplica P-03. Una pregunta informativa opcional omitida aparece en el detalle y por sí sola no cambia el resultado.

Se puede guardar un borrador incompleto. Al publicar se exige al menos una pregunta puntuable, opciones con puntuación completa si puntúan, pesos válidos y umbral confirmado. Un excluyente requiere al menos una opción aceptada y una no aceptada. Preguntas de texto no pueden puntuar ni excluir. Toda referencia a opción debe existir en esa pregunta.

### Ejemplos de aceptación del cálculo

Supuesto de ejemplo: inglés, peso 5; experiencia comercial, peso 3; licencia, peso 1 y excluyente. Puntajes declarados: 100, 80 y 0. Umbral 70. Las tres son puntuables.

| Caso | Puntaje | Resultado esperado |
| --- | --- | --- |
| Inglés 100, experiencia 80, licencia 0 incumplida | 740/9 = 82,2 mostrado | No supera: licencia; la puntuación favorable permanece visible |
| Inglés 100, experiencia 80, licencia 100 cumplida | 840/9 = 93,3 mostrado | Supera |
| Inglés desconocido, experiencia 80, licencia 100 | Nulo | Pendiente; no asignar cero ni quitar peso del denominador |
| Inglés desconocido, experiencia 80, licencia 0 incumplida | Nulo | No supera por licencia y además información incompleta |
| Todos los valores 70, excluyentes cumplidos | 70 | Supera por igualdad con el umbral |
| Texto informativo opcional vacío y lo demás suficiente | Sin efecto en puntaje | Mostrar omisión; no vuelve pendiente el resultado |
