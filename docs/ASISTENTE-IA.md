# Asistente comercial IA: arquitectura, políticas y activación

Actualizado: 30/10/2026. Estado: **activo en producción en https://ideasxinfin.com** (despliegue autorizado por el usuario el 30/10/2026). Panel administrativo de producción **activo y protegido con Cloudflare Access** en https://ideasxinfin.com/admin/chat/.

## Recursos de producción

| Recurso | Nombre | ID |
| --- | --- | --- |
| Worker | `ideasxinfin-production` (mismas rutas de siempre) | versión vigente `63ef6f38-3163-4a6f-9940-1d3bcfb01746` (contacto móvil rediseñado, 02/11/2026); anterior `b000b9cc-818a-49c4-b32b-60502a424914` (nuevo panel del asistente); anterior `c5990da3-25eb-4ba3-ab77-e0eb03f2791f` (robot IA en el botón móvil y pulso de WhatsApp); anterior `0c9a012c-8ccd-4a2d-a637-51f953904561` (hero con 3 escenas, ver `docs/HERO-ESCENAS.md`); anterior `c9088d51-2148-4400-94ac-cb34e09c5c5b` (SEO, favicon, logos y ondas); con dictado por voz: `90b8e362-1f1a-4243-a28e-927f810705f0`; anterior con Access: `372e8f61-199c-431c-af9c-06fea73a3142`; primera versión con asistente: `8d772a1b-0155-4bd5-9249-b67c655e1ef9`; versión anterior sin asistente: `693de030-64c0-42f3-a5a1-512d73ffc288` |
| D1 | `ideasxinfin-chat` (migración aplicada) | `207758dc-bb52-4480-9d86-c3d4c1c3c28a` |
| KV | `ideasxinfin-chat` | `7059cc47e58a487eacc64741b84a0c75` |
| Cron | `23 9 * * *` | — |
| Secretos | `RATE_LIMIT_SALT` y `ADMIN_TOKEN` cargados; el valor del token está solo en `.dev.vars.production` (ignorado por Git) | — |
| Cloudflare Access | Zero Trust Free, equipo `crimson-cloud-d7e1.cloudflareaccess.com`; aplicación self-hosted «Ideas Xinfin - Panel asistente» | app `44cd7bee-1c64-4183-8570-49cca79f65ca`; AUD en `vars.ACCESS_AUD` |

Activo en producción: chat flotante, demo conectada, Gemma 4 → GLM 4.7, caché exacta y semántica, RAG, filtro de relevancia, límites por visitante y presupuesto de neuronas, sincronización diaria de la landing, aviso de privacidad actualizado y panel administrativo tras Access. Desactivado: Groq (sin `GROQ_API_KEY`) y captura de prospectos (`LEAD_CAPTURE_ENABLED=false`).

### Panel de producción con Cloudflare Access

Configurado el 30/10/2026. La aplicación de Access cubre `ideasxinfin.com/admin/chat` y `ideasxinfin.com/api/admin` (y sus subrutas), con sesión de 24 h y la política Allow «Equipo Ideas Xinfin» que solo incluye `ideasxinfin@gmail.com` (inicio de sesión con código por correo). El Worker vuelve a comprobar el JWT de Access (firma RS256, audiencia, emisor y vigencia) **y además** exige el `ADMIN_TOKEN`. Sin `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD`, ambas rutas responden 404.

Comprobado: sin sesión, las dos rutas redirigen al inicio de sesión de Access; `www` y `xinfinlab.com` redirigen a `ideasxinfin.com` antes de llegar al panel; en `ideasxinfin-production.ideasxinfin.workers.dev` (sin Access delante) el Worker responde 403 porque no hay JWT válido.

Para dar acceso a otra persona: Zero Trust → Access controls → Policies → «Equipo Ideas Xinfin» → añadir su correo. Para cambiar el token: generar uno nuevo de 32 caracteres o más, cargarlo con `npx wrangler secret put ADMIN_TOKEN --config wrangler.production.jsonc` y actualizar `.dev.vars.production`.

### Dictado por voz

