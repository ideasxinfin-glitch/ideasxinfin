import { SERVICES, CITIES, PRICES } from './seo-content.mjs';

// Service and city pages share the landing's header, tokens and footer; nothing from the previous site.
const ORIGIN = 'https://ideasxinfin.com';
const ORG = `${ORIGIN}/#organizacion`;
const PHONE = '529991850841';
const SPANISH_SPEAKING = ['México', 'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela', 'Estados Unidos'];

const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const wa = text => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
export const serviceRoute = service => `/servicios/${service.slug}/`;
export const cityRoute = city => `/mx/${city.slug}/`;
export const SEO_ROUTES = [...SERVICES.map(serviceRoute), ...CITIES.map(cityRoute)];

const offer = key => {
  const price = PRICES[key];
  if (!price) return undefined;
  const spec = { '@type': 'UnitPriceSpecification', price: price.amount, priceCurrency: 'MXN', valueAddedTaxIncluded: false };
  if (key === 'social') Object.assign(spec, { unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } });
  return { '@type': 'Offer', priceCurrency: 'MXN', price: price.amount, priceSpecification: spec, availability: 'https://schema.org/InStock' };
};
const faqSchema = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const breadcrumb = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: ORIGIN + path })) });

export function organizationSchema() {
  return {
    '@type': 'ProfessionalService', '@id': ORG, name: 'Ideas Xinfin', alternateName: 'Xinfin Lab', url: `${ORIGIN}/`,
    logo: `${ORIGIN}/assets/icon-192.png`, image: `${ORIGIN}/assets/service-platforms-landing.webp`, telephone: '+52 999 185 0841',
    description: 'Diseño de páginas web y landing pages, agentes de inteligencia artificial, automatización, gestión de redes sociales, Google Business y SEO.',
    priceRange: '$$', knowsLanguage: 'es',
    sameAs: ['https://www.facebook.com/xinfinlab/', 'https://www.instagram.com/xinfinlab/'],
    areaServed: SPANISH_SPEAKING.map(name => ({ '@type': 'Country', name })),
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Servicios', itemListElement: SERVICES.map(service => ({ '@type': 'Offer', ...(offer(service.price) || {}), itemOffered: { '@type': 'Service', name: service.short, url: ORIGIN + serviceRoute(service) } })) }
  };
}

export function homeSchema(faq) {
  return json({ '@context': 'https://schema.org', '@graph': [organizationSchema(), { '@type': 'WebSite', '@id': `${ORIGIN}/#sitio`, url: `${ORIGIN}/`, name: 'Ideas Xinfin', inLanguage: 'es', publisher: { '@id': ORG } }, faqSchema(faq)] });
}

const header = `<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="header is-scrolled">
<a class="brand" href="/" aria-label="Ideas Xinfin, inicio">
<span class="brand-logo">
<img class="logo-dark" src="/assets/logo-dark.webp" width="1200" height="896" alt="Ideas Xinfin">
<img class="logo-light" src="/assets/logo-light.webp" width="1200" height="896" alt="Ideas Xinfin">
</span>
</a>
<nav class="desktop-nav" aria-label="Navegación principal">
<a href="/">Inicio</a>
<a href="/#servicios">Servicios</a>
<a href="/#portafolio">Proyectos</a>
<a href="/#nosotros">Nosotros</a>
<a href="/#contacto">Contacto</a>
</nav>
<div class="header-actions">
<button class="theme-toggle" type="button" aria-label="Cambiar a tema claro" aria-pressed="false">
<span aria-hidden="true">☼</span>
<span class="theme-label">Claro</span>
</button>
<a class="button outline small header-contact" href="/#contacto">Solicitar diagnóstico <span aria-hidden="true">→</span></a>
<button class="menu-toggle" aria-controls="mobile-nav" aria-expanded="false" aria-label="Abrir menú"><span></span><span></span></button>
</div>
<nav id="mobile-nav" class="mobile-nav" aria-label="Navegación móvil" hidden>
<a href="/">Inicio</a>
<a href="/#servicios">Servicios</a>
<a href="/#portafolio">Proyectos</a>
<a href="/#nosotros">Nosotros</a>
<a href="/#contacto">Solicitar diagnóstico →</a>
</nav>
</header>`;

