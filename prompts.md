# Registro de uso de IA — Screeningroom

**Autor:** Luis Lujan (LL). **Etapa:** entrega 1, definición, planificación y documentación. **Actualización:** 23 de septiembre de 2026.

Este registro documenta cómo se utilizó la IA y qué decisiones tomó el autor. Los workflows son resúmenes del trabajo real; solo los fragmentos expresamente marcados como literales reproducen instrucciones de la conversación. No se inventan prompts de implementación ni resultados de pruebas de una aplicación aún no desarrollada.

## Herramientas y alcance

| Herramienta o recurso | Uso efectivo en esta etapa |
| --- | --- |
| ChatGPT, conversación y modo Work | Análisis de pautas, alternativas, reglas, historias y documentación |
| Entorno de ejecución del asistente | Preparación de Markdown, YAML y wireframes; comprobaciones documentales locales |
| Conexión con GitHub | Lectura de plantilla/fork y preparación de la documentación versionada |
| Documentación oficial | Contraste de las opciones de React, NestJS, MongoDB, npm y controles de acceso |
| Checkpoints del máster | Planificación verificable, documentación proporcional, límites de IA y manejo de datos |

**Modelos:** la identificación exacta de los modelos empleados en las conversaciones no quedó registrada de forma verificable; no se atribuyen nombres por inferencia. En las siguientes fases se anotará el modelo visible cuando esté disponible.

**Skills y agentes:** se utilizó la habilidad de gestión de archivos de Work para conservar borradores y anexos. No se utilizaron subagentes, comandos personalizados ni un harness propio instalado en este repositorio. Codex está previsto como apoyo para la implementación; no se afirma haber ejecutado el proyecto en la máquina del autor.

## 1. Descripción general del producto

### Workflow 1 — Acotar el MVP

**Entrada:** pautas académicas, necesidad de un screening independiente y alternativas de experiencia del candidato.

**Trabajo con IA:** comparar el recorrido web con opciones como mensajería, audio y lectura de CV; describir actores, valor, alcance y cinco capacidades principales.

**Intervención humana:** el autor priorizó un producto sencillo de usar, confirmó que todo el cuestionario debe poder completarse y que el recruiter toma la decisión final. Eligió el nombre Screeningroom y aportó su repositorio.

