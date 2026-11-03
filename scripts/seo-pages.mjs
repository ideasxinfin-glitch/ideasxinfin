import { SERVICES, CITIES, PRICES } from './seo-content.mjs';
import { SERVICES_EN, PRICES_EN } from './seo-content-en.mjs';

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
export const enServiceRoute = service => `/en/services/${service.slug}/`;
// English pages exist only where there is real translated content: the home page and the services, not the Mexican cities.
export const EN_ROUTES = ['/en/', ...SERVICES_EN.map(enServiceRoute)];
const enFor = slug => SERVICES_EN.find(service => service.es === slug);

// Each version is canonical to itself. Spanish stays the default for visitors matching neither language.
export const hreflang = (es, en) => [['es', es], ['es-MX', es], ...(en ? [['en', en]] : []), ['x-default', es]]
  .map(([code, path]) => `<link rel="alternate" hreflang="${code}" href="${ORIGIN}${path}">`).join('');

const UI = {
  es: { skip: 'Saltar al contenido', homeLabel: 'Ideas Xinfin, inicio', mainNav: 'Navegación principal', mobileNav: 'Navegación móvil', footNav: 'Navegación del pie', languageNav: 'Idioma', home: 'Inicio', services: 'Servicios', projects: 'Proyectos', about: 'Nosotros', contact: 'Contacto', theme: 'Cambiar a tema claro', themeLabel: 'Claro', cta: 'Solicitar diagnóstico', menu: 'Abrir menú', root: '/', anchors: { services: 'servicios', projects: 'portafolio', about: 'nosotros', contact: 'contacto' }, privacy: '/privacidad.html', privacyLabel: 'Privacidad', tagline: 'Estrategia digital para grandes historias.', talk: 'Hablemos', waLabel: 'Hablar por WhatsApp con Ideas Xinfin (abre en otra pestaña)', crumbs: 'Ruta de navegación', quoteWa: 'Cotizar por WhatsApp', faqEyebrow: 'Preguntas frecuentes', ctaTitle: '¿Hablamos de tu proyecto?', ctaText: 'Cuéntanos qué ofreces y qué quieres lograr. Te respondemos por WhatsApp con los siguientes pasos.', ctaButton: 'Escribir por WhatsApp', detail: 'Detalle del servicio', faqHeading: 'Lo que más nos preguntan.', currency: 'Moneda de los precios', mexico: 'México', note: 'Precios en pesos mexicanos (MXN).', locale: 'es_MX', altLocale: 'en_US' },
  en: { skip: 'Skip to content', homeLabel: 'Ideas Xinfin, home', mainNav: 'Main navigation', mobileNav: 'Mobile navigation', footNav: 'Footer navigation', languageNav: 'Language', home: 'Home', services: 'Services', projects: 'Projects', about: 'About', contact: 'Contact', theme: 'Switch to light theme', themeLabel: 'Light', cta: 'Request a consultation', menu: 'Open menu', root: '/en/', anchors: { services: 'services', projects: 'projects', about: 'about', contact: 'contact' }, privacy: '/en/privacy.html', privacyLabel: 'Privacy', tagline: 'Digital strategy for great stories.', talk: 'Let’s talk', waLabel: 'Chat with Ideas Xinfin on WhatsApp (opens in a new tab)', crumbs: 'Breadcrumb', quoteWa: 'Get a quote on WhatsApp', faqEyebrow: 'Frequently asked questions', ctaTitle: 'Shall we talk about your project?', ctaText: 'Tell us what you offer and what you want to achieve. We will reply on WhatsApp with the next steps.', ctaButton: 'Message us on WhatsApp', detail: 'Service details', faqHeading: 'What people ask us most.', currency: 'Price currency', mexico: 'Mexico', note: 'Prices in Mexican pesos (MXN).', locale: 'en_US', altLocale: 'es_MX' }
};

