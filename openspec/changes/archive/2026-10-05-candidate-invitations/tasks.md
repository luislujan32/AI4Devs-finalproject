## 1. Invitaciones

- [x] 1.1 Completar schema opcional de desafío y configurar Mailpit local sin credenciales versionadas.
- [x] 1.2 Crear/listar invitaciones de screenings publicados propios, con correo ficticio, enlace opaco, vencimiento y retención; verificar duplicados/ajenos.
- [x] 1.3 Mostrar invitaciones y enlace copiable en el publicado, con estados claros y sin exponer códigos.

## 2. Acceso del postulante

- [x] 2.1 Solicitar códigos de seis dígitos por Mailpit con CSRF/origen, 60 s entre envíos, cinco/hora y límite IP; no devolver código.
- [x] 2.2 Verificar/consumir código atómicamente, limitar cinco fallos y crear/rotar sesión propia de dos horas como máximo.
- [x] 2.3 Proteger sesión/CSRF/vigencia/retención de candidato y separar principal recruiter/candidato.
- [x] 2.4 Implementar pantalla de solicitud/verificación/retomar con UX-02 básica, teclado/móvil y errores recuperables.

## 3. Verificación y cierre

- [x] 3.1 Probar HTTP/MongoDB/Mailpit real local: ownership, duplicado, código correcto/incorrecto/vencido/usado, reenvío, límites, concurrencia, sesiones y expiración.
- [x] 3.2 Comprobar navegador ficticio de recruiter → enlace → Mailpit → candidato, incluida recarga y móvil; pasar checks y regresiones.
- [x] 3.3 Actualizar README, docs y prompts con rutas, parámetros, evidencia y límites; validar/archivar OpenSpec.
- [x] 3.4 Publicar solo en el fork, dejando entrega 2 y el repositorio académico sin cambios no aprobados.

Evidencia consolidada: [verificación del 04/10](../../../../docs/entrega-2-verificacion-2026-10-04.md). Integración local en entrega 2; código publicado en el fork. El PR/CI remoto se registra por separado al completarse.
