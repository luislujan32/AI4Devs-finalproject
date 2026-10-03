# Diseño

El borrador se envía como reemplazo completo tras una pausa breve. Las escrituras se serializan y usan la revisión del servidor; una edición posterior durante el envío provoca otro guardado. El estado solo dice «guardado» al recibir la respuesta. El servidor admite opciones temporalmente vacías en un borrador; publicación exige contenido y reglas válidas.

El puntaje final es un promedio ponderado en escala 0–100. El máximo posible se calcula con la mejor respuesta de cada pregunta puntuable y sus pesos. Si ese máximo es menor que el umbral, la publicación se rechaza. El editor muestra el máximo y la explicación de pesos.

La versión nueva copia configuración e identificadores internos nuevos, registra `basedOnScreeningId` y conserva al original, sus invitaciones y resultados. Los informes se consultan en una vista completa dentro del área Postulantes.

Para el correo se genera un token aleatorio de 32 bytes, se persiste solo su HMAC y se envía en el fragmento URL. La API lo consume atómicamente, comprueba origen y CSRF, limita intentos por IP y crea la misma sesión de candidato que el código. La interfaz elimina el token de la barra de direcciones al abrirlo. El enlace compartible contiene solo el identificador público y requiere el código. Las invitaciones anteriores continúan usando código.