Desde el 30/10/2026 el chat tiene un botón de micrófono (`public/chat.js`, función `dictation`). Usa el reconocimiento de voz del propio navegador (`SpeechRecognition`, idioma `es-MX`): funciona en Chrome, Edge y Safari, en computadora y celular, y en Firefox el botón no aparece. El texto se coloca en el campo para revisarlo y nunca se envía solo. No consume neurons ni pasa por el Worker, pero Chrome envía el audio a Google y Safari a Apple, por eso el aviso de privacidad lo menciona. Para permitirlo, `Permissions-Policy` pasó de `microphone=()` a `microphone=(self)` (solo este sitio, nunca iframes de terceros). Para quitarlo: borrar `dictation` y su botón en `chat.js`, volver a `microphone=()` en `production-worker.js`, `public/_headers`, `scripts/build-production.mjs` y `scripts/serve.mjs`, y retirar el párrafo del aviso.

### Diseño del panel (publicado el 02/11/2026, versión `b000b9cc`; rollback: `c5990da3`)

Rediseño según la imagen aprobada por el usuario. Solo cambió el frontal (`public/chat.js` y el bloque «Assistant panel» de `public/styles.css`); el backend, la caché, el RAG, los prospectos, los límites y el panel administrativo no se tocaron.

- Panel azul marino con iluminación azul/violeta, igual en tema claro y oscuro (tokens locales en `.chat-panel`).
  - Encabezado: logo original `logo-wordmark-dark.webp`, separador, robot SVG, título, punto verde y subtítulo. A la derecha: ampliar (solo con pantalla ≥ 960 × 640), minimizar y cerrar.
- **Inicio:**
  - Tarjeta de bienvenida con el robot (SVG propio, función `mascot`).
  - Seis tarjetas (`HOME_CARDS`).
  - Preguntas frecuentes (`HOME_FAQS`).
  - Para cambiarlas basta editar esas dos listas. Cada elemento manda su `question` a `/api/chat`, así que la respuesta siempre viene del asistente real.
- **Conversación:** al elegir una tarjeta o pregunta, o al escribir, el inicio se oculta y aparece el historial. Arriba hay un enlace «Explorar servicios» que regresa al inicio sin borrar nada; desde ahí, «Volver a la conversación».
  - Cerrar (×) borra la conversación; minimizar la conserva.
- **Vista ampliada:** 840 px de ancho, con las tarjetas en 3 columnas como en la referencia. El tamaño normal es de 496 px, con 2 columnas.
- **Móvil (≤ 700 px):**
  - Panel casi a pantalla completa, 2 columnas (1 columna por debajo de 340 px) y bloqueo del scroll de la página.
  - El panel sigue al `visualViewport` (`--chat-vh` y `--chat-kb`), así que el teclado no tapa el campo.
  - Al abrir en pantallas táctiles no se enfoca el campo, para que el teclado no cubra las tarjetas.
- **Micrófono:** es el dictado existente; solo aparece si el navegador lo soporta.
- **Pie del panel:** WhatsApp abre el redactor de siempre, que no envía nada solo. También incluye «Privacidad», «IA de Ideas Xinfin», el aviso de errores de IA y «Quiero que me contacten» si `LEAD_CAPTURE_ENABLED`.
- **Animaciones:** entrada del panel, de la bienvenida y de las tarjetas en cascada; hover y pulsación de las tarjetas; brillo de la antena y parpadeo del robot cada 8 s; puntos de «escribiendo».
  - Se apagan con `prefers-reduced-motion`. El robot se detiene con la pestaña oculta (`.motion-suspended`).
- **Accesibilidad:**
  - Tarjetas y preguntas son `<button>`.
  - Al cerrar o minimizar, el foco vuelve al botón del asistente (antes no volvía porque el lanzador seguía con `visibility:hidden` durante la transición).
- **Bienvenida:** el `welcome` y los `starters` de `/api/chat/status` ya no se muestran, porque la tarjeta de bienvenida y las preguntas frecuentes los reemplazan. Las sugerencias que devuelve cada respuesta sí se siguen mostrando.

### Precios cargados en producción

