# Migración a Ideas Xinfin

Actualización 30/10/2026: publicadas las mejoras de automatización (WhatsApp/CRM), contacto (estudio creativo con “Diseño digital para negocios con propósito.” en pantalla) y las cuatro etapas del proyecto FORMA con títulos y explicaciones. Producción `693de030-64c0-42f3-a5a1-512d73ffc288`; preview `f5967ea6-33f2-4d93-96d8-5f3f1a55be53`. Lint y 15 pruebas correctos antes del despliegue. Verificados públicamente HTML, CSS y seis imágenes activas contra los archivos del build, todos 200 y contenido idéntico. Verificadas las 46 redirecciones sin errores; producción indexable. Fuentes y recursos de esta versión sincronizados en la rama feature/nueva-web-ideas-xinfin por solicitud del usuario.

Estado 2026-10-29, tras aclaración del usuario: publicar exclusivamente la landing nueva. No reutilizar estructura visual anterior.

- Producción: https://ideasxinfin.com/ sirve public/index.html con SEO de producción y sin el bloque añadido de ciudades.
- Eliminada la copia de 45 páginas antiguas del build y del sitio desplegado. Fuentes quedan solo como respaldo local en migration/pages; el build no las copia.
- Las 46 rutas conocidas de Xinfin Lab se consolidan con 301 a la nueva portada. Las rutas antiguas del dominio nuevo también redirigen a esa portada, sin mostrar diseños anteriores.
- La nueva oferta cubre los servicios principales; la consolidación no garantiza mantener posicionamiento específico por ciudad/idioma y Google puede reevaluar esas URLs.
- xinfinlab.com y www usan Cloudflare para redirigir. Nameservers registrados en Hostinger: eloise.ns.cloudflare.com y ernest.ns.cloudflare.com. Zona Cloudflare activa. Registro del dominio y renovación siguen en Hostinger. No se canceló hosting compartido ni se modificaron otros sitios.
- Conservado el TXT de verificación Google de Xinfin Lab. Search Console: pendiente seleccionar la cuenta propietaria y tramitar cambio de dirección/sitemap.
- Canonical y sitemap: solo nueva portada indexable. Preview workers.dev sigue noindex.
- Los recursos públicos antiguos guardados en /legacy mantienen enlaces a archivos y el video bajo demanda; no incluyen páginas HTML ni estilos aplicados a la nueva landing.
- Rollback: fuentes y exportación DNS anterior en la carpeta de trabajo de esta conversación. Regla inversa en Ideas Xinfin queda deshabilitada para evitar bucle. No activarla mientras Xinfin Lab redirige a Ideas Xinfin.