// Visible MXN amounts become live: public/pricing.js shows them in the currency the visitor chose.
const AMOUNTS = { '$3,800 MXN': ['landing', 3800], '$6,500 MXN': ['landing_ai', 6500], '$3,500 MXN': ['social', 3500] };
const priced = html => html.replace(/\$(?:3,800|6,500|3,500) MXN/g, amount => `<span data-price="${AMOUNTS[amount][0]}" data-mxn="${AMOUNTS[amount][1]}">${amount}</span>`);
const marketSwitch = ui => `<div class="page-market"><div class="market-switch" role="group" aria-label="${ui.currency}">
<button type="button" data-market="mx" aria-pressed="true"><svg class="flag-mx" viewBox="0 0 24 16" aria-hidden="true"><rect width="8" height="16" fill="#006847"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#ce1126"/><circle cx="12" cy="8" r="2.2" fill="#8c6d3f"/></svg>${ui.mexico} <small>MXN</small></button>
<button type="button" data-market="global" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z"/></svg>Global <small>USD</small></button>
</div><small data-pricing-note>${ui.note}</small></div>`;
const languageSwitch = (ui, lang, es, en) => `<nav class="lang-switch" aria-label="${ui.languageNav}"><a href="${es}" lang="es" hreflang="es" data-lang="es"${lang === 'es' ? ' aria-current="true"' : ''}>ES</a><span aria-hidden="true">|</span><a href="${en}" lang="en" hreflang="en" data-lang="en"${lang === 'en' ? ' aria-current="true"' : ''}>EN</a></nav>`;

const offer = key => {
  const price = PRICES[key];
  if (!price) return undefined;
  const spec = { '@type': 'UnitPriceSpecification', price: price.amount, priceCurrency: 'MXN', valueAddedTaxIncluded: false };
  if (key === 'social') Object.assign(spec, { unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } });
  return { '@type': 'Offer', priceCurrency: 'MXN', price: price.amount, priceSpecification: spec, availability: 'https://schema.org/InStock' };
};
const faqSchema = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const breadcrumb = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: ORIGIN + path })) });

const AREA_EN = { '@type': 'Place', name: 'Worldwide' };
export function organizationSchema(lang = 'es') {
  const en = lang === 'en';
  return {
    '@type': 'ProfessionalService', '@id': ORG, name: 'Ideas Xinfin', alternateName: 'Xinfin Lab', url: `${ORIGIN}/`,
    logo: `${ORIGIN}/assets/icon-192.png`, image: `${ORIGIN}/assets/service-platforms-landing.webp`, telephone: '+52 999 185 0841',
    description: en ? 'Professional website design, custom landing pages, AI agents for businesses, process automation, digital marketing and SEO services.' : 'Diseño de páginas web y landing pages, agentes de inteligencia artificial, automatización, gestión de redes sociales, Google Business y SEO.',
    priceRange: '$$', knowsLanguage: en ? ['en', 'es'] : ['es', 'en'],
    sameAs: ['https://www.facebook.com/xinfinlab/', 'https://www.instagram.com/xinfinlab/'],
    areaServed: en ? AREA_EN : SPANISH_SPEAKING.map(name => ({ '@type': 'Country', name })),
    hasOfferCatalog: { '@type': 'OfferCatalog', name: en ? 'Services' : 'Servicios', itemListElement: (en ? SERVICES_EN : SERVICES).map(service => ({ '@type': 'Offer', ...(offer(service.price) || {}), itemOffered: { '@type': 'Service', name: service.short, url: ORIGIN + (en ? enServiceRoute : serviceRoute)(service) } })) }
  };
}

export function homeSchema(faq, lang = 'es') {
  const site = lang === 'en' ? { '@id': `${ORIGIN}/en/#website`, url: `${ORIGIN}/en/`, inLanguage: 'en' } : { '@id': `${ORIGIN}/#sitio`, url: `${ORIGIN}/`, inLanguage: 'es' };
  return json({ '@context': 'https://schema.org', '@graph': [organizationSchema(lang), { '@type': 'WebSite', ...site, name: 'Ideas Xinfin', publisher: { '@id': ORG } }, faqSchema(faq)] });
}

