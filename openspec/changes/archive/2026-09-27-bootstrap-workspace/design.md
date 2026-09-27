## Context

Contrato aprobado: stack y unidad de despliegue de readme.md §2; T-00 en docs/backlog.md. Existente verificado: seis archivos documentales y correcciones de CodeRabbit, sin código. Este cambio prepara infraestructura; las funcionalidades del dominio siguen pendientes.

## Goals / Non-Goals

**Goals:** instalación reproducible; frontend → API → MongoDB verificables; frontend compilado servido por la misma API; comandos de desarrollo y comprobación documentados; contexto de agentes breve y portable.

**Non-Goals:** autenticación, datos de candidatos, screenings, scoring, llamadas IA, hosting público y cumplimiento de toda la entrega 2.

## Decisions

- Node 24 LTS, React 19, Vite 8 y NestJS 12 con Express. Versiones exactas y lockfile. TypeScript 5.9 es compatible con el analizador de lint seleccionado; no adoptar TypeScript 7 mientras el analizador declare incompatibilidad. Es una decisión de tooling, no una regla del producto.
- Dos npm workspaces. API ESM compilada con tsc y metadatos de decoradores; desarrollo recompila y reinicia el proceso. Evita agregar un generador/orquestador adicional. Vite usa proxy /api a NestJS.
- Mongoose administra conexión; GET /api/health/ready confirma disponibilidad mediante ping con timeout. 200 solo con BD operativa; 503 con respuesta genérica si no está disponible. No revelar URI, credenciales ni errores del driver. El frontend comunica fallo y permite reintentar.
- NestJS sirve apps/web/dist en ejecución compilada. /api y sus errores quedan fuera del fallback SPA. No agregar CORS permisivo: desarrollo y producto usan el mismo origen desde el navegador.
- Compose prepara MongoDB y Mailpit, con puertos ligados a 127.0.0.1 y volumen persistente. Mailpit queda preparado para T-05; T-00 no implementa envío de correo. Base local sin datos reales y sin exposición pública.
- Verificación de integración con BD aislada por ejecución: iniciar API compilada, leer readiness y página estática, comprobar persistencia con reconexión y verificar que /api inexistente siga siendo 404. Es evidencia de infraestructura; no se presenta como E2E del flujo principal.
- AGENTS.md referencia contratos del proyecto y criterios de Explore/Plan/Execute. Adaptar principios generales recuperados del harness anterior sin copiar contratos laborales. Las skills OpenSpec generadas son locales; los comandos globales quedan pendientes de elección del usuario si requieren instalación adicional.

## Risks / Trade-offs

- Dependencias cambiantes → versiones fijadas, lockfile, engines y CI sobre Node 24.
- Disponibilidad ficticia → readiness consulta MongoDB; comprobación usa un servicio real.
- BD caída durante una consulta → límite de tiempo y 503 genérico, sin información sensible.
- Código nuevo confundido con MVP completo → README y pantalla identifican el alcance de la base; siguientes tickets permanecen pendientes.
- Configuración exacta del harness anterior pendiente → configuración local mínima revisable, pendiente de reconciliar con la información que aporte Luis.

## Migration Plan

Instalar con npm ci; iniciar Compose; compilar y comprobar; ejecutar desarrollo. No hay migración de dominio ni datos existentes. Detener únicamente servicios de este Compose sin borrar volúmenes. La rama de entrega 1 conserva su contenido documental.

## Open Questions

Resuelto el 27/09: Luis aportó trece checkpoints del máster. Se reconciliaron sus principios en docs/harness.md; no se trasladan restricciones laborales ni se añaden schemas personalizados. Hosting, SMTP y proveedor/modelo IA se resuelven en los cambios pertinentes.

## Closing Evidence

T-00 se fusionó en el PR 1 del fork. Su base era entrega 1: se preservó el código íntegro en entrega 2 y se revirtió solo en entrega 1, sin reescribir historial. La entrega 1 volvió al árbol documental de c2fc032. El cierre sincroniza workspace-runtime a las specs vivas; las comprobaciones locales figuran en docs/desarrollo.md. No acredita CI remoto ni un MVP completo.
