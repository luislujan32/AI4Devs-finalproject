## 1. API de respuestas

- [x] 1.1 Exponer cuestionario/respuestas propios sin reglas internas ni ID de invitación como input.
- [x] 1.2 Validar y reemplazar respuestas con answerRevision/CAS; permitir borrador incompleto y recuperar tras nuevo acceso.

## 2. Evaluación y envío

- [x] 2.1 Implementar evaluación pura P-01 a P-08 y ejemplos del contrato, con evidencia conocida/desconocida/omitida.
- [x] 2.2 Validar obligatoriedad y enviar una sola vez con reporte atómico, recibo OpenAPI e idempotencia.

## 3. Verificación y documentación

- [x] 3.1 Probar algoritmo y HTTP/MongoDB: formas, ownership, CSRF, CAS, requeridos, doble envío, vencimiento y no filtración.
- [x] 3.2 Pasar check/regresiones, actualizar README/docs/prompts y archivar OpenSpec cuando el cambio esté completo.
- [x] 3.3 Publicar rama solo en fork para integrar hacia entrega 2.
