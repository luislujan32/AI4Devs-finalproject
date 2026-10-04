# Auditoría de producto y UX — espacio recruiter

**Fecha:** 04/10/2026. **Base:** seis capturas C1–C6 aportadas por Luis y código de `feature/review-feedback-LL` en `aafae97`. **Alcance:** investigación y propuesta; estas pantallas no se modifican aquí. Dos revisores independientes examinaron producto y UX/UI; un tercero comprobó viabilidad técnica de versiones, conteos y listas. Las capturas son evidencia de la experiencia actual, no una prueba observada con recruiters representativos. Las guías enlazadas informan patrones; las recomendaciones para Screeningroom son inferencias que debemos probar.

## Diagnóstico transversal

El sistema tiene una identidad visual inicial, pero no una estructura consistente de aplicación: el encabezado global solo ofrece marca y cierre de sesión; el dashboard enumera tarjetas altas con poca información; el detalle mezcla estado con acciones de ciclo de vida; Postulantes presenta recepción, resultado y decisión en filas separadas que no alinean entre sí. `styles.css` combina reglas globales con overrides y colores repetidos sin una escala explícita. La solución no consiste en llenar la interfaz de color: primero hay que definir navegación, densidad, componentes y semántica de estados.

La [guía de shell de Carbon](https://www.carbondesignsystem.com/building-blocks/core/components/ui-shell-header/guidelines) describe un encabezado persistente para orientación, enlaces y utilidades; la navegación lateral es opcional. Para este producto de pocas áreas basta un encabezado con **Screeningroom**, **Screenings** y un menú con el nombre del recruiter y **Cerrar sesión**. No se debe simular un perfil que aún no existe. Bajo él, cada página necesita título, estado, tarea principal y contexto de navegación propios.

## C1 — Dashboard y estructura general

**Observado:** `Workspace.tsx` muestra título, área y estado por SC y consulta como máximo 100 registros (`ScreeningsService.list`). No hay total, actividad ni conteos de invitaciones. Los estados Borrador/Publicado/Cerrado comparten casi todo el peso visual; los filtros calculados en el navegador solo actuarían sobre esa primera página.

**Propuesta:** una página de trabajo, no un mural de métricas. Arriba, título y **Crear screening**. Un resumen pequeño y accionable puede mostrar **Por revisar**, **Screenings activos** y **Borradores por completar**, siempre con definición y conteos reales del servidor. Debajo, búsqueda y filtro por estado aplicados por la API; lista compacta con columnas o filas alineadas: puesto, estado, área, postulantes, pendientes de decisión, última actividad y una acción contextual. Las fechas y cifras se muestran solo si el backend puede definirlas con exactitud. Las etiquetas de estado conservan texto y acentos sobrios; el color no es su único significado. [Carbon Data Table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) reúne búsqueda, filtros, orden, acciones y paginación en una zona coherente; [GOV.UK Tag](https://design-system.service.gov.uk/components/tag/) trata el estado como etiqueta, no como control.

**Comprobación:** con 101 SC, el último puede encontrarse y el total sigue siendo correcto; filtrar Cerrados no omite resultados; vacíos, carga y errores tienen estados propios; en móvil la fila se apila sin ocultar estado ni acción.

## C2 — Detalle, navegación y edición de un publicado

**Observado:** el encabezado mezcla «Publicado», «Crear nueva versión», «Cerrar SC» y retorno, mientras la sesión global se cierra más arriba. `Configuración/Postulantes` es estado local de React, no una ruta recuperable con Atrás/Adelante. El borrador tiene un proceso Puesto/Preguntas/Revisión; después de publicar, el trabajo habitual es invitar y revisar personas, y la configuración es consulta ocasional. [GOV.UK Tabs](https://design-system.service.gov.uk/components/tabs/) advierte que sus tabs no deben sustituir navegación entre páginas y pueden ocultar contenido que se necesita comparar.

**Propuesta de información:** `Tus screenings / Puesto` → encabezado con nombre y estado → navegación local **Postulantes** (primera vista del publicado) y **Preguntas y reglas** (consulta de configuración). El borrador conserva su editor por pasos. Cierre y versionado son acciones secundarias contextualizadas, no controles junto al estado. La ruta debe preservar sección, informe abierto y contexto de lista para que Atrás y enlaces directos sean comprensibles.

**Decisión de producto de Luis:** los cambios deben llegar **solo a futuras invitaciones**. No conviene mutar el documento publicado. [P-04](producto.md#p-04--publicación) congela preguntas/reglas; la invitación guarda `screeningId`, y `AttemptService` vuelve a leer el SC al mostrar, validar y evaluar. Cambiarlo en sitio puede alterar un intento abierto o invalidar respuestas. La copia actual crea otro borrador con IDs nuevos y sin postulantes: preserva el contrato, pero deja dos SC publicados sin versión activa ni agrupación. Para una edición que se sienta real, el diseño objetivo es una **familia de versiones**, una versión publicada activa para nuevas invitaciones y cada invitación fijada a la versión con la que se creó. La vista agrupa las versiones y explica cuál sigue recibiendo invitaciones. Las invitaciones ya emitidas no cambian, aunque aún no tengan respuestas. Antes de implementar esto, un cambio OpenSpec debe fijar transición y concurrencia al publicar una nueva versión.

**Comprobación:** editar desde publicado abre una versión editable claramente vinculada; publicar la nueva dirige solo invitaciones futuras a ella; una invitación antigua conserva preguntas, respuestas e informe; no aparecen dos puestos indistinguibles en dashboard; un enlace al informe vuelve a su lista y filtros. Mientras no exista versión activa, la acción debe describirse honestamente como «Crear SC basado en este», sin prometer edición del original.

## C3 — Postulantes: la cola de trabajo

**Observado:** tres ejes independientes —recepción, resultado de criterios y decisión humana— se distribuyen en filas flex sin columnas compartidas. Por eso «Sin decisión» no alinea con los otros estados. `CandidateService.list` devuelve como máximo 100 invitaciones y la UI llama `items.length` «postulantes invitados»: el número deja de ser total real al superar 100. Una búsqueda o filtro exclusivamente local ocultaría resultados.

**Propuesta:** una cola **Por revisar** y una lista de todos los postulantes en la misma área, con filas compactas y columnas alineadas: postulante, respuesta, resultado, decisión, fecha/actividad y acción «Ver informe». Búsqueda por nombre o correo y filtros por respuesta, resultado y decisión; priorizar «Sin decisión» como trabajo pendiente, sin inferir que el sistema contactó o movió de etapa a nadie. La API entrega página/cursor, total y filtros; el orden tiene desempate estable. Conservar filtro, página, scroll y foco al volver del informe. En móvil, cada fila se apila con etiquetas explícitas. [Carbon Data Table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) contempla navegación a un registro, acciones de fila y paginación; aplicamos el principio sin obligarnos a importar esa biblioteca.

**Comprobación:** el postulante 101 es accesible; los conteos incluyen todo el conjunto autorizado y respetan vencimiento/retención; dos recruiters no ven datos ajenos; las filas mantienen columnas alineadas; los filtros activos son visibles y se pueden restablecer; abrir/volver no reinicia la tarea.

## C4 — Informe y alternativa Kanban

El informe ya separa cálculo y decisión humana, un avance importante. Para consultas repetidas, conviene una cabecera compacta que mantenga ambos datos a la vista, un enlace «Ir a respuestas» y una sección de factores que requieren atención antes del detalle completo. Cada respuesta debería seguir el mismo orden de lectura: criterio y pregunta, respuesta declarada, efecto de la regla (valor y peso o excluyente), y faltante si lo hay. Con 20 preguntas, un índice de criterios puede llevar al detalle sin esconder la evidencia. El valor 0–100 por pregunta debe llamarse **valor de la respuesta**, no sugerir un umbral individual: el umbral solo se aplica al resultado global. La revisión humana muestra decisión, motivo, fecha y una acción clara para modificarla, sin mantener el formulario abierto.

Un Kanban no es la vista principal adecuada **ahora**. Las columnas de un pipeline representan etapas únicas y transiciones; Screeningroom registra recepción, resultado y decisión como dimensiones independientes, pero no administra etapas de contratación. Un tablero obligaría a inventar una etapa o a hacer que «Continuar» parezca un movimiento que el sistema no ejecuta. El [pipeline visual de Greenhouse](https://support.greenhouse.io/hc/en-us/articles/4874727408795-Visual-Candidate-Pipeline) sí tiene etapas configuradas y movimiento explícito; incluso limita las tarjetas por columna y remite a la lista completa. Podemos reconsiderar Kanban cuando exista un pipeline real, con responsables, transiciones e historial. Por ahora, lista filtrable + informe enlazable sirve mejor a 100 personas.

**Comprobación:** desde la lista se distinguen recepción, cálculo y decisión sin abrir cada informe; el detalle explica cómo se calculó el resultado y permite volver a la misma búsqueda/página; no hay gráficos que atribuyan un umbral inexistente a una pregunta.

## C5 — Invitación y feedback

**Observado:** «Invitación enviada a…» permanece en la vista aun cuando la fila nueva ya demuestra el estado guardado. El formulario y el mensaje compiten con la lista. El servicio borra la invitación recién creada si falla el envío local; por tanto, el éxito debe referirse solo a un correo efectivamente aceptado por Mailpit.

**Propuesta:** tras invitar, cerrar el formulario y anunciar una confirmación concreta una vez; la nueva fila será la evidencia persistente. El aviso puede cerrarse y desaparece al cambiar de tarea/página, mientras que un error no se oculta por tiempo y conserva los datos para reintentar. No hace falta un centro de notificaciones sin eventos que consultar. [GOV.UK Notification Banner](https://design-system.service.gov.uk/components/notification-banner/) usa el aviso para una acción dentro del recorrido y retira el éxito al cambiar de página; [W3C Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html) exige comunicar cambios de estado a tecnologías de apoyo sin interrumpir innecesariamente.

**Comprobación:** se confirma una sola vez la dirección destinataria; al volver no queda un éxito antiguo; fallo de envío dice claramente que **no se envió**, conserva los campos y ofrece recuperación; lector de pantalla anuncia resultado y errores.

## C6 — Correo de invitación

**Observado:** el mensaje tiene HTML y texto, pero el plazo relativo «7 días» no indica fecha/hora concreta. La versión texto explica mejor la recuperación de acceso que el HTML. El modelo actual no guarda organización ni contacto de soporte; el correo no debe inventarlos ni prometer seguimiento automático.

**Propuesta de contenido:** asunto específico «Invitación para responder preguntas de [puesto] — Screeningroom»; remitente reconocible; primera frase que explique la tarea; botón único «Responder preguntas»; vencimiento absoluto con zona horaria; explicación breve de que el enlace es personal y de un uso; URL alternativa copiable; recuperación de acceso existente descrita igual en HTML y texto. Si se desea nombre de empresa, firma del recruiter o ayuda de contacto, primero debe haber datos y responsabilidad reales para mostrarlos. La [guía de mensajes de GOV.UK](https://www.gov.uk/service-manual/design/sending-emails-and-text-messages) recomienda asunto concreto, información importante al comienzo, instrucciones y plazo claros, sin jerga. Esta mejora requiere pasar `expiresAt` al generador local de correo.

Ejemplo de contenido para probar, sin prometer una organización o seguimiento que el producto aún no registra:

> **Asunto:** Te invitaron a responder preguntas para «[puesto]» — Screeningroom
>
> Hola, [nombre]. Te invitaron a responder un cuestionario para «[puesto]». Podés completarlo hasta el [fecha y hora, zona horaria].
>
> **[Responder preguntas]**
>
> Este enlace es personal y se usa una vez para abrir el cuestionario. Si querés continuar más tarde, podés volver a la invitación y verificar tu correo. Si no esperabas este mensaje, podés ignorarlo.

**Comprobación:** HTML y texto dicen lo mismo; el CTA y la URL funcionan; el vencimiento coincide con la invitación persistida; lectura a 320 px y en clientes de correo de prueba; no se afirma una empresa, soporte o contacto posterior inexistente.

## Sistema visual mínimo y orden de trabajo

Antes de retocar cada captura por separado, fijar pocos tokens de superficie, borde, texto y acentos semánticos (neutro, información, éxito, atención y error), una escala de espacio/tipo y cuatro patrones reutilizables: **etiqueta de estado, fila de datos, resumen e informe, confirmación/error**. El color acompaña texto; tamaños de botón, alineación y foco se comparten. Esto permite dar más cuerpo al producto sin añadir decoración arbitraria. [WCAG: uso del color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) y [contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) orientan la comprobación.

1. **Base de datos/UI veraz:** paginación y filtros del servidor para SC y postulantes, totales definidos e índices medidos según consultas reales. No presentar conteos derivados de una página truncada.
2. **Arquitectura de información:** shell global, dashboard compacto, detalle con navegación y rutas recuperables; lista de postulantes alineada y cola «Por revisar». Aceptar con 0, 1, 25 y 101 registros ficticios.
3. **Sistema visual y microinteracciones:** estados, acciones secundarias, informe compacto, confirmaciones y correo; verificar teclado, lector, 375 px y zoom de 400% sin desbordamiento del documento.
4. **Versionado para futuras invitaciones:** cambio de producto separado con familia, versión activa, pertenencia de cada invitación y pruebas de concurrencia. Las versiones publicadas e invitaciones existentes permanecen estables.

Un cambio no está validado por verse mejor en una captura: deben probarse una tarea completa de recruiter, la vuelta al listado, casos vacíos/de error y la comprensión de estados con usuarios representativos. La investigación no modifica por sí sola P-01 a P-08 ni implementa estas propuestas.
