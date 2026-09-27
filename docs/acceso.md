# Acceso del recruiter y cuentas ficticias — T-02

[README](../readme.md) · [Ejecución local](desarrollo.md).

El acceso y la consulta de screenings propios están implementados. Luis eligió cuentas ficticias para desarrollar; las cuentas reales se aprovisionarán después en el entorno acordado. Esta etapa no implementa el editor ni el flujo del candidato.

## Preparar una demo local

Después de instalar dependencias, copiar .env.example solo si no existe .env y levantar la infraestructura, generar la clave sin mostrarla ni reemplazar una existente:

```bash
node --input-type=module <<'JS'
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
let content = await readFile('.env', 'utf8');
if (!/^SESSION_SECRET=.+$/m.test(content)) {
  content = content.replace(/^SESSION_SECRET=.*\n?/m, '');
  content += '\nSESSION_SECRET=' + randomBytes(32).toString('base64url') + '\n';
  await writeFile('.env', content, { mode: 0o600 });
}
JS
npm run demo -- --database screeningroom_demo_local
npm run dev
```

MONGODB_URI debe apuntar a esa misma base; .env.example ya usa screeningroom_demo_local. Una configuración existente puede usar otro nombre screeningroom_demo_*, siempre que coincida con --database. SESSION_SECRET es obligatorio y debe tener al menos 32 caracteres; usar generación aleatoria. No reemplazar una clave válida al reiniciar: cambiarla invalida sesiones y tokens previos.

Abrir http://127.0.0.1:5173. La demo crea recruiter.a@example.test y recruiter.b@example.test, cada uno con un borrador propio. Las contraseñas aleatorias quedan únicamente en `.local/demo-screeningroom_demo_local.json`, ignorado por Git y creado con permisos 0600. Consultar ese archivo localmente; no copiar su contenido a documentación, logs, chat ni Git. El comando no imprime contraseñas y repetirlo conserva las existentes y documentos ajenos; ante colisión falla sin sobreescribir. No recuperar o resetear cuentas mediante fixtures. La cuenta histórica de T-01 continúa inactiva.

## Sesiones y autorización

Password: Argon2id, 19 MiB, dos pasadas y paralelismo uno. Es la configuración mínima indicada por [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); producción requiere medir el coste en su entorno.

Cookie sr_session: token aleatorio de 32 bytes, HttpOnly, SameSite=Lax, Path=/ y Secure con HTTPS. MongoDB conserva su HMAC, el token CSRF y vencimiento absoluto de ocho horas. Consultar no prolonga la sesión. Reautenticar rota la cookie e invalida la anterior; salir revoca la sesión y borra la cookie. Cada petición verifica fecha, principal recruiter y usuario activo, independientemente del TTL. La UI mantiene contexto/CSRF en memoria y no usa localStorage/sessionStorage para credenciales.

Login exige origen permitido y token de preacceso con cookie firmada, válida quince minutos; las mutaciones autenticadas exigen origen y token de sesión. La protección combina token y origen siguiendo [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). Los endpoints futuros deberán usar el mismo guard y aplicar ownership antes de leer/escribir.

La colección técnica auth_limits incrementa contadores atómicamente: hasta 50 solicitudes de login por IP y 10 por correo en cada ventana fija de quince minutos, incluidos accesos correctos. Guarda claves HMAC y fecha TTL, sin email/IP en claro. No es una sexta entidad de negocio. No se configura trust proxy: actualmente la IP corresponde al socket; antes de desplegar detrás de proxy se debe definir la frontera de confianza y comprobar el límite con la arquitectura real.

## Rutas implementadas

Todas llevan prefijo /api; estas rutas complementan los tres ejemplos del OpenAPI documental.

| Método y ruta | Comportamiento |
| --- | --- |
| GET /auth/csrf | Nonce de prelogin; cookie firmada HttpOnly; sin caché |
| POST /auth/login | Body email/password; origen y X-CSRF-Token; usuario mínimo, CSRF y expiresAt |
| GET /auth/session | Recupera contexto de recruiter válido, sin cookie/hash como JSON |
| POST /auth/logout | Guard, origen y CSRF; revoca sesión; 401 si ya no es válida |
| GET /screenings | Hasta cien entradas propias, más recientes primero; metadatos |
| GET /screenings/:id | Documento propio; id inválido, inexistente o ajeno devuelven el mismo 404 |

Credencial inexistente/inactiva/incorrecta devuelve el mismo 401. Sesión ausente, falsificada, vencida, revocada o de candidato devuelve 401; CSRF/origen inválido devuelve 403; límite agotado, 429. El propietario se obtiene de la sesión, nunca de un ownerId del cliente.

## Provisioning administrativo posterior

`npm run provision:recruiter -- --email <correo> --name <nombre>` recibe la contraseña por stdin desde una fuente local segura, nunca como argumento o URL. Requiere 12–128 caracteres y crea sin reemplazar cuentas existentes. No enviar contraseñas por chat ni usar cuentas reales como fixtures. No hay registro público ni recuperación de contraseña por interfaz.

Producción exige NODE_ENV=production, PUBLIC_ORIGIN con origen HTTPS exacto, SESSION_SECRET protegido y MongoDB configurado para ese entorno. El servidor actual escucha en loopback. Esta etapa local no constituye una configuración de despliegue público.

## Evidencia y límites

El 27/09 pasaron tipos/lint/build/OpenSpec, trece pruebas HTTP/MongoDB de acceso, catorce de persistencia y smoke. La demo se ejecutó dos veces sin cambiar credenciales. Navegador real: rechazo de password incorrecto, cuentas A/B con listados propios, recarga conservando sesión, logout y formulario limpio, Tab entre campos y Enter para enviar; inspección de login/listado móvil a 375 × 812 sin desbordamiento horizontal.

Las pruebas aisladas acreditan expiración previa a TTL, revocación/rotación, inactivación, principal candidato, reinicio de API y límites por IP/correo. Cookie Secure/configuración HTTPS se comprobó por construcción, sin servidor TLS real. No se afirma una auditoría completa de seguridad/accesibilidad, ejecución remota de CI, paginación, OTP, publicación de screenings ni E2E del producto. T-01/T-02 están pendientes de integración por PR hacia entrega 2.
