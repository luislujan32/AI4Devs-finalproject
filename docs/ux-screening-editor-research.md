# Investigación UX/UI — editor de Screeningroom

**Fecha:** 28/09/2026. **Estado:** investigación aplicada e integrada en `feature/entrega-2-LL`; Luis aprobó la primera mejora y resta validarla con recruiters. Este documento analiza el **editor del recruiter**, no el futuro cuestionario del candidato, que seguirá [UX-02](backlog.md#ux-02--formulario-del-postulante). Se inspeccionó el borrador ficticio de Tecnología en la demo local, su recorrido visual y su implementación previa. Las guías externas son evidencia de patrones y ejemplos, no una prueba de que alguna solución funcione para nuestros usuarios.

## Diagnóstico del editor previo

| Hallazgo observado | Efecto probable en la tarea |
| --- | --- |
| Título grande, amplio espacio inicial y cada pregunta con todos sus campos expandidos | El primer control de pregunta queda por debajo del primer pantallazo; con hasta veinte preguntas, comparar el conjunto exige mucho desplazamiento. |
| Contenido, opciones, obligatoriedad, puntuación, peso y exclusión se mezclan en cada tarjeta | Se exige decidir simultáneamente qué preguntar y cómo evaluar. Los conceptos «requerida» y «excluyente» compiten visualmente aunque significan cosas distintas. |
| «Guardar borrador», recargar y publicar están después de todas las preguntas y del banco | Las acciones y el estado de guardado quedan lejos del punto donde se edita. Incorporar del banco exige guardar antes, pero la indicación aparece dentro de una sección posterior. |
| El cambio de tipo recrea opciones y borra peso, puntajes y exclusión de inmediato; quitar una pregunta también es inmediato | Una acción durante la exploración puede perder configuración local sin aviso específico ni deshacer. |
| Los problemas de publicación aparecen en un aviso general, sin enlaces a las preguntas/campos afectados | Se obliga a buscar manualmente el lugar a corregir en una página larga. El botón Publicar queda deshabilitado antes de confirmar o guardar, con orientación limitada. |
| El banco despliega una lista vertical de entradas; solo filtra por área | Funciona con quince preguntas, pero resulta difícil de explorar si crece con preguntas propias o generales. |

Los primeros cuatro puntos se constataron en la interfaz y el código de `apps/web/src/Workspace.tsx` y `apps/web/src/styles.css`. «Efecto probable» es una hipótesis de usabilidad, no una medición de usuarios.

## Qué indican las fuentes

- La [divulgación progresiva de Nielsen Norman Group](https://www.nngroup.com/articles/progressive-disclosure/) recomienda mostrar primero las opciones necesarias para la tarea y ofrecer claramente las avanzadas después. También advierte que demasiados niveles ocultan funciones frecuentes y que separar pasos interdependientes genera idas y vueltas. **Inferencia para Screeningroom:** mostrar un resumen de todas las preguntas y editar una a la vez, manteniendo las reglas de evaluación accesibles dentro de esa pregunta, parece más adecuado que desplegar veinte tarjetas completas o forzar un asistente de veinte pantallas.
- La [guía de formularios complejos de NN/g](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/) enfatiza estructura, claridad, transparencia y apoyo; la [guía de asistentes](https://www.nngroup.com/articles/wizards/) reconoce que reducen información visible, pero pueden añadir muchos clics en tareas repetitivas. **Inferencia:** usar etapas amplias —puesto, preguntas, revisión— sin convertir cada campo en una pantalla.
- El [patrón de revisión de GOV.UK](https://design-system.service.gov.uk/patterns/check-answers/) reúne respuestas por secciones y permite volver a corregir antes de confirmar. Su [resumen de errores](https://design-system.service.gov.uk/components/error-summary/) enlaza cada error al control correspondiente y conserva lo ingresado según su [guía de validación](https://design-system.service.gov.uk/patterns/validation/). **Inferencia:** antes de la publicación inmutable conviene una revisión con estado por pregunta, reglas/umbral visibles y saltos directos a cada problema.
- [W3C WAI](https://www.w3.org/WAI/tutorials/forms/grouping/) recomienda agrupar visual y semánticamente controles relacionados. Esto es especialmente relevante para opciones, puntuaciones y respuestas que cumplen excluyentes; una mejora visual no debe perder etiquetas ni manejo por teclado.
- El [patrón de botones de GOV.UK](https://design-system.service.gov.uk/components/button/) reserva los botones para acciones; el [texto de ayuda de inputs](https://design-system.service.gov.uk/components/text-input/) coloca instrucciones útiles junto al campo. [WCAG 2.2, tamaño mínimo de objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) exige al menos 24 × 24 CSS px salvo excepciones. **Decisión:** los controles compactos conservan semántica de botón, foco visible y área táctil suficiente; la explicación crítica queda a la vista y la ayuda ampliada se abre también sin hover.
- [Typeform](https://help.typeform.com/hc/en-us/articles/360052109711-Edit-your-form-in-preview-mode) ofrece una vista previa separada de la edición/publicación; [Google Forms](https://support.google.com/docs/answer/2839737?hl=en) permite añadir, duplicar, ordenar e importar preguntas; [SurveyMonkey](https://help.surveymonkey.com/en/surveymonkey/create/question-bank/) permite explorar el banco por categoría, búsqueda y filtros. Son referencias funcionales de sus productos, no un mandato para copiar su diseño. En Screeningroom la vista del candidato dependerá de T-06 y las reglas del puesto siempre requieren revisión del recruiter.

## Propuesta implementada para probar, sin cambiar P-01 a P-08

1. **Encabezado de trabajo compacto.** Mostrar nombre del screening, estado persistido/cambios sin guardar y acciones «Guardar borrador» y «Revisar publicación» a la vista durante la edición. En móvil, la barra superior se integra en el flujo para no tapar campos ni teclado. Mantener guardado explícito y el control de concurrencia actuales; investigar autoguardado después con pruebas de conflicto y pérdida de red.
2. **Puesto → Preguntas → Revisión.** En «Puesto», título, área y descripción. En «Preguntas», listado compacto con número, criterio, tipo y estado («sin completar», «por configurar», «listo»); seleccionar una abre su editor. En «Revisión», umbral, puntuación/pesos/excluyentes/obligatoriedad resumidos y la confirmación para publicar. El recruiter puede volver a cualquier etapa sin perder edición local.
3. **Una pregunta activa.** Edición principal: criterio, texto, tipo y opciones. Mostrar puntuación/peso y exclusión bajo «Evaluación para este puesto», con explicación breve junto al control. Que los campos aparezcan cuando aplican, sin esconder el acceso a la evaluación. Conservar la diferencia entre «requiere respuesta» y «excluyente».
4. **Banco como buscador de contenido.** Abrirlo desde «Agregar pregunta» con pestañas o filtros Manual/Banco, área y búsqueda; mostrar vista breve antes de agregar. Una pregunta del banco entra sin reglas aprobadas. Más adelante, separar preguntas propias y compartidas según la decisión pendiente de producto.
5. **Prevenir pérdidas y guiar correcciones.** Antes de cambiar un tipo que destruiría opciones/reglas, explicar qué se restablecerá y pedir confirmación; al quitar una pregunta, ofrecer deshacer o confirmación. En la revisión, mostrar problemas cerca de cada pregunta y un resumen enlazado a los campos; mover el foco al resumen al intentar publicar con errores. Explicar por qué no se puede publicar, sin depender de un botón inerte.
6. **Vista previa del candidato cuando exista el cuestionario.** Permitir comprobar texto y opciones como los verá una persona candidata antes de publicar; mantenerla separada de la configuración y sin alterar respuestas reales.

```text
Puesto            Preguntas                                  Revisión
Título, área      1. Control de versiones · Lista            2 preguntas · 1 por configurar
Descripción       2. Ejemplo de comunicación · Lista         Umbral y reglas resumidas
                  [+ Agregar: manual | banco]                [Ir al problema] [Publicar]

                  Pregunta seleccionada: contenido | evaluación para este puesto
```

Es un esquema de navegación que orientó la implementación, no un diseño validado con usuarios. El orden de las etapas, la densidad y la ubicación de acciones deben contrastarse con recruiters. No se alteró el backend, la validación de publicación ni la inmutabilidad del publicado.

## Aplicación y límites

El editor ya separa Puesto, Preguntas y Revisión. Presenta un índice compacto con una pregunta activa; las acciones para añadir preguntas y respuestas son botones semánticos con aspecto de enlace, más pequeños que los anteriores. Los campos tienen etiquetas, estados de foco y ejemplos; criterio, peso y umbral tienen ayuda que se abre por clic, toque o teclado. La explicación imprescindible de «respuesta requerida», «excluyente» y respuesta desconocida permanece visible. La revisión muestra opciones, valores, pesos y condiciones antes de confirmar la publicación.

Cambiar tipo o quitar una pregunta configurada requiere confirmación cancelable. La búsqueda del banco funciona por área y texto; añadir una entrada con edición local guarda primero con control de revisión y no preaprueba sus reglas. Los errores de publicación del servidor se muestran en un resumen que lleva al campo correspondiente. La vista móvil usa un índice de preguntas desplazable horizontalmente y la ayuda se abre en flujo, sin desbordamiento de página a 375 px.

La prueba de navegador con datos ficticios cubrió creación, pregunta manual, nueva respuesta/valores, incorporación del banco con cambios locales, guardado/recarga, rechazo por umbral y foco en el campo, publicación, copia y dos pestañas con conflicto 409 y edición local preservada. Tipos/lint/build/OpenSpec y 41 pruebas de API/persistencia pasaron. Esto es verificación funcional y evaluación experta; no reemplaza una prueba observada con recruiters ni acredita accesibilidad completa. La vista previa del candidato sigue pendiente del cuestionario T-06.

## Orden de trabajo y evidencia necesaria

| Prioridad propuesta | Cambio | Comprobación |
| --- | --- | --- |
| Alta | Aviso/deshacer en cambios de tipo y eliminación; estado de guardado/acción visible; errores enlazados | Ninguna configuración desaparece sin aviso; guardar/releer y conflictos 409 mantienen datos; teclado llega a error y campo. |
| Alta | Resumen compacto de preguntas y edición de una pregunta activa | Crear y revisar 3, 10 y 20 preguntas sin perder contexto; comparar tiempo/desplazamiento con versión actual. |
| Media | Flujo Puesto/Preguntas/Revisión y banco con búsqueda | Crear una pregunta manual y otra del banco, volver entre etapas, corregir publicación y comprobar móvil 375 px. |
| Tras T-06 | Vista previa de candidato | Comparar vista previa con el cuestionario real, incluida respuesta desconocida y reglas no visibles para candidatos. |

Probar primero con tareas ficticias y recruiters representativos: crear un puesto con tres preguntas, configurar una puntuable y una excluyente, guardar/retomar, corregir un rechazo de publicación y añadir desde el banco. Registrar finalización, errores, vueltas atrás, tiempo, ubicación de dudas y comentarios; comparar con la versión actual. Una evaluación experta como esta identifica riesgos, pero no reemplaza esa observación.
# Actualización de la revisión del 03/10

El editor ahora guarda automáticamente el borrador completo con revisión optimista y muestra pendiente, guardando, guardado o error con reintento. La publicación espera confirmación del guardado y muestra los requisitos faltantes; el servidor rechaza umbrales que superan el máximo posible del promedio ponderado. Esta actualización sustituye la recomendación histórica de mantener «Guardar borrador» como acción explícita en la primera iteración.