// Shared internal links: every page reaches every service and city, and the home page.
export function linksSection(current = '') {
  const item = (href, label) => `<li><a href="${href}"${href === current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
  return `<section class="section site-links" aria-labelledby="site-links-title">
<p class="eyebrow">Servicios y ciudades</p>
<h2 id="site-links-title">Trabajamos con negocios de todo México y Latinoamérica.</h2>
<div class="site-links-grid">
<div><h3>Servicios</h3><ul class="link-list">${SERVICES.map(s => item(serviceRoute(s), s.short)).join('')}</ul></div>
<div><h3>Atendemos en</h3><ul class="link-list">${CITIES.map(c => item(cityRoute(c), c.name)).join('')}</ul></div>
</div>
<p class="section-note">Trabajamos a distancia, por videollamada y WhatsApp, con negocios de cualquier país de habla hispana.</p>
</section>`;
}

const footer = `<footer class="footer section">
<a class="brand" href="/" aria-label="Ideas Xinfin, inicio">
<span class="brand-logo">
<img class="logo-dark" src="/assets/logo-dark.webp" width="1200" height="896" alt="Ideas Xinfin" loading="lazy">
<img class="logo-light" src="/assets/logo-light.webp" width="1200" height="896" alt="Ideas Xinfin" loading="lazy">
</span>
</a>
<nav aria-label="Navegación del pie">
<a href="/">Inicio</a>
<a href="/#servicios">Servicios</a>
<a href="/#portafolio">Proyectos</a>
<a href="/#contacto">Contacto</a>
</nav>
<div>
<strong>Ideas Xinfin</strong>
<span>Estrategia digital para grandes historias.</span>
<a href="/privacidad.html">Privacidad · © 2026</a>
</div>
</footer>
<a class="whatsapp-float" href="https://wa.me/${PHONE}" target="_blank" rel="noopener noreferrer" data-track="whatsapp" aria-label="Hablar por WhatsApp con Ideas Xinfin (abre en otra pestaña)">
<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.6a8.5 8.5 0 1 1 16.3-3.9Z"/><path d="M8.2 7.3c-.8.6-1 1.7-.4 2.9 1.1 2.6 2.6 4 5.2 5.1 1.2.5 2.3.2 2.9-.6l.4-1-2.3-1.2-.9 1c-1.7-.8-2.5-1.6-3.3-3.2l.8-.9-1.2-2.3Z"/></svg>
<span>Hablemos</span>
</a>`;

function document({ route, title, description, schema, body }) {
  const url = ORIGIN + route;
  return `<!doctype html>
<html lang="es" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#191c1e">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="es" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_MX">
<meta property="og:site_name" content="Ideas Xinfin">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/service-platforms-landing.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/styles.css">
<script src="/theme.js"></script>
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': schema })}</script>
</head>
<body class="seo-page">
${header}
<main id="contenido">
${body}
</main>
${footer}
<script type="module" src="/page.js"></script>
</body>
</html>
`;
}

const hero = ({ crumbs, eyebrow, h1, lead, priceKey, waText }) => `<section class="section page-hero" aria-labelledby="page-title">
<nav class="breadcrumbs" aria-label="Ruta de navegación"><ol>${crumbs.map(([name, path], i) => i === crumbs.length - 1 ? `<li aria-current="page">${esc(name)}</li>` : `<li><a href="${path}">${esc(name)}</a></li>`).join('')}</ol></nav>
<p class="eyebrow">${esc(eyebrow)}</p>
<h1 id="page-title">${esc(h1)}</h1>
<p class="page-lead">${esc(lead)}</p>
${priceKey ? `<p class="price-tag"><strong>${esc(PRICES[priceKey].label)}</strong><span>${esc(PRICES[priceKey].note)}</span></p>` : ''}
<div class="hero-actions">
<a class="button primary" href="${esc(wa(waText))}" target="_blank" rel="noopener noreferrer" data-track="whatsapp">Cotizar por WhatsApp <span aria-hidden="true">↗</span></a>
<a class="button outline" href="/#contacto">Solicitar diagnóstico <span aria-hidden="true">→</span></a>
</div>
</section>`;

const block = ({ h2, p = [], list = [] }) => `<article class="page-block"><h2>${esc(h2)}</h2>${p.map(text => `<p>${esc(text)}</p>`).join('')}${list.length ? `<ul>${list.map(text => `<li>${esc(text)}</li>`).join('')}</ul>` : ''}</article>`;

const faqSection = (faq, heading) => `<section class="section faq" aria-labelledby="faq-title">
<div class="faq-layout">
<div class="faq-intro"><p class="eyebrow">Preguntas frecuentes</p><h2 id="faq-title">${esc(heading)}</h2></div>
<div class="faq-list">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</div>
</section>`;

const cta = text => `<section class="section page-cta" aria-labelledby="cta-title">
<h2 id="cta-title">¿Hablamos de tu proyecto?</h2>
<p>Cuéntanos qué ofreces y qué quieres lograr. Te respondemos por WhatsApp con los siguientes pasos.</p>
<a class="button primary" href="${esc(wa(text))}" target="_blank" rel="noopener noreferrer" data-track="whatsapp">Escribir por WhatsApp <span aria-hidden="true">↗</span></a>
</section>`;

function servicePage(service) {
  const route = serviceRoute(service);
  const crumbs = [['Inicio', '/'], ['Servicios', '/#servicios'], [service.short, route]];
  const waText = `Hola, me interesa el servicio de ${service.short.toLowerCase()}.`;
  const schema = [breadcrumb(crumbs.map(([n, p]) => [n, p === '/#servicios' ? '/' : p])),
    { '@type': 'Service', '@id': `${ORIGIN}${route}#servicio`, name: service.short, serviceType: service.short, description: service.description, url: ORIGIN + route, provider: { '@id': ORG }, areaServed: SPANISH_SPEAKING.map(name => ({ '@type': 'Country', name })), ...(offer(service.price) ? { offers: offer(service.price) } : {}) },
    faqSchema(service.faq)];
  const body = [hero({ crumbs, eyebrow: service.eyebrow, h1: service.h1, lead: service.lead, priceKey: service.price, waText }),
    `<section class="section page-content" aria-label="Detalle del servicio"><div class="page-grid">${service.blocks.map(block).join('')}</div></section>`,
    faqSection(service.faq, 'Lo que más nos preguntan.'), cta(waText), linksSection(route)].join('\n');
  return { route, html: document({ route, title: service.title, description: service.description, schema, body }) };
}

