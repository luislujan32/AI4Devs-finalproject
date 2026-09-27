## Why

La entrega 1 solo contiene documentación. T-00 debe convertir la arquitectura aprobada en una base ejecutable sobre la cual construir el recorrido principal de la entrega 2.

## What Changes

- Crear npm workspaces para React/Vite y NestJS/Express, con TypeScript y dependencias fijadas.
- Conectar la API a MongoDB local y exponer una comprobación de disponibilidad consumida por la interfaz.
- Servir el frontend compilado desde NestJS bajo el mismo origen; usar proxy en desarrollo.
- Preparar MongoDB y un buzón de prueba mediante Compose, ligados a localhost.
- Incorporar tipos, lint, compilación y comprobación de integración mínima reproducible.
- Documentar ejecución, límites y evidencia; registrar el workflow real con IA.
- Configurar OpenSpec y un contrato operativo breve de agentes para este proyecto.

## Capabilities

### New Capabilities

- `workspace-runtime`: instalación, ejecución conectada, disponibilidad y comprobación de la base del proyecto.

### Modified Capabilities

Ninguna. Las reglas P-01 a P-08 permanecen como contrato funcional previsto para los siguientes cambios.

## Impact

Nuevas carpetas apps/web, apps/api, scripts, configuración npm/Compose/CI y OpenSpec. Se actualizan documentación de ejecución y prompts.md. No se modifica la rama académica de entrega 1. Este cambio no implementa screenings, autenticación ni evaluación, ni da por cumplida la entrega 2.
