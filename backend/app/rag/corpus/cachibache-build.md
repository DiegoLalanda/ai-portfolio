# CachiBache, build móvil

project_id: proj-cachibache-app
lang: es

## Por qué EAS

Google Auth, mapas y notificaciones push no funcionaban en el entorno estándar de Expo. El proyecto final de la Tecnicatura de la UNER pasó a EAS Build y a credenciales de Google Cloud para OAuth, mapas, Cloudinary y Firebase Cloud Messaging.

## Sesión

El cliente guarda el acceso con JWT y refresh token en el AuthContext. El backend es NestJS con TypeORM y PostgreSQL, desplegado en Railway. El resultado documentado es un APK conectado a ese backend.
