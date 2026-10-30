# Ideas Xinfin: contexto para continuar con otro agente

Actualizado: 30 de octubre de 2026. Lee este archivo antes de modificar el proyecto. Es el punto de entrada actualizado; los documentos históricos pueden describir decisiones ya reemplazadas. Confirma siempre el estado real de los archivos, Git y producción antes de actuar.

## Objetivo y decisión principal del usuario

La web que se debe mantener y mejorar es **la landing NUEVA de Ideas Xinfin**. El usuario busca atraer negocios que quieren digitalizarse y están cansados de propuestas visuales genéricas. Quiere una presentación profesional, distintiva, atractiva y con animaciones elegantes, en tema claro y oscuro.

**No reconstruir, copiar ni publicar la estructura visual anterior de xinfinlab.com.** El sitio anterior solo interviene como origen de redirecciones y señales SEO. Conservar posicionamiento no implica conservar su diseño ni sus páginas HTML. Esta aclaración es expresa del usuario y prevalece sobre planes anteriores.

## Dónde está el trabajo

- Carpeta de código actual: `C:/Users/Felipe Plascencia/Documents/Xinfin/ideasxinfin`.
- Repositorio: https://github.com/ideasxinfin-glitch/ideasxinfin
- Rama de trabajo: `feature/nueva-web-ideas-xinfin`.
- Producción: https://ideasxinfin.com/
- Preview separado: https://ideasxinfin-preview.ideasxinfin.workers.dev/
- Instrucciones del directorio padre: `../AGENTS.md`. Hay grafo en `graphify-out/`; consultar con `graphify query` antes de preguntas sobre código y actualizarlo después de modificar código.

**Estado de entrega (30/10/2026):** la versión publicada en Cloudflare, sus imágenes, scripts de build, Worker, pruebas y esta documentación se sincronizan en la rama `feature/nueva-web-ideas-xinfin`. Para continuar en otro equipo, clona esa rama y confirma el último commit remoto. Revisa siempre `git status --short` antes de editar y no descartes modificaciones existentes. Se excluyen builds, credenciales, capturas de revisión, el grafo regenerable y las páginas HTML antiguas archivadas localmente; ninguno de esos respaldos es necesario para construir la landing nueva. Los recursos legacy necesarios para el build sí están incluidos.

## Archivos que se editan

HTML, CSS y JavaScript nativos, sin framework ni dependencias de producción. Node.js 22 o superior.

| Archivo | Responsabilidad |
| --- | --- |
| `public/index.html` | Landing nueva: contenido, secciones, dispositivos del hero, servicios y diálogos |
| `public/styles.css` | Composición responsive, tipografía, ambos temas y efectos visuales |
| `public/app.js` | Tema, menú, diálogos, formulario y comportamiento general |
| `public/theme.js` / `public/contact.js` | Utilidades de tema y validación/construcción de la consulta |
| `public/motion.js` | Animaciones, revelados y respeto de movimiento reducido |
| `public/analytics.js` | Eventos internos; no asumir que hay proveedor conectado |
| `public/assets/` | Logos, fuentes y fotografías optimizadas |
| `public/privacidad.html` | Aviso de privacidad; revisar datos legales antes de asumir que están completos |
| `scripts/build.mjs` | Build de preview en `dist/`, bloqueado para indexación |
| `scripts/build-production.mjs` | Build real en `dist-production/`, metadatos, sitemap, políticas y recursos legacy |
| `production-worker.js` | Dominio canónico, redirecciones, cabeceras e indexación |
| `wrangler.jsonc` | Worker de preview |
| `wrangler.production.jsonc` | Worker de producción y rutas de los cuatro hosts |
| `tests/` | Pruebas de contacto, movimiento, producción y asistente |
| `public/chat.js` | Chat flotante del asistente IA y conexión de la demo; mejora progresiva |
| `worker/chat/` | Backend del asistente: modelos con respaldo, caché, RAG, prospectos y panel `/admin/chat/` |
| `migrations/chat/` | Esquema D1 del asistente |
| `wrangler.chat-test.jsonc` | Worker de prueba del asistente (`ideasxinfin-chat-test`), separado de producción |

Editar fuentes, no `dist/` ni `dist-production/`: se regeneran. El build de producción limpia su salida para impedir que reaparezcan páginas antiguas.

## Dirección visual y comportamiento aprobados

