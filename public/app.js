import './motion.js';
import { prepareInquiry } from './contact.js';
import { track } from './analytics.js';
import './site.js';
import './chat.js';

document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => { document.querySelector('#service').value = link.dataset.service; }));
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector('#form-status');
  try {
    const data = new FormData(form);
    const url = prepareInquiry({ name: data.get('name'), service: data.get('service'), message: data.get('message'), website: data.get('website'), consent: data.get('consent') === 'on' });
    track('contact_start');
    status.textContent = 'Abriendo WhatsApp. Revisa y envía tu mensaje allí; aún no se ha enviado.';
    // Same-tab navigation works on mobile and avoids pop-up blocking. Nothing is stored.
    window.location.assign(url.href);
  } catch (error) { status.textContent = error.message; }
});

const demos = {
  web: { title: 'Un espacio para tu marca', description: 'Concepto de una plataforma inmobiliaria. Explora cómo cambia el tono visual. No corresponde a un negocio real.', question: 'Elige una dirección visual:', options: ['Natural y cálida', 'Digital y audaz'], answers: ['Una paleta arena y verde, fotografía editorial y una ruta sencilla hacia reservas.', 'Contrastes azul marino y cian, tipografía expresiva y una llamada clara a conversar.'] },
  ai: { title: 'Una conversación que avanza', description: 'Simulación local de un flujo. No usa un modelo de IA, no agenda citas reales y no envía datos.', question: 'Hola, ¿qué te gustaría resolver?', options: ['Recibir consultas', 'Organizar reservas'], answers: ['Flujo propuesto: formulario → clasificar el interés → preparar respuesta → revisión humana → seguimiento.', 'Flujo propuesto: consulta de disponibilidad → selección de horario → confirmación humana → recordatorio.'], liveDescription: 'Ejemplo ilustrativo de un flujo. No agenda citas ni envía datos. Para conversar con el asistente de IA conectado, usa el botón «Asistente IA».' },
  brand: { title: 'Una idea, una voz propia', description: 'Concepto editorial de campaña. Explora dos enfoques de contenido, sin datos ni resultados atribuidos a clientes.', question: '¿Qué quieres comunicar primero?', options: ['Presentar mi negocio', 'Explicar mi servicio'], answers: ['Dirección: historia de marca, propuesta de valor y una invitación a conocerte. Formatos: portada, carrusel y reel.', 'Dirección: una necesidad concreta, tu proceso y preguntas frecuentes. Formatos: carrusel educativo y video breve.'] }
};
demos.auto = { title: 'Una experiencia con carácter', description: 'Concepto de una plataforma automotriz. No representa una marca, inventario o cliente real.', question: '¿Qué quieres facilitar primero?', options: ['Explorar el catálogo', 'Solicitar información'], answers: ['Una ficha clara con imágenes, características y filtros que ayuden a descubrir cada modelo.', 'Una ruta sencilla desde el vehículo que interesa hasta una consulta revisada y enviada por WhatsApp.'] };
demos.video = { title: 'Diseño y tecnología en acción', description: 'Video de landing pages conservado del sitio público Xinfin Lab. Material ilustrativo.', options: [] };
const dialog = document.querySelector('#demo-dialog');

// Concept previews show the design intention without inventing customer results.
const projectDetails = {
  auto: { image: 'photo-car', name: 'Perspectiva / Automotriz', headline: 'El siguiente paso empieza con una buena primera impresión.', copy: 'Un catálogo visual donde el vehículo es protagonista. Fichas claras y una ruta directa para solicitar información.', service: 'Plataformas digitales y landing pages' },
  web: { image: 'photo-property', name: 'Aurum / Inmobiliario', headline: 'Una propiedad se descubre antes de visitarla.', copy: 'Fotografía con espacio para respirar, información fácil de explorar y una experiencia coherente en móvil y escritorio.', service: 'Plataformas digitales y landing pages' },
  brand: { image: 'photo-branding', name: 'Origen / Identidad y contenido', headline: 'Una marca que se reconoce en cada detalle.', copy: 'Una dirección visual que conecta producto, fotografía y contenido. Un mismo lenguaje para tu sitio y tus campañas.', service: 'Marketing digital, redes sociales y SEO' }
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
    photo.setAttribute('role', 'img'); photo.setAttribute('aria-label', `Imagen ilustrativa del concepto ${project.name}`);
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
    const caption = document.createElement('p'); caption.textContent = 'Video ilustrativo conservado de Xinfin Lab. No representa un caso ni resultados verificados. Solo se conecta al sitio de origen al reproducir.';
    const play = document.createElement('button'); play.type = 'button'; play.className = 'button'; play.textContent = 'Reproducir recurso original ↗';
    play.addEventListener('click', () => {
      const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'none'; video.setAttribute('aria-label', 'Video ilustrativo de landing pages de Xinfin Lab');
      video.src = 'https://xinfinlab.com/img/pilar-landings.mp4';
      video.addEventListener('error', () => { caption.textContent = 'El video original no está disponible en este momento. Puedes continuar explorando la demostración.'; });
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

const assistantResponses = { propuesta: 'Empecemos por tu objetivo, tu audiencia y el alcance. Cuéntanos tu idea en el formulario y preparemos una conversación.', landing: 'Podemos conectar diseño, contenido y contacto en una landing a medida. ¿Qué servicio o producto quieres presentar?', automatizar: 'Identifiquemos una tarea repetitiva y el proceso actual. Después definimos qué automatizar y dónde mantener revisión humana.', seo: 'Podemos revisar la estructura de tu web, el contenido y tu visibilidad. Cuéntanos tu negocio y el mercado al que quieres llegar.' };
// When the chat service is live, public/chat.js answers these buttons through the same API.
document.querySelectorAll('[data-assistant]').forEach(button => button.addEventListener('click', () => { if (document.documentElement.dataset.chat === 'live') return; document.querySelector('.assistant-message').textContent = assistantResponses[button.dataset.assistant]; document.querySelectorAll('[data-assistant]').forEach(item => item.setAttribute('aria-pressed',String(item===button))); }));