const header = (lang, es, en) => {
  const ui = UI[lang], root = ui.root, a = ui.anchors;
  return `<a class="skip" href="#${lang === 'en' ? 'content' : 'contenido'}">${ui.skip}</a>
<header class="header is-scrolled">
<a class="brand" href="${root}" aria-label="${ui.homeLabel}">
<span class="brand-logo">
<img class="logo-dark" src="/assets/logo-wordmark-dark.webp" width="720" height="192" alt="Ideas Xinfin">
<img class="logo-light" src="/assets/logo-wordmark-light.webp" width="720" height="192" alt="Ideas Xinfin">
</span>
</a>
<nav class="desktop-nav" aria-label="${ui.mainNav}">
<a href="${root}">${ui.home}</a>
<a href="${root}#${a.services}">${ui.services}</a>
<a href="${root}#${a.projects}">${ui.projects}</a>
<a href="${root}#${a.about}">${ui.about}</a>
<a href="${root}#${a.contact}">${ui.contact}</a>
</nav>
<div class="header-actions">
${languageSwitch(ui, lang, es, en)}
<button class="theme-toggle" type="button" aria-label="${ui.theme}" aria-pressed="false">
<span aria-hidden="true">☼</span>
<span class="theme-label">${ui.themeLabel}</span>
</button>
<a class="button outline small header-contact" href="${root}#${a.contact}">${ui.cta} <span aria-hidden="true">→</span></a>
<button class="menu-toggle" aria-controls="mobile-nav" aria-expanded="false" aria-label="${ui.menu}"><span></span><span></span></button>
</div>
<nav id="mobile-nav" class="mobile-nav" aria-label="${ui.mobileNav}" hidden>
<a href="${root}">${ui.home}</a>
<a href="${root}#${a.services}">${ui.services}</a>
<a href="${root}#${a.projects}">${ui.projects}</a>
<a href="${root}#${a.about}">${ui.about}</a>
<a href="${root}#${a.contact}">${ui.cta} →</a>
</nav>
</header>`;
};

// Shared internal links: every page reaches every service and city, and the home page.
export function linksSection(current = '', lang = 'es') {
  const item = (href, label) => `<li><a href="${href}"${href === current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
  if (lang === 'en') return `<section class="section site-links" aria-labelledby="site-links-title">
<p class="eyebrow">Services</p>
<h2 id="site-links-title">Explore what we can build for your business.</h2>
<div class="site-links-grid">
<div><ul class="link-list">${SERVICES_EN.map(s => item(enServiceRoute(s), s.short)).join('')}</ul></div>
</div>
<p class="section-note">We work remotely, by video call and WhatsApp, with businesses in Mexico and abroad.</p>
</section>`;
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

const footer = lang => {
  const ui = UI[lang], root = ui.root, a = ui.anchors;
  return `<footer class="footer section">
<a class="brand" href="${root}" aria-label="${ui.homeLabel}">
<span class="brand-logo">
<img class="logo-dark" src="/assets/logo-wordmark-dark.webp" width="720" height="192" alt="Ideas Xinfin" loading="lazy">
<img class="logo-light" src="/assets/logo-wordmark-light.webp" width="720" height="192" alt="Ideas Xinfin" loading="lazy">
</span>
</a>
<nav aria-label="${ui.footNav}">
<a href="${root}">${ui.home}</a>
<a href="${root}#${a.services}">${ui.services}</a>
<a href="${root}#${a.projects}">${ui.projects}</a>
<a href="${root}#${a.contact}">${ui.contact}</a>
</nav>
<div>
<strong>Ideas Xinfin</strong>
<span>${ui.tagline}</span>
<a href="${ui.privacy}">${ui.privacyLabel} · © 2026</a>
</div>
</footer>
<a class="whatsapp-float" href="https://wa.me/${PHONE}" target="_blank" rel="noopener noreferrer" data-track="whatsapp" aria-label="${ui.waLabel}">
<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.6a8.5 8.5 0 1 1 16.3-3.9Z"/><path d="M8.2 7.3c-.8.6-1 1.7-.4 2.9 1.1 2.6 2.6 4 5.2 5.1 1.2.5 2.3.2 2.9-.6l.4-1-2.3-1.2-.9 1c-1.7-.8-2.5-1.6-3.3-3.2l.8-.9-1.2-2.3Z"/></svg>
<span>${ui.talk}</span>
</a>`;
};

function document({ lang = 'es', route, es, en, title, description, schema, body }) {
  const url = ORIGIN + route, ui = UI[lang];
  // Redirect target for visitors who chose English (public/theme.js); only pages with a real English version have one.
  const preferred = lang === 'es' && en ? ` data-en="${en}"` : '';
  return `<!doctype html>
<html lang="${lang}" data-theme="dark"${preferred}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#191c1e">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">
${hreflang(es, en)}
<meta property="og:type" content="website">
<meta property="og:locale" content="${ui.locale}">${en ? `<meta property="og:locale:alternate" content="${ui.altLocale}">` : ''}
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
${header(lang, es, en || '/en/')}
<main id="${lang === 'en' ? 'content' : 'contenido'}">
${priced(body)}
</main>
${footer(lang)}
<script type="module" src="/page.js"></script>
</body>
</html>
`;
}

const hero = ({ lang = 'es', crumbs, eyebrow, h1, lead, priceKey, waText }) => { const ui = UI[lang], price = priceKey && (lang === 'en' ? PRICES_EN : PRICES)[priceKey]; return `<section class="section page-hero" aria-labelledby="page-title">
<nav class="breadcrumbs" aria-label="${ui.crumbs}"><ol>${crumbs.map(([name, path], i) => i === crumbs.length - 1 ? `<li aria-current="page">${esc(name)}</li>` : `<li><a href="${path}">${esc(name)}</a></li>`).join('')}</ol></nav>
<p class="eyebrow">${esc(eyebrow)}</p>
<h1 id="page-title">${esc(h1)}</h1>
<p class="page-lead">${esc(lead)}</p>
${price ? `<p class="price-tag"><strong>${esc(price.label)}</strong><span>${esc(price.note)}</span></p>${marketSwitch(ui)}` : ''}
<div class="hero-actions">
<a class="button primary" href="${esc(wa(waText))}" target="_blank" rel="noopener noreferrer" data-track="whatsapp">${ui.quoteWa} <span aria-hidden="true">↗</span></a>
<a class="button outline" href="${ui.root}#${ui.anchors.contact}">${ui.cta} <span aria-hidden="true">→</span></a>
</div>
</section>`; };

const block = ({ h2, p = [], list = [] }) => `<article class="page-block"><h2>${esc(h2)}</h2>${p.map(text => `<p>${esc(text)}</p>`).join('')}${list.length ? `<ul>${list.map(text => `<li>${esc(text)}</li>`).join('')}</ul>` : ''}</article>`;

const faqSection = (faq, heading, lang = 'es') => `<section class="section faq" aria-labelledby="faq-title">
<div class="faq-layout">
<div class="faq-intro"><p class="eyebrow">${UI[lang].faqEyebrow}</p><h2 id="faq-title">${esc(heading)}</h2></div>
<div class="faq-list">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</div>
</section>`;

const cta = (text, lang = 'es') => `<section class="section page-cta" aria-labelledby="cta-title">
<h2 id="cta-title">${UI[lang].ctaTitle}</h2>
<p>${UI[lang].ctaText}</p>
<a class="button primary" href="${esc(wa(text))}" target="_blank" rel="noopener noreferrer" data-track="whatsapp">${UI[lang].ctaButton} <span aria-hidden="true">↗</span></a>
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
  return { route, html: document({ route, es: route, en: enServiceRoute(enFor(service.slug)), title: service.title, description: service.description, schema, body }) };
}