function cityPage(city) {
  const route = cityRoute(city);
  const crumbs = [['Inicio', '/'], [city.name, route]];
  const waText = `Hola, tengo un negocio en ${city.name} y me interesa conocer sus servicios.`;
  const offers = SERVICES.map(service => block({ h2: service.short, p: [service.lead], list: [] }).replace('</article>', `${service.price ? `<p class="block-price">${esc(PRICES[service.price].label)}</p>` : ''}<a class="block-link" href="${serviceRoute(service)}">Ver ${esc(service.short.toLowerCase())} <span aria-hidden="true">→</span></a></article>`));
  const schema = [breadcrumb(crumbs),
    { '@type': 'Service', '@id': `${ORIGIN}${route}#servicio`, name: `Diseño web y marketing digital en ${city.name}`, serviceType: 'Diseño web, marketing digital e inteligencia artificial', description: city.description, url: ORIGIN + route, provider: { '@id': ORG }, areaServed: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: city.region, containedInPlace: { '@type': 'Country', name: 'México' } } }, offers: [offer('landing'), offer('social')] },
    faqSchema(city.faq)];
  const body = [hero({ crumbs, eyebrow: `${city.name}, ${city.region}`, h1: city.h1, lead: city.lead, priceKey: null, waText }),
    `<section class="section page-content" aria-label="Negocios en ${esc(city.name)}"><div class="page-grid">${block(city.context)}${block({ h2: 'Cómo trabajamos contigo', p: [city.angle, `Trabajamos a distancia con negocios de ${city.name}: diagnóstico por videollamada, propuesta con alcance, tiempos y precio por escrito, y revisiones contigo hasta publicar.`] })}</div></section>`,
    `<section class="section page-content page-services" aria-labelledby="city-services-title"><p class="eyebrow">Servicios en ${esc(city.name)}</p><h2 id="city-services-title">Lo que podemos hacer por tu negocio en ${esc(city.name)}.</h2><div class="page-grid">${offers.join('')}</div></section>`,
    faqSection(city.faq, `Preguntas desde ${city.name}.`), cta(waText), linksSection(route)].join('\n');
  return { route, html: document({ route, title: city.title, description: city.description, schema, body }) };
}

export const renderPages = () => [...SERVICES.map(servicePage), ...CITIES.map(cityPage)];
