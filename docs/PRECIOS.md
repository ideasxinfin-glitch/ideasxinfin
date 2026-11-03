# Precios de referencia: México (MXN) y Global (USD)

Reglas comerciales autorizadas por el usuario el 03/11/2026. Todavía no se publican en producción: hace falta su autorización explícita.

## Fuente única

`worker/chat/pricing.js` tiene el catálogo (`CATALOG`) y la política (`PRICING_POLICY`). La landing, mediante `GET /api/chat/pricing`, y el asistente IA leen de ahí. El HTML lleva los precios en MXN en `data-mxn`; una prueba verifica que coincidan con el catálogo.

| Servicio | `id` | Desde (MXN) | Cobro | Mínimo USD |
| --- | --- | --- | --- | --- |
| Landing page profesional | `landing` | $3,800 | Pago único | 220 |
| Landing page con inteligencia artificial | `landing_ai` | $6,500 | Por confirmar (no se muestra) | 350 |
| Gestión de redes sociales y Google Business | `social` | $3,500 | Mensual | — |

Los demás servicios (agentes de IA, automatizaciones, SEO, sitios amplios, plataformas) no tienen precio publicado. Se cotizan después de un diagnóstico y el asistente los atiende con el flujo normal de conocimiento.

## Conversión a dólares

`USD = máx( redondeo_hacia_arriba_a_5( MXN ÷ tipo_de_cambio × (1 + margen) ), mínimo_USD )`

- Siempre en múltiplos de `roundUsdTo` (5) y sin centavos.
- `usdMargin` por servicio (0 por ahora; 0.05 = +5 %) y `usdMinimum` por servicio (`null` = sin mínimo).
- Escenarios verificados en `tests/pricing.test.mjs`:

| Tipo de cambio | Landing | Redes | Landing con IA |
| --- | --- | --- | --- |
| 18.00 | 220 | 195 | 365 |
| 18.90 | 220 | 190 | 350 |

## Tipo de cambio

- **Proveedor:** Frankfurter, con el tipo de referencia del Banco Central Europeo (`https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN`). Es gratuito y no requiere clave ni facturación.
- **Almacenamiento:** se guarda en KV (`CHAT_CACHE`, clave `fx:USD-MXN`) con su fecha, y se vuelve a consultar cada 12 horas (`refreshHours`).
- **Fecha:** se muestra la fecha del tipo de cambio en la landing, en el asistente y en la referencia que se envía.
- **Validación:** se rechaza un valor fuera de 10–40 o sin fecha válida, y se trata como falla del proveedor.
- **Si el proveedor falla:** se conserva el último valor válido con su propia fecha y se reintenta en una hora. Si ese valor tiene más de 7 días, se marca `stale`. Nunca se inventa un tipo de cambio: si nunca hubo uno, la opción Global muestra MXN con un aviso y el asistente responde en pesos y lo dice.

## Selector México | Global

- Está en `public/pricing.js`, en la sección Servicios (`#precios`).
- La elección se guarda en `localStorage` (`ixf-market`) solo cuando el visitante hace clic.
- En la primera visita, la zona horaria del dispositivo solo sugiere el mercado: México si es una zona mexicana, Global en otro caso. No se usa geolocalización y siempre se puede cambiar.
- También cambia los precios de la FAQ y la referencia de cotización del formulario.

## Asistente IA

- Responde de forma determinística desde el catálogo. El modelo nunca genera ni recibe precios del catálogo.
- En modo USD, los precios en MXN de D1 se excluyen del contexto RAG.
- Identifica el servicio (también por el mensaje anterior del visitante) y responde con:
  - el precio «desde» en la moneda seleccionada;
  - la fecha del tipo de cambio si es en USD;
  - que el costo final depende del proyecto;
  - la oferta de seguir por WhatsApp.
- Las preguntas de promociones, y cualquier pregunta mientras exista una promoción activa en D1, siguen el flujo anterior.
- Las entradas de D1 de producción 25, 26, 7 y 10 no se modificaron. Ahora el catálogo responde antes que ellas para estos tres servicios, así que un cambio de precio se hace en `CATALOG`, no en el panel.

## Cotizaciones

- Los precios publicados son **orientativos**.
- «Solicitar cotización» y el asistente adjuntan al mensaje de WhatsApp (y, si la captura está activa, al prospecto) el servicio, la moneda, el precio mostrado y la fecha del tipo de cambio, marcados como orientativos.
- En el servidor, `quoteNote` valida esa referencia contra el catálogo.
- La cotización formal la emite una persona, con alcance, precio y vigencia definidos, y no cambia aunque cambie el tipo de cambio después.
- No hay pagos ni cotizaciones definitivas automáticas.

## Cómo cambiar un precio

1. Editar `CATALOG` en `worker/chat/pricing.js`: `mxn`, `usdMinimum`, `usdMargin` o `billing`.
2. Actualizar el `data-mxn` y el texto correspondiente en `public/index.html` (tarjetas y FAQ).
3. Ejecutar `npm test`. `tests/pricing.test.mjs` falla si el HTML y el catálogo no coinciden o si cambian los precios base autorizados (hay que actualizar esa prueba a propósito).
4. Construir, revisar en Preview y publicar solo con autorización.

Las descripciones de SEO, Open Graph y páginas por ciudad siguen en MXN a propósito.
