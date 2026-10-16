# Publicar la vista de revisión en Cloudflare

Estado al 16 de octubre de 2026: código completo respaldado en GitHub. Build, lint y cuatro pruebas aprobados. No hay conexión de Cloudflare disponible en esta sesión; no se ha creado un proyecto ni existe una URL de despliegue verificada.

## Conectar el repositorio (recomendado para seguir desde otras computadoras)

1. En https://dash.cloudflare.com entra a Workers & Pages → Create application → Pages → Import an existing Git repository.
2. Autoriza GitHub con la cuenta **ideasxinfin-glitch** y selecciona **ideasxinfin-glitch/ideasxinfin**.
3. Configura estos valores:

| Campo | Valor |
|---|---|
| Nombre del proyecto | ideasxinfin-preview (o nombre disponible) |
| Rama de despliegue | feature/nueva-web-ideas-xinfin |
| Framework preset | None |
| Build command | node scripts/build.mjs |
| Build output directory | dist |
| Root directory | raíz del repositorio, dejar vacío |
| NODE_VERSION, si se solicita | 24 (también definido en .node-version) |

4. Pulsa Save and Deploy. Usa únicamente la URL pages.dev que devuelva Cloudflare. No agregues todavía dominios personalizados.
5. Comprueba el cambio Claro/Oscuro, los logos, las animaciones y su pausa, navegación móvil, WhatsApp, redes y formulario. El formulario prepara un mensaje; la persona decide enviarlo desde WhatsApp.

Los siguientes cambios enviados a esta rama se desplegarán mediante la integración de Git. No seleccionar main: la implementación permanece en la rama de feature. El repositorio no contiene credenciales ni depende de esta computadora.

## Alternativa: carga directa

El paquete **ideas-xinfin-cloudflare-pages.zip** contiene el build listo para subir, con index.html en la raíz del ZIP. En Pages elige carga directa/drag and drop, selecciona el ZIP y publica. El proyecto de carga directa no puede convertirse después a integración Git; para sincronización automática conviene la primera opción.

Para reconstruir el ZIP en cualquier computadora: ejecuta `node scripts/build.mjs` y comprime **el contenido** de dist, no su carpeta contenedora.

## Alcance de la publicación

La autorización actual cubre una vista de revisión en Cloudflare. No agregar ideasxinfin.com ni modificar xinfinlab.com. Se mantienen noindex y las cabeceras de seguridad de dist/_headers. Falta completar los datos legales antes del lanzamiento comercial. No se activa analítica externa ni recepción de correo.

## Documentación oficial

- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
