# SEO de ideasxinfin.com

Actualizado: 30/10/2026. Fases 1 y 2 aprobadas y **publicadas en producción** (Worker `ideasxinfin-production`, versión `d281be1d-df68-4594-83cf-53382449987f`; la anterior, con dictado por voz y sin estas páginas, es `90b8e362-1f1a-4243-a28e-927f810705f0`). Después se publicó el favicon con el logotipo infinito (`favicon.ico`, `assets/icon-192.png`, `apple-touch-icon.png`; también es el `logo` de los datos estructurados) como versión `3efa4103-beb0-49c6-b9a3-052872e5e56e`. Luego, los logotipos nuevos (`assets/logo-wordmark-dark.webp` y `logo-wordmark-light.webp`, fondo transparente, sin `mix-blend-mode`) como versión `169621ea-83dc-4e3e-928e-788a35edfc13`. Verificado en vivo: las 12 URL responden 200 e indexables, el sitemap lista 12, las rutas antiguas sin equivalente siguen en 301 a la portada y `xinfinlab.com/mx/<ciudad>` llega a la página nueva.

## Objetivo

Posicionar Ideas Xinfin en búsquedas orgánicas de Mérida, Guadalajara, Ciudad de México, Monterrey y el resto de México, y en búsquedas en español de toda Latinoamérica (y de hispanohablantes en otros países). No se puede garantizar el primer lugar: depende de la competencia, del tiempo (normalmente meses) y de la autoridad externa.

## Qué se implementó

**Fase 1 (base técnica)**
- Portada: título «Diseño web, landing pages e IA en México | Ideas Xinfin», descripción con los precios aprobados y Open Graph actualizado.
- Datos estructurados de la portada (`@graph`): `ProfessionalService` (área de servicio: países de habla hispana; catálogo de servicios con precios), `WebSite` y `FAQPage` generada desde las preguntas visibles de la portada.
- La pregunta «¿Cuánto cuesta…?» de la portada ya muestra los precios aprobados.
- Cloudflare Web Analytics: la CSP permite `static.cloudflareinsights.com` y `cloudflareinsights.com` (antes el beacon quedaba bloqueado). Sin cookies; mencionado en el aviso de privacidad.

**Fase 2 (páginas nuevas, mismo diseño de la landing)**
- 4 páginas de servicio en `/servicios/`: `landing-pages`, `redes-sociales-google-business`, `inteligencia-artificial` y `seo`.
- 7 páginas de ciudad en las **mismas direcciones del sitio anterior**: `/mx/merida/`, `/mx/guadalajara/`, `/mx/ciudad-de-mexico/`, `/mx/monterrey/`, `/mx/queretaro/`, `/mx/puebla/` y `/mx/cancun/`. Recuperan el historial de esas URL con contenido nuevo y propio de cada ciudad, no con las páginas antiguas.
- Cada página tiene título, descripción, canonical, hreflang `es`/`x-default`, Open Graph, migas de pan y datos estructurados (`BreadcrumbList`, `Service` con precio cuando existe y `FAQPage`).
- Enlaces internos: cada tarjeta de servicio de la portada enlaza a su página; un bloque «Servicios y ciudades» aparece en la portada y en todas las páginas nuevas.
- Sitemap con las 12 URL y `lastmod`.
- Las demás rutas antiguas (otras ciudades de México, Estados Unidos, Canadá e inglés) siguen redirigiendo 301 a la portada. `xinfinlab.com/mx/<ciudad>` redirige a la página de ciudad nueva.

## Cómo está construido

- Contenido: `scripts/seo-content.mjs`. Reglas: sin oficinas, clientes, resultados ni garantías inventados; precios solo los aprobados (landing desde $3,800 MXN en un pago; redes y Google Business desde $3,500 MXN al mes).
- Generador: `scripts/seo-pages.mjs` (cabecera, pie, esquemas y bloque de enlaces). Lo llama `scripts/build-production.mjs`.
- Comportamiento compartido: `public/site.js` (tema, menú móvil y medición de WhatsApp), usado por `public/app.js` (portada) y `public/page.js` (páginas nuevas, con el asistente IA).
- El Worker sirve las rutas publicadas (las claves de `migration/policies.json`) y solo consolida en la portada las rutas antiguas sin equivalente.
- Para agregar una ciudad: añadirla a `CITIES` con contenido realmente propio. Si su ruta existe en `migration/routes.json`, dejará de redirigir automáticamente.

## Pasos que dependen del usuario

1. **Search Console** (hecho por el usuario, 30/10/2026): propiedad de dominio `ideasxinfin.com` verificada por TXT, sitemap enviado y «Cambio de dirección» desde `xinfinlab.com`. Los TXT `google-site-verification` de ambas zonas deben conservarse. Revisar en 1–2 semanas «Páginas» (indexación) y «Rendimiento».
2. **Perfil de Empresa en Google**: uno solo, con domicilio real o como negocio de zona de servicio. No crear perfiles en ciudades sin presencia física (va contra las directrices de Google).
3. **Cloudflare Web Analytics**: activo; el beacon se carga sin errores desde el despliegue `d281be1d`. Los datos se consultan en el panel de Cloudflare → Web Analytics.

## Fase 3 (propuesta, sin implementar)

Artículos útiles (por ejemplo, «¿Cuánto cuesta una landing page en México?»), alta en directorios mexicanos y créditos «Sitio por Ideas Xinfin» en los sitios de clientes, con su permiso.
