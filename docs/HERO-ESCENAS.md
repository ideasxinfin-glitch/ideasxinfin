# Escenas rotativas del hero

Actualizado: 02/11/2026. **Implementado en la rama, sin publicar.** Las imágenes actuales de `public/assets/hero/` son **provisionales** (fotos que ya tenía el sitio, y un degradado en colegios). Antes de publicar hay que sustituirlas por las escenas finales.

## Cómo funciona

- Tres escenas: `ia`, `inmobiliaria` y `colegios`. El atributo `data-scene` de `.hero` indica la escena activa.
- Cada escena tiene tres capas que cambian a la vez con un fundido de 1.4 s:
  - fondo: `.hero-scene[data-scene=…]` dentro de `.environment`;
  - laptop: `.screen-scene[data-scene=…]` dentro de `.laptop-screen`;
  - móvil: `.screen-scene[data-scene=…]` dentro de `.phone-device`.
- Los textos del hero, los botones, la navegación y el contenido de las pantallas (titulares, iconos y botones simulados) son HTML/CSS. Las imágenes no llevan texto.
- `public/motion.js` (`syncScenes`, `SCENE_INTERVAL = 7500`) avanza cada 7.5 s.
  - Solo rota mientras el hero está a la vista y la pestaña está visible.
  - Con `prefers-reduced-motion` se queda fija la primera escena.
  - Sin JavaScript se ve la primera escena.
- Carga: al inicio solo se descargan las imágenes de `ia`. Las otras dos se descargan cuando termina de cargar la página (clase `.scenes-ready`).
- La pantalla del laptop y la del móvil usan la misma imagen `*-pantalla.webp`, con distinto recorte. En inmobiliaria, las cuatro miniaturas son recortes de esa misma imagen.
- Las ondas del lago (versión `c9088d51`) se quitaron porque esa foto ya no aparece. Se pueden recuperar del commit `becea90` si alguna escena vuelve a tener agua.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `public/index.html` | Capas `.hero-scene`, pantallas `.screen-scene` y el sprite de iconos `.hero-defs` |
| `public/styles.css` | Bloque final «Hero scenes»: rutas de las imágenes por escena (`--scene-image`, `--screen-image`), fundido y estilos de las pantallas |
| `public/motion.js` | Rotación (`syncScenes`) |
| `public/assets/hero/` | `ia-fondo.webp`, `ia-pantalla.webp`, `inmobiliaria-fondo.webp`, `inmobiliaria-pantalla.webp`, `colegios-fondo.webp`, `colegios-pantalla.webp` |

## Medidas de las imágenes finales

| Imagen | Medida | Peso objetivo (WebP) | Composición |
|---|---|---|---|
| `*-fondo.webp` | **2560 × 1440** (16:9), mínimo 1920 × 1080 | 250–400 KB | Lado izquierdo oscuro y tranquilo, porque ahí va el título. Lo llamativo va al centro-derecha, detrás de los dispositivos. Sin texto ni logos. En móvil se recorta alrededor del 62 % horizontal. |
| `*-pantalla.webp` | **1600 × 900** (16:9) | 100–200 KB | Protagonista a la derecha (robot o IA, casa, estudiantes), porque a la izquierda va el titular de la pantalla. En el móvil se ve un recorte vertical alrededor del 65 % horizontal. Sin texto ni interfaz. |

Referencia visual de cada escena:

- **IA:** oficina nocturna con tonos azul y violeta, plantas y luces cálidas, letrero de neón «AI» opcional (es texto: mejor solo el brillo).
  - Pantalla: un busto de IA o robot con ondas de luz.
- **Inmobiliaria:** casa de lujo al atardecer, con terraza, alberca infinita y mar.
  - Pantalla: fachada de casa iluminada con alberca.
- **Colegios:** campus escolar de día, con libros, birrete y lápices en primer plano.
  - Pantalla: estudiantes sonrientes con uniforme.

## Cómo reemplazar una escena

1. Exporta la imagen con la medida indicada y guárdala con **el mismo nombre** en `public/assets/hero/`. Si es JPG o PNG, conviértela a WebP con calidad aproximada de 82.
2. `node scripts/build-production.mjs`, `npm test` y `npm run lint`.
3. Revisa en local los dos temas, escritorio y móvil.
4. Publica solo con autorización.

Otros cambios:

- **Textos de las pantallas:** edita el bloque `.screen-scene[data-scene=…]` correspondiente en `public/index.html`.
- **Agregar una cuarta escena:** añade una capa `.hero-scene` y una `.screen-scene` para el laptop y otra para el móvil con el nuevo `data-scene`, y una línea `[data-scene=nuevo]{--scene-image:…;--screen-image:…}` en `styles.css`. La rotación la detecta sola.
- **Cambiar la velocidad:** modifica `SCENE_INTERVAL` en `public/motion.js` y la duración del fundido (`1.4s`) en `styles.css`.