**Resultado:** [README, producto](readme.md#1-descripción-general-del-producto).

### Workflow 2 — Refinar pesos y excluyentes

**Fragmento literal del autor:**

> el postulante debe responder todo y luego el reclutador con el informe en la mano decide

**Trabajo con IA:** separar puntuación ponderada, incumplimiento excluyente, faltantes y revisión humana; concretar tipos de respuesta, escala, umbral y ejemplos.

**Intervención humana:** incorporación de pesos y preguntas excluyentes al MVP; conservar fortalezas declaradas aunque un requisito no se cumpla; permitir continuar con justificación. El autor delegó el refinamiento P-01 a P-08.

**Resultado:** [Contrato funcional](docs/producto.md). El cálculo es determinista; la IA no decide si un candidato supera el screening.

## 2. Arquitectura del sistema

### Workflow 1 — Elegir una estructura proporcionada

**Fragmento literal del autor:**

> NO hacer sobreingenieria aqui.

**Contexto:** acceso del recruiter y validación del postulante sin cuenta. El autor propuso un stack web con React, framework backend, monorepo y MongoDB como posibilidad.

**Trabajo con IA:** comparar opciones y elegir React + Vite + TypeScript, NestJS y MongoDB/Mongoose; definir un monolito modular con una única unidad de despliegue. Consultar documentación oficial y justificar el encaje con el producto.

**Resultado:** [Arquitectura](readme.md#2-arquitectura-del-sistema), con componentes, costes de la elección y estructura prevista.

### Workflow 2 — Delimitar acceso y manejo de datos

**Trabajo con IA:** proponer sesión del recruiter, códigos de un solo uso para candidatos, ownership, límites de solicitudes, minimización, retención y borrado. Distinguir control del buzón de certificación de identidad.

**Intervención humana:** requisito de validación sencilla para candidatos y referencia al módulo de ética. La generación de preguntas usa contexto del puesto, sin identidades ni respuestas de candidatos.

**Resultado:** flujo de acceso y [seguridad prevista](readme.md#25-seguridad). Son decisiones de diseño, no controles ya implantados ni una certificación legal.

### Workflow 3 — Planear verificación y despliegue

**Trabajo con IA:** definir pruebas unitarias del cálculo, integración con persistencia, componentes y un E2E del recorrido principal; describir infraestructura y despliegue futuro. Preparar bocetos de configuración, cuestionario e informe.

**Resultado:** [infraestructura](readme.md#24-infraestructura-y-despliegue), [tests previstos](readme.md#26-tests) y [wireframes](docs/wireframes.svg). Los bocetos son ilustraciones, no capturas de software ejecutado.

## 3. Modelo de datos

### Workflow 1 — Modelar configuración, intento y revisión

**Trabajo con IA:** distinguir usuario recruiter, screening, banco, invitación y sesión; elegir preguntas embebidas y un intento con respuestas/informe/revisión; explicitar ownership, restricciones, índices y conservación.

**Criterio humano aplicado:** conservar las reglas de cada screening publicado y separar el resultado calculado de la decisión del recruiter.

**Resultado:** [modelo de datos](readme.md#3-modelo-de-datos). La decisión de inmutabilidad evita construir un sistema complejo de versionado para el MVP.

## 4. Especificación de la API

### Workflow 1 — Seleccionar operaciones representativas

**Trabajo con IA:** describir publicación, envío final y consulta del informe en OpenAPI 3.0.3; definir actores, errores, revisión de concurrencia y respuesta idempotente al repetir un envío.

**Revisión:** limitar la entrega a tres operaciones representativas como pide la plantilla; reconocer que la implementación tendrá endpoints adicionales. El candidato no recibe el informe interno ni la configuración de scoring.

**Resultado:** [OpenAPI](docs/openapi.yaml).

## 5. Historias de usuario

### Workflow 1 — Traducir capacidades en aceptación observable

**Trabajo con IA:** redactar cinco historias y criterios Dado/Cuando/Entonces; relacionarlos con pesos, exclusiones, faltantes, acceso, reanudación e informe.

**Intervención humana:** confirmar el alcance general y delegar el equilibrio del primer MVP. Se destacan tres historias en el README y se conservan las otras dos en el backlog.

**Resultado:** [historias principales](readme.md#5-historias-de-usuario) y [historias adicionales](docs/backlog.md).

## 6. Tickets de trabajo

### Workflow 1 — Desglosar el trabajo

**Trabajo con IA:** organizar once tickets, identificar dependencias y detallar los tres ejemplos de datos, backend y frontend. Separar la API de respuestas/evaluación de su interfaz para evitar dependencias circulares.

**Revisión humana:** el autor pidió incluir más de tres tickets si aportaban utilidad. Se mantiene un backlog ampliado sin confundirlo con requisitos académicos adicionales.

**Resultado:** [tickets representativos](readme.md#6-tickets-de-trabajo) y [backlog](docs/backlog.md#tickets-y-dependencias).

## 7. Preparación de la entrega y pull requests

### Workflow 1 — Contrastar requisitos y preparar los archivos

**Trabajo con IA:** releer las pautas, consultar la plantilla oficial y el estado del fork; convertir el borrador en documentación de entrega, conservar su alcance y revisar enlaces, encabezados, reglas y estructura del contrato.

**Intervención humana:** confirmación de las iniciales LL y autorización explícita para modificar el fork y preparar la entrega. El trabajo se realiza desde Work/GitHub, sin acceso directo al clon del Mac del autor.

**Evidencia:** los cambios de documentación se versionan en `feature/entrega-1-LL`. Los PRs de implementación y sus verificaciones se registrarán cuando existan. El formulario académico es un paso separado de la preparación del repositorio.

## Qué se registrará durante el desarrollo

Por cada fase se añadirán las herramientas y modelos identificables, hasta tres prompts o workflows representativos, resultados relevantes, correcciones humanas y evidencia de verificación. No se requiere volcar todas las conversaciones ni conservar datos personales o secretos en este archivo.
