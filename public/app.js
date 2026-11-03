import './motion.js';
import { prepareInquiry } from './contact.js';
import { track } from './analytics.js';
import './site.js';
import { quoteFor, quoteText } from './pricing.js';
import { t } from './i18n.js';
import './chat.js';

document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => { document.querySelector('#service').value = link.dataset.service; }));
// "Solicitar cotización" carries the price shown on screen into the WhatsApp message; it follows the México/Global switch.
let quotedService = '';
const reference = document.querySelector('#quote-reference');
function showReference() {
  const text = quotedService ? quoteText(quoteFor(quotedService)) : '';
  reference.hidden = !text;
  reference.querySelector('span').textContent = text ? t('Precio de referencia: {reference}. Orientativo.').replace('{reference}', () => text) : '';
}
document.querySelectorAll('[data-quote]').forEach(link => link.addEventListener('click', () => { quotedService = link.dataset.quote; showReference(); }));
reference.querySelector('.quote-remove').addEventListener('click', () => { quotedService = ''; showReference(); document.querySelector('#message').focus(); });
window.addEventListener('ideasxinfin:market', showReference);
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector('#form-status');
  try {
    const data = new FormData(form);
    const url = prepareInquiry({ name: data.get('name'), service: data.get('service'), message: data.get('message'), website: data.get('website'), consent: data.get('consent') === 'on', reference: quotedService ? quoteText(quoteFor(quotedService)) : '' });
    track('contact_start');
    status.textContent = t('Abriendo WhatsApp. Revisa y envía tu mensaje allí; aún no se ha enviado.');
    // Same-tab navigation works on mobile and avoids pop-up blocking. Nothing is stored.
    window.location.assign(url.href);
  } catch (error) { status.textContent = error.message; }
});

const demos = {
  web: { title: t('Un espacio para tu marca'), description: t('Concepto de una plataforma inmobiliaria. Explora cómo cambia el tono visual. No corresponde a un negocio real.'), question: t('Elige una dirección visual:'), options: [t('Natural y cálida'), t('Digital y audaz')], answers: [t('Una paleta arena y verde, fotografía editorial y una ruta sencilla hacia reservas.'), t('Contrastes azul marino y cian, tipografía expresiva y una llamada clara a conversar.')] },
  ai: { title: t('Una conversación que avanza'), description: t('Simulación local de un flujo. No usa un modelo de IA, no agenda citas reales y no envía datos.'), question: t('Hola, ¿qué te gustaría resolver?'), options: [t('Recibir consultas'), t('Organizar reservas')], answers: [t('Flujo propuesto: formulario → clasificar el interés → preparar respuesta → revisión humana → seguimiento.'), t('Flujo propuesto: consulta de disponibilidad → selección de horario → confirmación humana → recordatorio.')], liveDescription: t('Ejemplo ilustrativo de un flujo. No agenda citas ni envía datos. Para conversar con el asistente de IA conectado, usa el botón «Asistente IA».') },
  brand: { title: t('Una idea, una voz propia'), description: t('Concepto editorial de campaña. Explora dos enfoques de contenido, sin datos ni resultados atribuidos a clientes.'), question: t('¿Qué quieres comunicar primero?'), options: [t('Presentar mi negocio'), t('Explicar mi servicio')], answers: [t('Dirección: historia de marca, propuesta de valor y una invitación a conocerte. Formatos: portada, carrusel y reel.'), t('Dirección: una necesidad concreta, tu proceso y preguntas frecuentes. Formatos: carrusel educativo y video breve.')] }
};
demos.auto = { title: t('Una experiencia con carácter'), description: t('Concepto de una plataforma automotriz. No representa una marca, inventario o cliente real.'), question: t('¿Qué quieres facilitar primero?'), options: [t('Explorar el catálogo'), t('Solicitar información')], answers: [t('Una ficha clara con imágenes, características y filtros que ayuden a descubrir cada modelo.'), t('Una ruta sencilla desde el vehículo que interesa hasta una consulta revisada y enviada por WhatsApp.')] };
demos.video = { title: t('Diseño y tecnología en acción'), description: t('Video de landing pages conservado del sitio público Xinfin Lab. Material ilustrativo.'), options: [] };
const dialog = document.querySelector('#demo-dialog');

