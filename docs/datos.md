# Persistencia de Screeningroom

[Modelo aprobado](../readme.md#3-modelo-de-datos) · [Desarrollo](desarrollo.md).

## Implementación y límites

T-01 registra cinco modelos Mongoose en la API: users, screenings, question_bank, invitations y sessions. Los schemas están en apps/api/src/persistence/schemas.ts; PersistenceModule los registra y exporta el repositorio concreto. No añade endpoints de producto.

Los schemas rechazan campos no previstos, límites inválidos, ids duplicados y formas de respuesta incompatibles. Un borrador puede tener preguntas sin texto, umbral, pesos u opciones completos; guardarlo no significa que sea publicable. La validación completa de P-01–P-08 se realiza en los servicios de los tickets correspondientes.

## Semántica y autoridad

| Dato | Qué representa y quién podrá escribirlo |
| --- | --- |
| Screening | Fuente de verdad de su configuración. Recruiter propietario; edición solo en borrador. El servicio de publicación de T-03 validará y congelará la configuración |
| Pregunta del banco | Plantilla. El screening conserva una copia independiente, incluyendo orientación; bankQuestionId solo indica origen |
| Invitación/answers | Un único intento, con respuestas originales y answerRevision. El servicio de T-07 validará correspondencia con preguntas/opciones y guardará/envíará con concurrencia controlada |
| Report | Snapshot del cálculo al enviar. No contiene decisiones humanas ni una evaluación por IA. El algoritmo de T-07 aún está pendiente |
| Evidence del informe | status, source candidate_declaration y answerText conforme a OpenAPI; no es el objeto Answer ni una certificación de la declaración |
| Review | Revisión humana vigente, con su propia revision. T-08 validará motivo y conflicto; modificarla no debe reemplazar el informe |
| Session/auth | Contexto limitado de acceso y desafío. El store HTTP/OTP no está integrado aún; TTL no autoriza acceso |

El score global nulo y los aportes numéricos nulos se conservan sin convertirlos en cero. No se promete reconstrucción automática de informes: calcular, validar y conservar el snapshot se implementará en T-07.

## Operaciones concretas

PersistenceRepository permite buscar un screening por propietario, crear una invitación solo para un screening publicado de ese propietario y guardar preguntas de borrador con revisión esperada. El publicId de nuevas invitaciones se genera con 32 bytes aleatorios. Los datos de propietario deben proceder de una sesión validada cuando se integren los servicios HTTP; este repositorio no autentica peticiones.

El guardado de preguntas valida el documento completo antes de una actualización condicionada por id, owner, draft y revision. Dos escrituras con la misma revisión no pueden tener éxito. No se ofrece una actualización genérica que acepte estado, propietario, informe o reglas arbitrarias. Las futuras escrituras deben mantener esas garantías; usar directamente un modelo no convierte una operación en autorizada ni reemplaza validación de dominio.

La existencia y propiedad de referencias se comprueba en las operaciones concretas; MongoDB no aplica claves foráneas. El publicado no puede cambiar por la operación de borrador, pero el servicio completo de publicación/inmutabilidad se verificará en T-03.

## Índices y conservación

Índices únicos de email normalizado, publicId y pareja screeningId/candidateEmail; índices de ownerId/createdAt para screenings e invitaciones y area/active para banco. Sesiones tienen identificador único. TTL de invitaciones sobre purgeAt y sesiones sobre expiresAt, ambos con expireAfterSeconds 0. La API espera la inicialización de los modelos/índices antes de escuchar peticiones; no se usa syncIndexes ni se eliminan índices ajenos.

Una eliminación TTL puede demorarse. Los servicios de acceso deben comprobar expiresAt explícitamente; los índices no demuestran ese control ni el borrado completo de todos los datos asociados. La política de retención/borrado se implementará en T-09.

Los campos de contraseña, HMAC, id de sesión y CSRF están excluidos de consultas por defecto. Esto reduce exposición accidental, pero no sustituye DTOs de salida, control de logs y acceso explícito a secretos en T-02/T-05.

## Fixtures y pruebas

```bash
npm run fixtures -- --database screeningroom_fixtures_t01
npm run check
npm run test:persistence
npm run smoke
```

La carga requiere una BD con prefijo screeningroom_fixtures_ y nombre explícito; no se ejecuta al iniciar la aplicación ni sobre la BD de desarrollo. Inserta un usuario inactivo, una pregunta de prueba, un screening y una invitación ficticios. Conserva documentos existentes y detecta colisiones de identidad antes de escribir. Si hubo una interrupción, repetir completa inserciones ausentes; no es una transacción de todas las colecciones.

Los identificadores son estables y los correos usan example.test. Las fechas lejanas solo mantienen fixtures disponibles; no son la política de retención. No hay sesión, OTP, contraseña utilizable ni candidato real. Tampoco es el catálogo de quince preguntas revisadas de T-03.

La prueba crea una BD aleatoria aislada, espera índices, ejecuta casos negativos y relee resultados. Invoca dos veces el comando real de fixtures, preserva un documento ajeno, comprueba unicidad, ownership, concurrencia y separación del informe/revisión. Limpia únicamente su propia BD. Es integración de persistencia, sin demostrar todavía el E2E de producto, autenticación o despliegue.

Detalles operativos contrastados con [validación Mongoose](https://mongoosejs.com/docs/validation.html), [actualizaciones condicionadas](https://mongoosejs.com/docs/tutorials/findoneandupdate.html) e [integración NestJS/Mongoose](https://docs.nestjs.com/techniques/mongodb). La unicidad se verifica en MongoDB; no se considera un validador de documento.
