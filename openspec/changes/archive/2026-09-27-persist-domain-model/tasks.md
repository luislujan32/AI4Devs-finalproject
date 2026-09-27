## 1. Schemas y semántica

- [x] 1.1 Definir y registrar los cinco schemas y objetos embebidos según README §3, sin introducir endpoints ni CRUD genérico.
- [x] 1.2 Implementar límites, normalización, ids únicos y forma de respuestas; conservar borradores incompletos y score nulo.
- [x] 1.3 Documentar fuente de verdad, snapshots, datos derivados y restricciones que corresponden a servicios posteriores.

## 2. Índices y operaciones concretas

- [x] 2.1 Crear índices de unicidad, consulta y TTL, sin borrar índices o datos ajenos.
- [x] 2.2 Validar existencia/publicación/ownership al crear referencias y comprobar escrituras con revisión esperada.
- [x] 2.3 Probar en MongoDB real duplicados, referencias ajenas y carrera de dos escrituras; releer el resultado persistido.

## 3. Fixtures y cierre

- [x] 3.1 Añadir carga explícita y repetible de fixtures ficticios en destino de prueba; comprobar que conserva documentos ajenos.
- [x] 3.2 Ejecutar casos de estructura válidos/inválidos y pruebas de índices en una BD aleatoria aislada; limpiar solo esa BD.
- [x] 3.3 Integrar comandos y pipeline pertinentes; ejecutar tipos, lint, build, regresión de infraestructura y OpenSpec.
- [x] 3.4 Actualizar README, desarrollo y prompts con evidencia real y límites; archivar solo al completar implementación y comprobaciones.
