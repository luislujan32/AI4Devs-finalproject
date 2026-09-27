## Why

T-00 conecta web, API y MongoDB, pero aún no persiste entidades del producto. T-01 debe convertir el modelo aprobado del README en schemas, índices y fixtures verificables antes de construir autenticación y editor para la entrega 2.

## What Changes

- Definir los cinco schemas y objetos embebidos del README §3, con límites, identificadores, validación estructural y normalización coherentes.
- Crear índices de unicidad, consulta y retención; separar TTL de comprobación de vigencia.
- Aportar operaciones concretas de persistencia donde sean necesarias para validar ownership de referencias y actualizaciones condicionadas.
- Incorporar carga explícita y repetible de fixtures ficticios sin borrar datos ajenos, junto con pruebas en MongoDB aislado.
- Documentar semántica de configuración publicada, intento, informe y revisión; conservar sin implementar aún las reglas de publicación y evaluación de sus tickets.

## Capabilities

### New Capabilities

- `domain-persistence`: representación, restricciones y evidencia de persistencia del modelo aprobado.

### Modified Capabilities

Ninguna. workspace-runtime conserva su contrato de infraestructura.

## Impact

API NestJS/Mongoose, comandos de fixtures y pruebas, pipeline y documentación. No añade endpoints de producto, UI de negocio, proveedor IA, envío SMTP ni despliegue. No requiere una jerarquía genérica de CRUD. El catálogo de quince preguntas se redacta y revisa en T-03; los fixtures de T-01 son datos de prueba.
