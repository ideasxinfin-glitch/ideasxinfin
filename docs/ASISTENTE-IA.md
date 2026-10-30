# Asistente comercial IA: arquitectura, políticas y activación

Actualizado: 30/10/2026. Estado: **activo en producción en https://ideasxinfin.com** (despliegue autorizado por el usuario el 30/10/2026). Panel administrativo de producción **cerrado** hasta configurar Cloudflare Access.

## Recursos de producción

| Recurso | Nombre | ID |
| --- | --- | --- |
| Worker | `ideasxinfin-production` (mismas rutas de siempre) | versión `8d772a1b-0155-4bd5-9249-b67c655e1ef9`; versión anterior sin asistente: `693de030-64c0-42f3-a5a1-512d73ffc288` |
| D1 | `ideasxinfin-chat` (migración aplicada) | `207758dc-bb52-4480-9d86-c3d4c1c3c28a` |
| KV | `ideasxinfin-chat` | `7059cc47e58a487eacc64741b84a0c75` |
| Cron | `23 9 * * *` | — |
| Secretos | `RATE_LIMIT_SALT` cargado. `ADMIN_TOKEN` generado en `.dev.vars.production` (ignorado por Git) pero **no cargado** | — |

Activo en producción: chat flotante, demo conectada, Gemma 4 → GLM 4.7, caché exacta y semántica, RAG, filtro de relevancia, límites por visitante y presupuesto de neuronas, sincronización diaria de la landing y aviso de privacidad actualizado. Desactivado: Groq (sin `GROQ_API_KEY`), captura de prospectos (`LEAD_CAPTURE_ENABLED=false`) y panel administrativo (sin Access).

### Activar el panel de producción con Cloudflare Access

El código exige, en `CHAT_ENV=production`, un JWT válido de Access (firma RS256, audiencia, emisor y vigencia comprobados en el Worker) **además** del token. Sin `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD`, `/admin/chat/` y `/api/admin/*` responden 404.

1. En el panel de Cloudflare: Zero Trust → elegir el plan Free (hasta 50 usuarios). **Si pide método de pago, detenerse y decidir.**
2. Access → Applications → Self-hosted: dominio `ideasxinfin.com`, rutas `/admin/chat*` y `/api/admin/*`. Política Allow solo para los correos del equipo (por ejemplo, código por correo).
3. Copiar el *Application Audience (AUD) tag* y el dominio del equipo (`<equipo>.cloudflareaccess.com`). Añadirlos a `vars` de `wrangler.production.jsonc` como `ACCESS_AUD` y `ACCESS_TEAM_DOMAIN`.
4. Cargar el token: `npx wrangler secret put ADMIN_TOKEN --config wrangler.production.jsonc` (valor de `.dev.vars.production`), construir y desplegar.

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

**Autenticación administrativa.** Usa el secreto `ADMIN_TOKEN` (mínimo 32 caracteres; sin él, el panel responde 404), con comparación de tiempo constante y un límite de 30 intentos por hora. Las respuestas llevan noindex y no-store. El token se guarda en `sessionStorage` y se borra al cerrar la pestaña. **Recomendado para producción:** proteger además `/admin/chat*` y `/api/admin/*` con Cloudflare Access (gratuito hasta 50 usuarios).

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
