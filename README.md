# Ideas Xinfin · primera versión navegable

Web editorial responsive para presentar tres pilares: plataformas digitales y landing pages; IA y automatizaciones; marketing digital, redes sociales y SEO.

## Stack y costo

HTML semántico, CSS y componentes de comportamiento con módulos JavaScript nativos. Sin dependencias de producción o instalación. Es una elección intencional frente a Next.js para esta etapa: no hay contenido dinámico del servidor ni cuentas, y así se puede servir desde alojamiento estático económico sin un servidor permanente. Los componentes interactivos son tema, navegación móvil, demos en dialog y formulario de consulta. Si se incorpora un CMS o recepción de leads en servidor, se puede migrar conservando diseño y contenido.

## Ejecutar y verificar

Requiere Node.js 22 o superior. No requiere npm para funcionar.

```sh
node scripts/serve.mjs
node scripts/lint.mjs
node --test tests/*.test.mjs
node scripts/build.mjs
node scripts/serve.mjs --dist
```

Abrir http://localhost:4173. Si npm está disponible, los equivalentes son `npm run dev`, `npm run lint`, `npm test`, `npm run build` y `npm run preview`. No hay paso de instalación ni lockfile porque no hay paquetes externos.

## Contacto funcional

El formulario valida nombre, servicio, mensaje, consentimiento y un campo antispam. Construye un enlace codificado al WhatsApp publicado en el sitio original. El visitante revisa y envía desde WhatsApp: **continuar no significa que la consulta se haya enviado**. No existe bandeja de entrada, correo o base de datos en esta versión. No se guarda información del formulario y no hay claves falsas. El contacto directo funciona también sin JavaScript.

Para recepción en servidor, antes de implementar hacen falta destino de las consultas, proveedor y política de conservación. Eso es una ampliación pendiente, no una integración activa. El aviso de privacidad indica los datos legales pendientes antes del lanzamiento público.

## Preview y despliegue

`dist/` es el directorio publicable, creado por build. Preparado para alojamiento estático con soporte de `_headers`, como Cloudflare Pages. Sites usa el manifiesto `.openai/hosting.json` para una revisión privada en un dominio separado. No se configura ningún dominio comercial ni se modifica xinfinlab.com. El hosting público definitivo y sus costos deben elegirse al aprobar lanzamiento.

La rama `feature/nueva-web-ideas-xinfin` contiene la implementación. `main` se inicializa solo con una nota README para poder crear la rama en el repositorio vacío. La sincronización de Sites utiliza un repositorio técnico separado; GitHub es el repositorio de entrega.

## SEO y accesibilidad

Título, descripción, Open Graph, tarjeta social, idioma es, encabezados semánticos y Organization JSON-LD. Preview bloqueado con robots/noindex. Antes de producción: confirmar URL canónica, añadir canonical/og:url y sitemap, imagen social final, datos legales y retirar noindex **solo después de aprobar publicación**. Se omite URL canónica ahora para no anunciar una publicación inexistente.

Salto a contenido, estados accesibles del menú y tema, controles nativos, labels, mensajes live, dialog modal, focus visible, reduced motion y navegación por teclado. Comprobar también con lector de pantalla real antes del lanzamiento. Los gráficos decorativos están ocultos a tecnologías asistivas.

## Rendimiento y seguridad

Sin fuentes remotas, trackers, bibliotecas de animación o video automático. Hero vectorial adaptable sin imágenes pesadas; video bajo demanda, `preload=none`. Los módulos son del mismo origen; no hay HTML formado con entrada del visitante. CSP, no-referrer, nosniff, frame denial y permisos restringidos se configuran en `_headers`; el servidor local también los aplica. Verificar soporte de cabeceras en el hosting definitivo.

La analítica está preparada como eventos internos sin transmisión ni identificadores (`public/analytics.js`). Respeta Do Not Track y Global Privacy Control. Para conectarla, añadir un adaptador, credenciales reales cuando correspondan y consentimiento según el proveedor. Nunca incluir valores del formulario en eventos.

## Contenido y pendientes

Ver `docs/CONTENT-SOURCES.md`: contacto y servicios del sitio original; videos inventariados; sin resultados, testimonios ni clientes no verificados. Logo reconstruido desde descripción: sustituir por los archivos aprobados cuando estén disponibles. Las demos son conceptos, no un portafolio de clientes reales. Se requiere material aprobado para convertirlo en portafolio real.
