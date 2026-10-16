# Continuar Ideas Xinfin desde otra computadora

## Abrir el trabajo

Repositorio: https://github.com/ideasxinfin-glitch/ideasxinfin

Rama con toda la web: **feature/nueva-web-ideas-xinfin**

Archivos directos: https://github.com/ideasxinfin-glitch/ideasxinfin/tree/feature/nueva-web-ideas-xinfin

Revisión: https://github.com/ideasxinfin-glitch/ideasxinfin/pull/1

En Codex abre/clona el repositorio y selecciona esa rama. También puedes descargar Code → Download ZIP desde el enlace directo de la rama. No uses main para continuar la implementación actual.

## Arrancar y validar

Requisito: Node.js 24. Sin dependencias externas ni instalación de paquetes.

```sh
git clone --branch feature/nueva-web-ideas-xinfin https://github.com/ideasxinfin-glitch/ideasxinfin.git
cd ideasxinfin
node scripts/serve.mjs
```

Abre http://localhost:4173. Validaciones:

```sh
node scripts/lint.mjs
node --test
node scripts/build.mjs
```

## Contexto para continuar

Landing cinematográfica aprobada, responsive, tres pilares de servicio, portafolio ilustrativo identificado como conceptos, logos originales completos del infinito para ambos temas, selector fijo, animaciones con pausa y respeto de movimiento reducido, WhatsApp flotante y redes verificadas del sitio de origen. El formulario prepara una consulta segura para que el visitante la revise y envíe desde WhatsApp. Video de xinfinlab.com bajo demanda.

El código, fotografías optimizadas, logos, módulos, pruebas y documentación están en el repositorio. Las vistas HTML autónomas locales son auxiliares: el build reconstruye la web completa desde public/.

Publicación solicitada: vista de revisión en Cloudflare, todavía pendiente de acceso/autorización técnica a la cuenta. Ver CLOUDFLARE-PAGES.md. No afirmar que existe un enlace publicado hasta comprobar el despliegue. No modificar xinfinlab.com ni configurar ideasxinfin.com sin aprobación expresa.

Pendientes antes del lanzamiento comercial: datos legales del aviso, contenido final y proyectos reales aprobados si se sustituyen los conceptos, SEO de producción y analítica opcional. Mantener noindex durante revisión.