// Concept previews show the design intention without inventing customer results.
const projectDetails = {
  auto: { image: 'photo-car', name: t('Perspectiva / Automotriz'), headline: t('El siguiente paso empieza con una buena primera impresión.'), copy: t('Un catálogo visual donde el vehículo es protagonista. Fichas claras y una ruta directa para solicitar información.'), service: 'Plataformas digitales y landing pages' },
  web: { image: 'photo-property', name: t('Aurum / Inmobiliario'), headline: t('Una propiedad se descubre antes de visitarla.'), copy: t('Fotografía con espacio para respirar, información fácil de explorar y una experiencia coherente en móvil y escritorio.'), service: 'Plataformas digitales y landing pages' },
  brand: { image: 'photo-branding', name: t('Origen / Identidad y contenido'), headline: t('Una marca que se reconoce en cada detalle.'), copy: t('Una dirección visual que conecta producto, fotografía y contenido. Un mismo lenguaje para tu sitio y tus campañas.'), service: 'Marketing digital, redes sociales y SEO' }
};
let selectedDemoService = '';
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
  const demo = demos[button.dataset.demo];
  document.querySelector('#demo-title').textContent = demo.title;
  const live = document.documentElement.dataset.chat === 'live';
  document.querySelector('#demo-description').textContent = live && demo.liveDescription ? demo.liveDescription : demo.description;
  const container = document.querySelector('#demo-content');
  container.replaceChildren();
  const project = projectDetails[button.dataset.demo];
  selectedDemoService = project?.service || (button.dataset.demo === 'ai' ? 'IA y automatizaciones' : '');
  dialog.dataset.project = project ? button.dataset.demo : '';
  if (project) {
    const detail = document.createElement('section'); detail.className = 'project-detail';
    const photo = document.createElement('div'); photo.className = `project-detail-image ${project.image}`;
    photo.setAttribute('role', 'img'); photo.setAttribute('aria-label', t('Imagen ilustrativa del concepto {name}').replace('{name}', project.name));
    const copy = document.createElement('div'); copy.className = 'project-detail-copy';
    const label = document.createElement('p'); label.className = 'project-detail-label'; label.textContent = project.name;
    const heading = document.createElement('h3'); heading.textContent = project.headline;
    const description = document.createElement('p'); description.textContent = project.copy;
    copy.append(label, heading, description); detail.append(photo, copy); container.append(detail);
  }
  const panel = document.createElement('div'); panel.className = 'demo-panel';
  const question = document.createElement('p'); question.textContent = demo.question;
  const choices = document.createElement('div'); choices.className = 'demo-options';
  const answer = document.createElement('p'); answer.className = 'demo-answer'; answer.setAttribute('aria-live', 'polite');
  demo.options.forEach((label, index) => {
    const option = document.createElement('button'); option.type = 'button'; option.textContent = label; option.setAttribute('aria-pressed', 'false');
    option.addEventListener('click', () => { choices.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === option))); answer.textContent = demo.answers[index]; });
    choices.append(option);
  });
  panel.append(question, choices, answer); if (demo.options.length) container.append(panel);
  if (['web', 'video'].includes(button.dataset.demo)) {
    const media = document.createElement('div'); media.className = 'demo-panel';
    const caption = document.createElement('p'); caption.textContent = t('Video ilustrativo conservado de Xinfin Lab. No representa un caso ni resultados verificados. Solo se conecta al sitio de origen al reproducir.');
    const play = document.createElement('button'); play.type = 'button'; play.className = 'button'; play.textContent = t('Reproducir recurso original ↗');
    play.addEventListener('click', () => {
      const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'none'; video.setAttribute('aria-label', t('Video ilustrativo de landing pages de Xinfin Lab'));
      video.src = 'https://xinfinlab.com/img/pilar-landings.mp4';
      video.addEventListener('error', () => { caption.textContent = t('El video original no está disponible en este momento. Puedes continuar explorando la demostración.'); });
      play.replaceWith(video); video.play().catch(() => { /* Native controls remain available. */ });
    }, { once: true });
    media.append(caption, play); container.append(media);
  }
  dialog.showModal(); document.body.classList.add('dialog-open'); track('demo_open');
}));
dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); dialog.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); }); });
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#demo-contact').addEventListener('click', () => {
  if (selectedDemoService) document.querySelector('#service').value = selectedDemoService;
  dialog.close();
  // Make the handoff useful for keyboard visitors as well as pointer visitors.
  requestAnimationFrame(() => document.querySelector('#name').focus({ preventScroll: true }));
});
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });

const assistantResponses = { propuesta: t('Empecemos por tu objetivo, tu audiencia y el alcance. Cuéntanos tu idea en el formulario y preparemos una conversación.'), landing: t('Podemos conectar diseño, contenido y contacto en una landing a medida. ¿Qué servicio o producto quieres presentar?'), automatizar: t('Identifiquemos una tarea repetitiva y el proceso actual. Después definimos qué automatizar y dónde mantener revisión humana.'), seo: t('Podemos revisar la estructura de tu web, el contenido y tu visibilidad. Cuéntanos tu negocio y el mercado al que quieres llegar.') };
// When the chat service is live, public/chat.js answers these buttons through the same API.
document.querySelectorAll('[data-assistant]').forEach(button => button.addEventListener('click', () => { if (document.documentElement.dataset.chat === 'live') return; document.querySelector('.assistant-message').textContent = assistantResponses[button.dataset.assistant]; document.querySelectorAll('[data-assistant]').forEach(item => item.setAttribute('aria-pressed',String(item===button))); }));
