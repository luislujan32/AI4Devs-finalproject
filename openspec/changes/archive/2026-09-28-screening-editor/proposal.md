## Why
T-02 permite acceder y consultar borradores; T-03 debe permitir configurar y publicar un screening real para iniciar el flujo principal de entrega 2, preservando P-01/P-02/P-04/P-06/P-08.

## What Changes
- Crear/guardar borradores propios con control de revisión y publicación validada/inmutable; copiar publicados a nuevos borradores sin invitaciones.
- Editor de preguntas manuales y copia del banco, configuración explícita de evaluación y confirmación al publicar.
- Preparar quince entradas de catálogo, solicitar revisión de Luis antes de cargar; comandos explícitos y repetibles que preservan datos ajenos.
- Pruebas HTTP/MongoDB de ownership, reglas, concurrencia e inmutabilidad y navegador real.

## Capabilities
### New Capabilities
- `screening-authoring`: borrador, reglas, publicación y copia con concurrencia/ownership.
- `question-catalog`: catálogo por área revisado, copia aislada y provisioning explícito.
### Modified Capabilities
Ninguna: el listado de T-02 se amplía por implementación sin cambiar su contrato de acceso.

## Impact
Módulo NestJS Screenings, UI React, schemas existentes y documentación de la ruta representativa publish. Sin dependencias nuevas. La confirmación explícita de configuración se incorpora al contrato documental de publicación, aún sin consumidores externos. El banco queda pendiente de carga hasta revisión humana; el flujo manual progresa independientemente.