Autorizados por el usuario el 30/10/2026 y cargados en D1 de producción (no en `seed.js`, que sigue sin precios): landing page desde $3,800 MXN en un solo pago (entrada 25) y gestión y optimización de Google Business Profile y redes sociales desde $3,500 MXN al mes (entrada 26). También se actualizaron la política «Precios, tiempos y cotizaciones» (7) y la FAQ «¿Cuánto cuesta una página web?» (10), que decían que no había precios publicados. El resto de servicios sigue sin precio y se deriva a WhatsApp. La landing es pago único y la gestión es mensual (confirmado por el usuario); no se indicó IVA, así que el asistente no lo menciona. Para cambiarlos, usar el panel → Conocimiento.

Rollback del asistente sin tocar la landing: `CHAT_ENABLED = "false"` en `wrangler.production.jsonc` y volver a desplegar. Rollback completo a la versión anterior: `npx wrangler rollback 693de030-64c0-42f3-a5a1-512d73ffc288 --config wrangler.production.jsonc`.

## Recursos creados en Cloudflare (entorno de prueba)

| Recurso | Nombre | ID |
| --- | --- | --- |
| Worker | `ideasxinfin-chat-test` → https://ideasxinfin-chat-test.ideasxinfin.workers.dev (noindex, robots `Disallow`) | versión inicial `3b667361-2141-4888-923f-67b1bf00db51` |
| D1 | `ideasxinfin-chat-test` (migración `0001_init.sql` aplicada) | `e197bc0d-fa66-4121-b59b-ddbe1717cced` |
| KV | `ideasxinfin-chat-test` | `fc12730e8785484e9674f7797b0daecc` |
| Cron | `17 9 * * *` (purga de vencidos, sincronización de la landing, embeddings) | — |
| Secretos | `ADMIN_TOKEN`, `RATE_LIMIT_SALT` | valores solo en `.dev.vars.chat-test` (ignorado por Git) |

Panel: https://ideasxinfin-chat-test.ideasxinfin.workers.dev/admin/chat/ con el `ADMIN_TOKEN` de `.dev.vars.chat-test`. Para borrar el entorno: `npx wrangler delete --config wrangler.chat-test.jsonc`, `npx wrangler d1 delete ideasxinfin-chat-test` y `npx wrangler kv namespace delete --namespace-id fc12730e8785484e9674f7797b0daecc`.

## Qué se implementó

| Pieza | Archivo |
| --- | --- |
| Interruptor y enrutado `/api/chat*`, `/api/admin/*`, `/admin/chat/` | `production-worker.js` → `worker/chat/index.js` |
| Flujo de respuesta: reglas → caché exacta (KV) → FAQ aprobada / equivalencia semántica → RAG + modelo | `worker/chat/chat.js` |
| Proveedores con respaldo explícito, tiempos de espera y presupuesto | `worker/chat/providers.js` |
| Conocimiento, embeddings, RAG, sincronización de la landing, importación de documentos | `worker/chat/knowledge.js`, `worker/chat/seed.js` |
| Reglas de relevancia, datos personales, respuestas predefinidas | `worker/chat/text.js` |
| Contadores, límites, configuración | `worker/chat/store.js` |
| Prospectos (desactivados por defecto) | `worker/chat/leads.js` |
| Panel administrativo | `worker/chat/admin.js`, `worker/chat/admin-ui.js` |
| Esquema D1 | `migrations/chat/0001_init.sql` |
| Chat flotante y demo conectada | `public/chat.js`, estilos al final de `public/styles.css` |
| Entorno de prueba | `wrangler.chat-test.jsonc`, `.dev.vars.example` |
| Pruebas | `tests/chat.test.mjs`, `tests/d1-shim.mjs` |

Sin framework ni dependencias nuevas. La demo de la sección «Automatización con sentido» y el chat flotante usan la misma API y la misma conversación; si el servicio no responde, la demo vuelve a ser la simulación local de siempre y el botón del asistente no aparece.

## Modelos (verificados en el catálogo de Workers AI el 30/10/2026)