function englishServicePage(service) {
  const route = enServiceRoute(service);
  const crumbs = [['Home', '/en/'], ['Services', '/en/#services'], [service.short, route]];
  const waText = `Hello, I'm interested in your ${service.short.toLowerCase()} service.`;
  const schema = [breadcrumb(crumbs.map(([n, p]) => [n, p === '/en/#services' ? '/en/' : p])),
    { '@type': 'Service', '@id': `${ORIGIN}${route}#service`, name: service.short, serviceType: service.short, description: service.description, url: ORIGIN + route, provider: { '@id': ORG }, areaServed: AREA_EN, ...(offer(service.price) ? { offers: offer(service.price) } : {}) },
    faqSchema(service.faq)];
  const body = [hero({ lang: 'en', crumbs, eyebrow: service.eyebrow, h1: service.h1, lead: service.lead, priceKey: service.price, waText }),
    `<section class="section page-content" aria-label="${UI.en.detail}"><div class="page-grid">${service.blocks.map(block).join('')}</div></section>`,
    faqSection(service.faq, UI.en.faqHeading, 'en'), cta(waText, 'en'), linksSection(route, 'en')].join('\n');
  return { route, html: document({ lang: 'en', route, es: `/servicios/${service.es}/`, en: route, title: service.title, description: service.description, schema, body }) };
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
    `<section class="section page-content page-services" aria-labelledby="city-services-title"><p class="eyebrow">Servicios en ${esc(city.name)}</p><h2 id="city-services-title">Lo que podemos hacer por tu negocio en ${esc(city.name)}.</h2>${marketSwitch(UI.es)}<div class="page-grid">${offers.join('')}</div></section>`,
    faqSection(city.faq, `Preguntas desde ${city.name}.`), cta(waText), linksSection(route)].join('\n');
  return { route, html: document({ route, es: route, title: city.title, description: city.description, schema, body }) };
}

export const renderPages = () => [...SERVICES.map(servicePage), ...CITIES.map(cityPage), ...SERVICES_EN.map(englishServicePage)];
