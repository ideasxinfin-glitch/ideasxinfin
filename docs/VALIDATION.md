# Validación de primera versión

15 de octubre de 2026. Validación sobre el build local, en Chrome headless. No equivale a una auditoría completa de WCAG ni a una prueba en dispositivos físicos.

## Comprobado

- `node scripts/lint.mjs`: correcto; sintaxis JS, operaciones DOM, ausencia de código inline ejecutable, anclas e IDs.
- `node --test tests/*.test.mjs`: 4 pruebas correctas; enlace al WhatsApp publicado, codificación, controles/consentimiento/límites y rechazo de campos inválidos.
- `node scripts/build.mjs`: correcto; salida estática y CSP con hash del JSON-LD.
- Chrome a 1440 px en oscuro y claro, 390 px en oscuro y claro, y 320 px en oscuro: sin desbordamiento horizontal ni imágenes rotas.
- Cambio y persistencia de tema, apertura/cierre de menú, selección de demo y respuesta, cierre de dialog, rechazo de formulario vacío y aceptación de consulta válida.
- Envío de prueba interceptado antes de contactar WhatsApp: destino `/529991850841`, mensaje preparado y acentos correctos. No se envió una consulta real a un tercero.
- Video no creado ni solicitado hasta pulsar reproducir. Recurso original disponible sin error de reproducción observado en la comprobación (la disponibilidad futura depende del sitio de origen).
- Sin excepciones de ejecución observadas.
- Rutas `/`, `/privacidad.html`, `/app.js`, `/assets/mark.svg` y `/robots.txt`: HTTP 200. Ruta inexistente y acceso a `package.json`: HTTP 404.

## Entrega y límites

- Cuenta GitHub usada en todas las escrituras: `ideasxinfin-glitch`.
- `main` solo inicializa README; implementación en `feature/nueva-web-ideas-xinfin`.
- Capturas desktop/móvil, claro/oscuro y reporte JSON se entregan como archivos aparte.
- Se registró una instancia privada de Sites; no existe despliegue alojado exitoso. La revisión automática rechazó el canal de entrada para transferir la credencial al empaquetador; el intento por otro entorno terminó en fallo de conexión del cliente Git (`getaddrinfo() thread failed to start`). No hay una URL live verificada. El manifiesto conserva el ID para retomar esa misma instancia, sin crear duplicados.
- La revisión local se ejecuta con los pasos del README. No se ha publicado en ideasxinfin.com ni modificado xinfinlab.com.
- Logo provisional reconstruido desde la descripción escrita; referencias adjuntas de la conversación anterior no accesibles en esta sesión.
- Faltan archivos de marca definitivos, casos reales aprobados, datos legales de privacidad y elección del hosting definitivo. Si se desea recepción por servidor/correo, falta configurar ese canal; el formulario de esta versión funciona mediante WhatsApp.
- Analítica preparada y desconectada; no se midieron Lighthouse/Core Web Vitals ni se completó una auditoría con lector de pantalla. No se atribuyen puntuaciones de rendimiento o accesibilidad.

## Segunda versión: correspondencia con las referencias

La composición se reconstruyó con las dos referencias ya adjuntas: escenario arquitectónico/alpino, naranja, titulares serif, dispositivos HTML/CSS, fotografías y secciones compactas. Recursos generados y optimizados: ver VISUAL-REVISION.md.

Build, lint y las cuatro pruebas de contacto pasan. Preview autónomo verificado en Chrome a 1440 px (claro y oscuro), 390 px (claro y oscuro) y 320 px (oscuro), sin desbordamientos ni imágenes rotas. Menú, tema persistente, demos, formulario y salida a WhatsApp interceptada pasan. Video bajo demanda sin error observado. Evidencia: validation-browser-v2.json.
También se verificaron anchos de 768 y 1024 px, y las respuestas de la demostración del asistente. Las comprobaciones pasaron sin desbordamiento horizontal.