| Orden por defecto | Modelo | Uso |
| --- | --- | --- |
| 1 | `@cf/google/gemma-4-26b-a4b-it` | Conversaciones comerciales y complejas |
| 2 | `@cf/zai-org/glm-4.7-flash` | Preguntas breves (va primero si el mensaje es corto) y respaldo |
| 3 | GroqCloud `openai/gpt-oss-120b` | Emergencia; solo si existe el secreto `GROQ_API_KEY` |
| — | `@cf/baai/bge-m3` | Embeddings multilingües para equivalencias y RAG |

- Una llamada a la vez, un intento por proveedor, sin reintentos indefinidos. Tiempo de espera de 15 s por llamada.
- El razonamiento interno de Gemma y GLM se desactiva (`chat_template_kwargs.enable_thinking=false`): con él activo, ambos agotaban tiempo y tokens. Con él desactivado, las respuestas tardaron 3-5 s en las pruebas.
- Orden, activación y límites se cambian desde el panel (pestaña Modelos).

## Consumo y costos

- **Workers AI:** 10,000 neuronas diarias gratis para toda la cuenta, compartidas por todos los modelos y por otros proyectos de la cuenta. En plan Free, al agotarse fallan las llamadas; en plan **Paid, el excedente se cobra** ($0.011 por 1,000 neuronas). Por eso el servidor aplica un presupuesto propio (`neuronBudget`, 6,000 por defecto) con un contador único para Gemma, GLM y embeddings: cambiar de modelo no reinicia la cuota. Cada llamada reserva su costo máximo antes de ejecutarse y luego se ajusta al uso real. Las llamadas que expiran conservan la reserva (criterio conservador). Si Cloudflare responde que la asignación diaria se agotó, Workers AI queda en pausa hasta las 00:00 UTC.
- **Groq:** solo con una clave de una cuenta en plan gratuito (sin tarjeta). Tope propio de 300 solicitudes diarias; ante un 429, pausa según `retry-after` o hasta las 00:00 UTC. La página pública de límites no muestra las cifras del plan gratuito; deben confirmarse en la consola de Groq.
- **Sin proveedor disponible:** el visitante recibe preguntas frecuentes aprobadas (que se responden sin generar) y el acceso a WhatsApp. No se llama a ningún servicio de pago.
- **Límites por visitante (servidor):** 10 mensajes cada 10 minutos y 40 al día, mediante un hash diario y con sal de la IP (no se guarda la IP), además de un tope global de 400 respuestas generadas al día.
- **D1 (gratuito):** 5 GB por cuenta y 50 consultas por invocación; cada mensaje usa pocas escrituras. **KV (gratuito):** 1,000 escrituras diarias; el servidor limita las escrituras de caché a 300 al día.

### Por qué no AI Search ni Vectorize

AI Search empieza a cobrar el 1/11/2026 y su plan gratuito incluye 1,000 consultas semánticas al mes, que un chat público agotaría pronto. El RAG se implementó en D1 con `bge-m3` y similitud coseno dentro del Worker. Basta para cientos de fragmentos sin ningún servicio adicional. Si el conocimiento crece a miles de documentos, conviene reevaluar Vectorize revisando antes sus límites.

## Políticas de datos (definidas antes de activar la captura)

**Caché compartida.** Solo almacena respuestas aprobadas (preguntas frecuentes y conocimiento aprobado), y solo para preguntas que se entienden sin historial y que no contienen datos personales (correos, teléfonos, nombres, URL o identificadores). Las respuestas generadas por el modelo **nunca** entran en la caché: quedan como «candidatas» hasta que alguien las aprueba en el panel. Las claves de la caché incluyen la versión del conocimiento, así que cualquier cambio aprobado invalida todas las respuestas guardadas. Cuando hay precios o promociones vigentes, las preguntas sobre precios omiten la caché y siempre pasan por el RAG.

**Conversaciones.** No se guardan. El historial vive en la pestaña del visitante, y el servidor recibe como máximo los últimos 6 turnos y los descarta al responder. Solo se registra, sin datos personales, la primera pregunta de cada conversación como candidata para revisión, con vencimiento a 90 días.

