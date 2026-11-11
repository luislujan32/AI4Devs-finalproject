## Why

El revisor necesita repetir el flujo de entrega final en una URL pública sin que Luis contrate infraestructura ni compre un dominio para enviar correos.

## What Changes

- Preparar una imagen que sirva la aplicación compilada, con MongoDB externo y HTTPS terminado por el alojamiento.
- Usar el buzón Mailpit como entorno de correo de prueba autenticado. Las invitaciones y códigos conservan su comportamiento y solo se admiten direcciones ficticias.
- Sembrar un recruiter de revisión y el banco aprobado exclusivamente en la base de demo, sin reemplazar credenciales ni datos.
- Automatizar el recorrido completo de navegador y documentar qué se verificó en local y qué queda por comprobar tras publicar.

## Capabilities

### New Capabilities
- `public-academic-demo`: alojamiento de la demo ficticia con acceso de revisión y correo de prueba protegido.

### Modified Capabilities
Ninguna regla de evaluación, acceso del candidato ni autoría cambia.

## Impact

Docker, despliegue, verificación en CI, configuración del transporte Mailpit y documentación de revisión.
