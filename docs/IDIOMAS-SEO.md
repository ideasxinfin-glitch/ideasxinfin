# Idiomas y SEO internacional

Versión en inglés de ideasxinfin.com. El español sigue siendo la versión principal y `x-default`.

## Rutas

| Inglés | Español |
| --- | --- |
| `/en/` | `/` |
| `/en/services/website-landing-page-design/` | `/servicios/landing-pages/` |
| `/en/services/ai-agents-automation/` | `/servicios/inteligencia-artificial/` |
| `/en/services/digital-marketing/` | `/servicios/redes-sociales-google-business/` |
| `/en/services/seo/` | `/servicios/seo/` |
| `/en/privacy.html` (noindex) | `/privacidad.html` (noindex) |

Las páginas de ciudad no se traducen: atienden búsquedas locales de México. Su selector `EN` lleva a `/en/` y no declaran `hreflang="en"`.

## De dónde sale cada cosa

- `scripts/en-home.mjs`: genera `/en/` a partir de `public/index.html` con una tabla de traducciones. Si una entrada deja de coincidir, **el build falla**: al cambiar un texto de la portada hay que actualizar su traducción.
- `scripts/seo-content-en.mjs`: contenido de las páginas de servicio en inglés.
- `scripts/seo-pages.mjs`: páginas de ambos idiomas, `hreflang`, datos estructurados y selector de idioma.
- `public/i18n.js`: textos del navegador (diálogos, formulario, precios, asistente). La clave es el texto en español; `tests/i18n.test.mjs` falla si un `t('…')` no tiene versión en inglés.
- `worker/chat/knowledge-en.js`: respuestas aprobadas del asistente en inglés.

`/en/` solo existe después de un build: se revisa con `node scripts/build-production.mjs` y wrangler dev, no con `scripts/serve.mjs`.

## Reglas

- El idioma lo decide la URL (`<html lang>`). Quien eligió inglés con el selector vuelve a `/en/` al entrar a una página en español que tenga versión inglesa; lo guarda `localStorage` (`ixf-lang`). Sin elección guardada, cada URL sirve su idioma, así que Google recibe siempre el contenido de esa URL.
- Moneda e idioma son independientes. Una moneda guardada (`ixf-market`) vale en ambos idiomas. Sin elección: inglés empieza en USD; español en MXN, salvo que la zona horaria del dispositivo sea de otro país.
- Los valores de los formularios se quedan en español porque son los que valida la API; solo cambia la etiqueta visible.

## Asistente

- Responde en el idioma del mensaje; si no se distingue, en el de la página (`detectLanguage` en `worker/chat/text.js`).
- Precios: mismo catálogo y misma política, nunca del modelo.
- La caché exacta y las FAQ del panel están en español y solo sirven al camino en español, que no cambió. En inglés se usan `knowledge-en.js` y después el modelo, con el conocimiento en español y la instrucción de traducirlo sin añadir datos.
- **Mantenimiento:** una FAQ editada en el panel no cambia `knowledge-en.js`. Si cambia una política, actualizar ambos.
- Las respuestas en inglés del modelo no se guardan como candidatas a FAQ, porque aprobadas se servirían también en español.

## Redirecciones

Solo cambió una: `xinfinlab.com/en/` y `www.xinfinlab.com/en/` ahora van a `https://ideasxinfin.com/en/` en lugar de a la portada, porque `/en/` ya es una página publicada (mismo mecanismo que las ciudades). `/en/us/*` y `/en/ca/*` siguen yendo a `/`.

## Search Console, tras publicar

1. Reenviar `https://ideasxinfin.com/sitemap.xml`.
2. Inspeccionar y solicitar indexación de las cinco URLs inglesas.
3. Revisar en unas semanas el informe de páginas y que Google elija como canónica la propia URL de cada idioma.

No hace falta cambio de dirección ni una propiedad nueva: `/en/` está dentro de la propiedad del dominio. Search Console ya no tiene informe de orientación internacional; los errores de `hreflang` se detectan con la inspección de URL o con un rastreador.