**Prospectos** (`LEAD_CAPTURE_ENABLED=false` por defecto):
- Almacenamiento: tabla `leads` en D1. Guarda nombre, negocio, servicio, necesidad escrita por el visitante (no la conversación), contacto, presupuesto opcional, nivel de interés, estado y fecha.
- Consentimiento: casilla obligatoria, sin marcar por defecto, con versión `chat-leads-2026-10-30` registrada junto con la fecha. Sin consentimiento, el servidor rechaza los datos.
- Retención: `LEAD_RETENTION_DAYS`, 180 días por defecto (mínimo 30, máximo 365). El cron diario elimina los vencidos.
- Eliminación: borrado individual desde el panel y purga inmediata de vencidos. El borrado es definitivo.
- Acceso: solo el panel administrativo.
- **Antes de activar:** actualizar `public/privacidad.html` con la finalidad, la retención, los derechos ARCO y quién responde, y conservar la versión del consentimiento sincronizada en `worker/chat/leads.js` y `public/chat.js`.

**Autenticación administrativa.** Usa el secreto `ADMIN_TOKEN` (mínimo 32 caracteres; sin él, el panel responde 404), con comparación de tiempo constante y un límite de 30 intentos por hora. Las respuestas llevan noindex y no-store. El token se guarda en `sessionStorage` y se borra al cerrar la pestaña. **En producción** ambas rutas están además detrás de Cloudflare Access (plan Free, hasta 50 usuarios).

**Seguridad del modelo.** Las instrucciones del sistema van separadas del texto del visitante, y el conocimiento se envía marcado como datos, no como instrucciones. El conocimiento `confidential` nunca se envía al modelo. Un identificador canario bloquea las respuestas que filtren las instrucciones. Los mensajes admiten como máximo 600 caracteres y el cuerpo 8 KB. Además se exige el mismo origen, JSON y un campo trampa contra spam. Los registros de errores no guardan textos de visitantes ni credenciales.

**Aviso de privacidad.** `public/privacidad.html` incluye la sección «Asistente de inteligencia artificial»: envío a Cloudflare Workers AI y, si está activo, a GroqCloud; no se guardan conversaciones; primera pregunta anonimizada hasta 90 días; identificador diario sin IP. La captura de prospectos requerirá ampliar el aviso antes de activarse.

## Centro de conocimiento

- Tipos: `service`, `price`, `promo`, `faq`, `education`, `policy`, `page`, `document`. Visibilidad: `public`, `internal` (el asistente puede usarlo) o `confidential` (nunca sale). Cada entrada tiene estado, prioridad, versión, vigencia (desde/hasta) y fecha de actualización.
- Semilla: 24 entradas aprobadas tomadas de la landing y de `docs/CONTENT-SOURCES.md`, **sin precios**. Los precios, promociones y condiciones se agregan en el panel; mientras no existan, el asistente explica que se requiere una cotización personalizada.
- Sincronización: un cron diario (y el botón del panel) lee la portada publicada, crea o actualiza una entrada por sección (excepto el formulario de contacto), archiva las secciones que desaparecen y genera embeddings.
- Documentos: PDF, DOCX, TXT, MD o CSV de hasta 4 MB. Se convierten con `env.AI.toMarkdown` y quedan como borrador interno hasta su aprobación.
- Preguntas sin respuesta: se registran como candidatas de tipo «gap» cuando el modelo marca que le faltó información o cuando la relevancia recuperada es baja.

## Verificación realizada (30/10/2026)

- `node scripts/lint.mjs` y `node --test`: 47/47. Incluyen 17 pruebas nuevas del asistente con D1 real sobre SQLite (`node:sqlite`) y con KV y Workers AI simulados.
- Worker local (`wrangler dev`, D1 y KV locales, Workers AI real):
  - La pregunta de la hamburguesa recibe la respuesta predefinida, sin IA.
  - «¿Cuánto cobran por crear un sitio web?» se resuelve por equivalencia semántica (bge-m3), sin generar, y distingue landing, sitio corporativo y plataforma.
  - Gemma y GLM responden en 3-5 s.
  - Ante un intento de inyección de instrucciones, el asistente se niega.
  - Una pregunta que depende del historial se responde con su contexto.
  - El panel funciona y rechaza el acceso sin token (401).
  - El cron sincronizó 5 secciones de la landing.
