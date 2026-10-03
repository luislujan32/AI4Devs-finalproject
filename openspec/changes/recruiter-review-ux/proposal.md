# Hacer visible la decisión humana en Postulantes

## Por qué

Tras registrar una revisión, el formulario seguía abierto y la decisión desaparecía al volver a la lista. El informe mostraba valor y peso por pregunta sin distinguir con claridad excluyentes incumplidos, datos pendientes o valores que bajaron el promedio. «Solicitar aclaración» prometía una acción que el producto no realiza.

## Qué cambia

- Separar en el listado estado de respuestas, resultado de criterios y decisión humana.
- Resumir factores del resultado y mostrar valor puntuado y peso por pregunta sin declarar un umbral individual.
- Confirmar una decisión concreta y volver a modo lectura; permitir editarla explícitamente.
- Retirar «Solicitar aclaración» de nuevas revisiones, conservar lectura de registros anteriores y explicar su alcance histórico.
- Definir la semántica UX y los límites de escala en `docs/ux-resultados-revision.md`.

## Límites

La decisión no contacta al candidato ni mueve etapas externas. El informe calculado permanece inmutable; se conserva solo la última revisión. El listado sigue limitado a 100 invitaciones hasta un ticket de paginación.
