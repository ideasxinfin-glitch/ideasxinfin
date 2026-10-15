# Revisión visual — referencias adjuntas del 15 de octubre de 2026

La primera versión no reproducía la dirección visual de las referencias. La segunda reconstruye su composición con elementos HTML/CSS y conserva la interacción real.

## Referencias recibidas

- `Imagen de ChatGPT 15 oct 2026, 13_03_06.png`: versión oscura.
- `Landing premium de Ideas Xinfin.png`: versión clara.

## Cambios

- Hero fotográfico de montañas, lago y arquitectura con luz cálida. Escenas independientes para día y noche.
- Titulares serif y paleta negra/marfil con acentos naranja.
- Portátil y teléfono construidos con HTML/CSS. Los textos de sus pantallas son elementos HTML, identificados como concepto.
- Servicios con fotografías, proyectos conceptuales, sección de asistentes con demostración interactiva, proceso y llamada a la acción con fondo ambiental.
- Símbolo X vectorial reconstruido a partir de la referencia más reciente. El infinito de la primera versión se conserva en `public/assets/infinity-mark-v1.svg`.
- Se mantienen validación del formulario, privacidad, cambio de tema, navegación y demos.
- No se incorporan las cifras, testimonios, avatares de clientes ni resultados no verificados de los mockups.

## Recursos generados

Herramienta: generación de imágenes integrada, sin API ni credenciales externas. Recursos originales generados a partir de la dirección visual; no se usan los mockups completos como imágenes de la web. Se optimizan a WebP (calidad 84) sin modificar el contenido de las escenas.

- `public/assets/scene-light.webp`: fotografía panorámica de lago alpino y casa de cristal a la derecha, luz de atardecer, izquierda tranquila para texto HTML, sin dispositivos, sin texto ni interfaz.
- `public/assets/scene-dark.webp`: misma dirección arquitectónica en noche cinematográfica, montañas y reflejos, interiores ámbar, izquierda oscura para texto HTML, sin dispositivos ni interfaz.
- `public/assets/editorial-atlas.webp`: atlas 2×2 de fotografías: portátil en estudio, retrato conceptual de asistente de IA, coche deportivo sin marca, visual de marketing y redes. Cada cuadrante se encuadra por CSS; no contiene cifras de resultados.

Los recursos son ilustrativos. AURUM es un concepto de interfaz, no un cliente ni una propiedad real.

## Preview portátil

`node scripts/standalone.mjs <ruta-de-salida.html>` genera una página descargable con CSS, JavaScript e imágenes incorporadas. Funciona sin servidor. También genera `privacidad.html` junto a ella. El video original continúa siendo remoto y se solicita solo después de la acción del visitante.
