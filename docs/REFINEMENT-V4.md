# Logos originales, temas visibles y animación

15 de octubre de 2026. El usuario confirma usar ambos logos completos del infinito, sustituyendo la anterior elección de X naranja en tema claro.

## Identidad y temas

Se reutilizan los archivos originales encontrados junto a las referencias en Descargas: Design_Ideas_Xinfin_logo_options_20261015114741.jpg y Generate_light_version_logo_20261015114751.jpg. Conservan su arte, textos y colores; únicamente se convierten a WebP de calidad 90. El contenedor CSS oculta los márgenes vacíos de las imágenes. No son los SVG simplificados de la versión anterior.

Los logos completos se muestran en cabecera, pie, asistente y privacidad. El selector tiene texto Claro/Oscuro y permanece en la cabecera fija durante el recorrido. La primera visita usa tema oscuro; las siguientes respetan la elección guardada. El parámetro ?tema=dark o ?tema=light permite abrir una vista explícita.

## Movimiento

- Entrada escalonada de titulares, descripción, botones y dispositivos.
- Flotación suave de portátil y teléfono, luz ambiental y profundidad del fondo del hero.
- Aparición de secciones y tarjetas al entrar en pantalla; contenido siempre disponible si JavaScript falla.
- Perspectiva y reflejo que siguen al puntero en tarjetas, solo con ratón y movimiento habilitado.
- Destellos en botones, flechas, iconos, proceso y redes.
- Indicador de progreso de lectura en cabecera.
- Control de pausa persistente y respeto de prefers-reduced-motion. Animaciones decorativas suspendidas en pestañas ocultas.
- WhatsApp se oculta cuando el formulario está visible para no obstruirlo.

Sin bibliotecas ni peticiones externas adicionales. Scroll/puntero usan requestAnimationFrame solo cuando hay interacción; apariciones se observan una vez y se desconectan.

## Validación

Build, lint y cuatro pruebas de contacto aprobados. Siete combinaciones de viewport/tema sin desbordamientos, imágenes rotas ni errores de ejecución. Revisión visual de capturas oscuras/claras. Ver validation-browser-v4.json.

Prueba adicional con movimiento real: inicio oscuro, cuatro animaciones decorativas activas, cabecera fija, apariciones, perspectiva al mover ratón, pausa y persistencia al recargar, preferencia de movimiento reducido y formulario sin obstrucción. Ver validation-motion-v4.json.

Se generaron vistas autónomas separadas oscura y clara para revisión local. No se publicó en dominios comerciales.