- Paleta mineral: grafito y piedra en oscuro; marfil, gris y tonos naturales en claro. Evitar naranjas saturados, neón, brillo dorado excesivo y aspecto genérico de imágenes de IA.
- Tipografía editorial con encabezados serif, buen espacio y contraste; conservar identidad y logos completos originales del infinito.
- Hero fotográfico arquitectónico con laptop y móvil construidos en HTML/CSS. Las pantallas deben mostrar una landing reconocible, no solo un paisaje.
- Mantener experiencia responsive, navegación por teclado, foco visible y legibilidad en ambos temas.
- Animaciones activas por defecto. **El usuario pidió quitar el botón de pausar/reproducir**; no reintroducirlo por leer documentación anterior. Respetar `prefers-reduced-motion` y suspender trabajo cuando la pestaña está oculta.
- WhatsApp flotante con halo, barrido y gesto sutil del icono, aproximadamente cada ocho segundos. Evitar movimiento constante invasivo.
- Formulario prepara un mensaje de WhatsApp: el visitante lo revisa y envía allí. No hay backend de leads, bandeja de entrada ni envío automático.
- Asistente: la demo de la sección de automatización y el chat flotante (`public/chat.js`) usan la misma API `/api/chat`. Solo se activan cuando `/api/chat/status` responde, es decir, cuando el Worker tiene `CHAT_ENABLED=true` y una base D1. Si no, la demo sigue siendo una simulación local que no afirma tener IA conectada. Desde el 30/10/2026 está activo en producción (ideasxinfin.com) y en el entorno de prueba https://ideasxinfin-chat-test.ideasxinfin.workers.dev. El panel administrativo de producción permanece cerrado hasta configurar Cloudflare Access. Detalle, políticas y activación: `docs/ASISTENTE-IA.md`.
- Proyectos y marcas ilustrativas son **conceptos**, no clientes reales ni resultados demostrados. No inventar testimonios o métricas.

### Imágenes vigentes importantes

- Revisión local 30/10/2026: sección de proceso con `process-listen.webp`, `process-design.webp`, `process-build.webp` y `process-evolve.webp`. Cuatro escenas del proyecto ilustrativo FORMA con contenido relevante dentro de las pantallas y materiales; títulos y explicaciones HTML debajo. Cuatro columnas en escritorio, dos en tablet y una en móvil. Publicada en producción y preview el 30/10/2026.

- Revisión local 30/10/2026: `contact-creative-studio-purpose.webp` como fondo de contacto, con velos CSS distintos por tema y encuadre/desvanecido en móvil. Pantalla con el texto solicitado “Diseño digital para negocios con propósito.” y CTA “Hablemos”. Formulario sólido y lógica de WhatsApp intacta. La versión sin ese texto se conserva como `contact-creative-studio.webp`. Publicada junto con la imagen de automatización el 30/10/2026.

- Revisión local 30/10/2026: `automation-opportunity.webp` ilustra WhatsApp → oportunidades → cita en el panel izquierdo de automatización; fotografía con texto HTML y secuencia de pasos debajo. Integrada, comprobada y publicada el 30/10/2026.

- `scene-mineral-dark.webp` / `scene-mineral-light.webp`: escenarios del hero según tema.
- `service-platforms-landing.webp`: laptop recta y móvil con landing del estudio ficticio FORMA, navegación, textos y CTA.
- `service-automation-editorial.webp`: composición de módulos de automatización.
- `service-marketing-social.webp`: campaña de café ORIGEN con Instagram, Facebook y búsqueda; estos canales deben ser reconocibles.
- `project-origen-brand.webp`: concepto de marca ORIGEN para portafolio y diálogo compartido.
- Hay versiones anteriores conservadas en assets. Comprueba referencias HTML/CSS antes de sustituir una imagen.

Prompts, procedencia y decisiones: `docs/SERVICE-CAMPAIGN.md` y `docs/MINERAL-ASSETS.md`. Las imágenes son sintéticas ilustrativas y se optimizaron a WebP. El nuevo agente puede usar su herramienta de generación disponible; no debe asumir acceso a originales fuera de la carpeta del proyecto.

## Producción y migración: estado que hay que preservar

1. `ideasxinfin.com` sirve exclusivamente la landing nueva. `www` y HTTP se normalizan a HTTPS sin www.
2. `xinfinlab.com` y `www.xinfinlab.com` redirigen mediante Cloudflare. Las 46 rutas antiguas conocidas se consolidan con 301 a la portada nueva, conservando parámetros de consulta.
3. `migration/routes.json` es un inventario para redirecciones, **no una lista de páginas que haya que reconstruir**. Rutas desconocidas no deben convertirse indiscriminadamente en páginas 200.
4. `migration/pages/` contiene 45 páginas antiguas como respaldo local. **No copiarlas al build ni desplegarlas.** Se retiraron expresamente después de que el usuario rechazara su estructura visual.
5. `migration/assets/` conserva archivos públicos antiguos. El build los sirve bajo `/legacy/` para enlaces y video bajo demanda; no implica aplicar estilos antiguos a la nueva web.
6. Sitemap de producción: solo la nueva portada. Canonical: `https://ideasxinfin.com/`. No anunciar páginas en inglés inexistentes.
7. Preview y hosts técnicos workers.dev siguen sin indexación. No retirar sus restricciones al corregir SEO de producción.
8. La antigua regla Cloudflare que enviaba Ideas Xinfin hacia Xinfin Lab está deshabilitada. **No reactivarla:** produciría un bucle con la redirección actual.
9. Xinfin Lab sigue registrado en Hostinger, con renovación conservada. Nameservers: `eloise.ns.cloudflare.com` y `ernest.ns.cloudflare.com`; zona Cloudflare activa. Se conservó el TXT de verificación de Google.
10. **No cancelar el hosting compartido de Hostinger:** aloja otro sitio ajeno a esta migración. No modificar otros dominios, sitios ni renovaciones.

