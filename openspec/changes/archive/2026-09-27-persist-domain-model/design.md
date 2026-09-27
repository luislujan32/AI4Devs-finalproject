## Context

**Contrato:** README §3, T-01 y P-01–P-08. **Existente:** conexión Mongoose y readiness; aún no hay colecciones de negocio implementadas. **Propuesta técnica:** schemas y operaciones concretas de persistencia, sin endpoints. **Pendiente:** implementar y ejecutar la evidencia; no hay datos de candidatos que migrar verificados en este proyecto.

## Goals / Non-Goals

**Goals:** cinco schemas, objetos embebidos con límites, índices declarados y comprobados, fixtures repetibles, filtros de ownership y operaciones condicionadas. Documentar qué restricciones son estructurales y cuáles requieren servicios.

**Non-Goals:** login y store HTTP integrado (T-02), editor/publicación/catálogo definitivo (T-03), OTP/SMTP (T-05), scoring/envío final (T-07), informe UI/revisión (T-08), política de borrado completa (T-09). No construir una capa genérica de repositorios ni afirmar que un schema hace cumplir por sí solo P-01–P-08.

## Decisions

- Usar la conexión Mongoose existente y schemas explícitos para users, screenings, question_bank, invitations y sessions. Modelos registrados mediante un módulo NestJS reutilizable. No introducir ORM ni otro motor.
- Fuente de verdad de configuración: contenido de cada screening; una pregunta copiada conserva su contenido, no consulta dinámicamente el banco. Publicado es inmutable por contrato; su servicio de escritura se implementa en T-03. Referencias del banco son informativas, no dependencias de lectura del intento.
- Invitación embebe respuestas, informe y revisión. Estos datos podrán guardarse de forma atómica en un solo documento en T-07/T-08. Informe captura el cálculo asociado al envío, no recalcula desde preguntas editadas; revisión humana conserva su propia revisión y no sustituye el informe.
- Clarificación al implementar: el OpenAPI aprobado concreta Evidence como status/source/answerText. El informe persiste esa evidencia y sus aportes numéricos nullable, sin copiar Answer como su formato ni duplicar status fuera de Evidence. Las respuestas originales permanecen en answers; no se inventa un contrato alternativo de informe.
- Validadores estructurales para ids únicos, enum, números enteros y límites del README. Borradores admiten campos incompletos; la validación completa de publicación corresponde a T-03. No exigir pesos/puntajes completos al guardar un borrador. Validar shape de Answer; correspondencia con Question requiere cargar el screening y validar en el servicio de T-07.
- Email normalizado antes de persistir; índices únicos son la garantía frente a carreras. Probar duplicados realmente contra MongoDB, no contra un mock ni el supuesto de que unique es un validador de Mongoose.
- Implementar acceso concreto a referencias: la creación de una invitación verifica screening existente/publicado del mismo owner; una consulta ajena no revela el documento. No fiarse de un ownerId recibido de una futura petición: el servicio HTTP deberá derivarlo de su sesión en T-02/T-05.
- Actualizaciones condicionadas incluyen owner, estado y revisión esperada; dos escrituras con la misma revisión no deben tener éxito. Evitar un ciclo leer → guardar sin condición. Las transiciones completas de publicación/envío se mantienen en sus tickets.
- Índices conforme a README §3. TTL sobre purgeAt y expiración de sesión limpia almacenamiento con demora; los filtros de autorización y vigencia deberán comparar fechas explícitamente. T-01 no demuestra expiración de acceso porque todavía no implementa esos endpoints.
- Fixture reproducible con identidad estable y namespace de prueba, dominios de correo example.test y contenido ficticio. Carga explícita sobre una BD de fixtures indicada; no seeding automático al iniciar. Repetir no borra ni sobreescribe documentos ajenos. Ninguna contraseña de prueba habilita acceso a una instancia publicada; integración de provisioning en T-02.
- Pruebas con Node test runner o infraestructura existente, Mongoose real y nombre aleatorio de BD por ejecución. Siempre limpiar solo la BD creada por ese test. Tipos/lint/build no acreditan unicidad ni concurrencia; las pruebas deben leer el resultado persistido y comparar con casos definidos desde el contrato.

## Risks / Trade-offs

- Validación solo de documentos, omitida por updates → validación explícita en operaciones concretas y casos negativos de escritura; evitar rutas genéricas que permitan saltar invariantes.
- Índices declarados pero ausentes → esperar creación de índices y probar escritura duplicada en entorno aislado. No ejecutar syncIndexes destructivo sobre una BD ajena.
- Referencias sin integridad relacional automática → comprobar existencia/ownership al operar; no presentar ObjectId/ref como garantía de integridad.
- Fixtures confundidos con catálogo revisado o credenciales definitivas → identificar su uso de prueba; el catálogo de quince entradas y provisioning se resuelven en T-03/T-02.
- TTL confundido con control de acceso → documentación y pruebas distinguen almacenamiento, vigencia y política de retención.

## Migration Plan

Crear estructuras e índices en la BD local del proyecto; ejecutar fixtures solo por comando explícito y en destino de prueba. No hay evidencia de datos de dominio anteriores que deban migrarse. Si aparecen antes de aplicar, inspeccionarlos y definir transición antes de modificar. Un rollback de código no implica borrar volúmenes ni colecciones.

## Open Questions

Ninguna decisión de producto nueva bloquea T-01. El correo del recruiter inicial y su contraseña/provisioning se concretarán en T-02 sin compartir secretos en el chat. Hosting, SMTP y proveedor IA continúan fuera de este cambio.


## Closing Evidence

Implementación verificada en la rama feature/persistencia-T01-LL del fork, basada en entrega 2; integración por PR hacia entrega 2 pendiente. npm run check, catorce casos de MongoDB real y smoke pasaron localmente. Los casos usan y eliminan únicamente su BD aleatoria. Fixtures invocados dos veces por comando real, sin borrar documentos ajenos. Guía en docs/datos.md. No hay pruebas de endpoints de negocio ni CI remoto acreditado.