- Navegador: chat en escritorio y móvil (375 px, sin desplazamiento horizontal) y en ambos temas. El botón del asistente queda apilado sobre «Hablemos» y el de WhatsApp se oculta mientras el panel está abierto. El preparador de WhatsApp (no se abrió ni se envió nada) y la demo integrada comparten conversación con el panel. Sin errores en la consola.
- Entorno de prueba desplegado: noindex y robots `Disallow`, respuesta predefinida fuera de tema, equivalencia semántica servida desde caché, respuesta de Gemma (8.8 s en la primera llamada, que incluye inicializar la semilla), panel admin 401 sin token y 200 con token, chat visible en el navegador bajo la CSP real sin errores.
- **No probado:** Groq real (falta la clave), captura real de prospectos e importación de PDF con `toMarkdown`.

## Configuración pendiente

1. ~~Entorno de prueba en Cloudflare~~: **hecho el 30/10/2026** (ver «Recursos creados»). Para redesplegar después de cambios: `node scripts/build-production.mjs` y `npx wrangler deploy --config wrangler.chat-test.jsonc`. Pasos originales, por referencia:
   ```sh
   npx wrangler d1 create ideasxinfin-chat-test
   npx wrangler kv namespace create ideasxinfin-chat-test
   ```
   Copiar los IDs en `wrangler.chat-test.jsonc` y después:
   ```sh
   npx wrangler d1 migrations apply ideasxinfin-chat-test --remote --config wrangler.chat-test.jsonc
   npx wrangler secret put ADMIN_TOKEN --config wrangler.chat-test.jsonc
   npx wrangler secret put RATE_LIMIT_SALT --config wrangler.chat-test.jsonc
   node scripts/build-production.mjs
   npx wrangler deploy --config wrangler.chat-test.jsonc
   ```
   Queda en `ideasxinfin-chat-test.<subdominio>.workers.dev`, con noindex y robots `Disallow`.
2. **Groq (opcional):** crear una clave en una cuenta gratuita y ejecutar `npx wrangler secret put GROQ_API_KEY --config …`. Confirmar en la consola de Groq los límites del plan gratuito.
3. **Datos comerciales:** cargar en el panel los precios, promociones y condiciones autorizados (tipo `price` o `promo`, con vigencia).
4. **Prospectos:** actualizar el aviso de privacidad y después poner `LEAD_CAPTURE_ENABLED=true`.
5. ~~Producción~~: **hecho el 30/10/2026** (ver «Recursos de producción»). Texto original: crear otra base D1 y otro KV (`ideasxinfin-chat`), y añadir a `wrangler.production.jsonc` los bloques `ai`, `d1_databases`, `kv_namespaces`, `vars` (`CHAT_ENABLED`, `CHAT_ENV=production`, `LEAD_CAPTURE_ENABLED`, `LEAD_RETENTION_DAYS`) y `triggers.crons`, igual que en la configuración de prueba pero con sus propios IDs. Añadir también los secretos, proteger el panel con Cloudflare Access y actualizar el aviso de privacidad. Hoy `wrangler.production.jsonc` no tiene esos bloques: aunque se desplegara, el chat respondería 404 y la landing seguiría igual.
6. Revisar en el panel si el plan de la cuenta es Free o Paid, y ajustar `neuronBudget` según lo que consuman otros proyectos de la misma cuenta.

## Desactivar sin afectar la landing

Cualquiera de estas opciones basta. En todas, `/api/chat/status` responde 404, el botón del asistente no aparece y la demo vuelve a ser local:

- Poner `CHAT_ENABLED` en `"false"` (o eliminarlo) y volver a desplegar.
- Quitar el binding `CHAT_DB`.
- Desactivar todos los modelos en el panel: el chat sigue respondiendo con FAQ y WhatsApp sin generar nada.

Retirada completa: quitar los bloques añadidos de la configuración, borrar los recursos D1/KV del entorno correspondiente y, si se desea, eliminar `public/chat.js` junto con su `import` en `public/app.js`. Las redirecciones, el dominio canónico, el sitemap y los metadatos no dependen del asistente.