Worker de producción: `ideasxinfin-production`. Última versión registrada en esta sesión: `693de030-64c0-42f3-a5a1-512d73ffc288`; comprobar el despliegue vigente, no asumir que este ID seguirá siendo el último.

### SEO pendiente y límites

Pendiente acceder a la cuenta propietaria de Search Console, revisar propiedades, tramitar cambio de dirección cuando corresponda y enviar el sitemap nuevo. No se ha confirmado que esos pasos estén terminados. No asumir que una cuenta de Google visible es la propietaria.

Las redirecciones pueden ayudar a trasladar señales, pero no garantizan conservar posiciones, especialmente de páginas antiguas por ciudad o idioma consolidadas a la portada. No hay datos confirmados de tráfico/posiciones en esta guía. El historial de informes de Search Console no se fusiona automáticamente con el dominio nuevo. **No volver a publicar el sitio antiguo como supuesto requisito SEO.**

Detalle de migración: `docs/MIGRATION-STATUS.md`. `migration/hostinger-redirect.htaccess` es una propuesta previa no aplicada; no instalarla sin revisar su correspondencia con la estrategia actual del Worker.

## Trabajar y verificar

Desde la raíz del repositorio:

```sh
node scripts/serve.mjs
```

Abre `http://localhost:4173/`. Se puede usar `PORT` para otro puerto. Revisa `/?tema=dark` y `/?tema=light`; comprueba el tema efectivo y preferencias guardadas. El servidor de fuentes no sustituye la prueba del Worker y sus redirecciones.

```sh
node scripts/lint.mjs
node --test
node scripts/build-production.mjs
```

Último control de la sesión anterior: 15 pruebas y lint correctos; ejecutar de nuevo tras los cambios relevantes. Las pruebas de producción generan su salida. Revisar visualmente escritorio y móvil, ambos temas, CTA, diálogos, formulario y movimiento reducido; no enviar mensajes reales de WhatsApp para probar.

Para probar el Worker localmente después del build:

```sh
npx --yes wrangler dev --config wrangler.production.jsonc --port 4176
```

Publicación **solo cuando la tarea del usuario la incluya**; una petición de modificar diseño no debe interpretarse automáticamente como publicar:

```sh
node scripts/build-production.mjs
npx --yes wrangler deploy --config wrangler.production.jsonc
node scripts/verify-production-live.mjs
```

Para preview: `node scripts/build.mjs` y `npx --yes wrangler deploy --config wrangler.jsonc`. No confundir configuraciones. Autenticar con el mecanismo propio de Cloudflare si hace falta; nunca incorporar tokens, cookies ni credenciales al repositorio, al documento o a mensajes.

## Documentación histórica y orden de lectura

1. Este archivo.
2. `docs/MIGRATION-STATUS.md` para dominios y SEO.
3. `docs/SERVICE-CAMPAIGN.md` y `docs/MINERAL-ASSETS.md` para imágenes.
4. Código y configuración actuales para resolver detalles concretos.

`docs/REFINEMENT-V3.md`, `docs/REFINEMENT-V4.md`, planes antiguos y partes del README original cuentan etapas anteriores: pueden hablar de pausa de animaciones, publicación pendiente o no tocar dominios. Esas descripciones fueron reemplazadas por las decisiones y despliegues indicados aquí.

## Texto para iniciar con otro agente

> Lee CONTEXTO-PARA-AGENTES.md y las instrucciones AGENTS.md aplicables. Trabaja sobre la landing nueva de Ideas Xinfin en public/, rama feature/nueva-web-ideas-xinfin. Revisa el último commit y los cambios locales antes de editar. Mantén ambos temas, la dirección visual mineral, las animaciones accesibles y las redirecciones actuales. No reutilices el diseño ni las páginas antiguas de Xinfin Lab. Después te indicaré el cambio concreto que quiero; no publiques sin que mi tarea lo incluya.
