import { prepareInquiry } from './contact.js';
import { track } from './analytics.js';

const themeToggle = document.querySelector('.theme-toggle');
const syncTheme = () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', `Cambiar a tema ${isDark ? 'claro' : 'oscuro'}`);
  themeToggle.setAttribute('aria-pressed', String(!isDark));
  themeToggle.firstElementChild.textContent = isDark ? '☼' : '☾';
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#09141e' : '#f6f3ec';
};
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('ideasxinfin-theme', theme); } catch { /* Toggle works without persistence when storage is blocked. */ }
  syncTheme(); track('theme_change');
});
window.addEventListener('storage', event => {
  if (event.key === 'ideasxinfin-theme' && ['light', 'dark'].includes(event.newValue)) {
    document.documentElement.dataset.theme = event.newValue; syncTheme();
  }
});
matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => {
  try { if (localStorage.getItem('ideasxinfin-theme')) return; } catch { /* Follow system when storage is blocked. */ }
  document.documentElement.dataset.theme = event.matches ? 'light' : 'dark'; syncTheme();
});
syncTheme();

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
const closeMenu = () => { menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Abrir menú'); mobileNav.hidden = true; };
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); } });
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => { document.querySelector('#service').value = link.dataset.service; }));
document.querySelectorAll('[data-track="whatsapp"]').forEach(link => link.addEventListener('click', () => track('whatsapp_click')));
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
  web: { title: 'Un espacio para tu marca', description: 'Concepto de una landing para un espacio creativo. Explora cómo cambia el tono visual. No corresponde a un negocio real.', question: 'Elige una dirección visual:', options: ['Natural y cálida', 'Digital y audaz'], answers: ['Una paleta arena y verde, fotografía editorial y una ruta sencilla hacia reservas.', 'Contrastes azul marino y cian, tipografía expresiva y una llamada clara a conversar.'] },
  ai: { title: 'Una conversación que avanza', description: 'Simulación local de un flujo. No usa un modelo de IA, no agenda citas reales y no envía datos.', question: 'Hola, ¿qué te gustaría resolver?', options: ['Recibir consultas', 'Organizar reservas'], answers: ['Flujo propuesto: formulario → clasificar el interés → preparar respuesta → revisión humana → seguimiento.', 'Flujo propuesto: consulta de disponibilidad → selección de horario → confirmación humana → recordatorio.'] },
  brand: { title: 'Una idea, una voz propia', description: 'Concepto editorial de campaña. Explora dos enfoques de contenido, sin datos ni resultados atribuidos a clientes.', question: '¿Qué quieres comunicar primero?', options: ['Presentar mi negocio', 'Explicar mi servicio'], answers: ['Dirección: historia de marca, propuesta de valor y una invitación a conocerte. Formatos: portada, carrusel y reel.', 'Dirección: una necesidad concreta, tu proceso y preguntas frecuentes. Formatos: carrusel educativo y video breve.'] }
};
const dialog = document.querySelector('#demo-dialog');
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
  const demo = demos[button.dataset.demo];
  document.querySelector('#demo-title').textContent = demo.title;
  document.querySelector('#demo-description').textContent = demo.description;
  const container = document.querySelector('#demo-content');
  container.replaceChildren();
  const panel = document.createElement('div'); panel.className = 'demo-panel';
  const question = document.createElement('p'); question.textContent = demo.question;
  const choices = document.createElement('div'); choices.className = 'demo-options';
  const answer = document.createElement('p'); answer.className = 'demo-answer'; answer.setAttribute('aria-live', 'polite');
  demo.options.forEach((label, index) => {
    const option = document.createElement('button'); option.type = 'button'; option.textContent = label; option.setAttribute('aria-pressed', 'false');
    option.addEventListener('click', () => { choices.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === option))); answer.textContent = demo.answers[index]; });
    choices.append(option);
  });
  panel.append(question, choices, answer); container.append(panel);
  if (button.dataset.demo === 'web') {
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
  dialog.showModal(); track('demo_open');
}));
dialog.addEventListener('close', () => dialog.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); }));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#demo-contact').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
