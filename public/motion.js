// Progressive enhancement: content is always readable without animations or JS.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const motionButton = document.querySelector('.motion-toggle');
let preference;
try { preference = localStorage.getItem('ideasxinfin-motion'); } catch { /* Optional preference. */ }
let active = false;
let observer;
const running = new Set();
const reveal = element => {
  if (!active || !element.animate || element.dataset.revealed) return;
  element.dataset.revealed = 'true';
  const index = [...element.parentElement.children].indexOf(element);
  const animation = element.animate([
    { opacity: 0, transform: 'translateY(34px) scale(.985)', filter: 'blur(5px)' },
    { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
  ], { duration: 850, delay: Math.min(index * 65, 195), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
  running.add(animation);
  animation.finished.catch(() => {}).finally(() => running.delete(animation));
};
const targets = document.querySelectorAll('.section-heading,.service-card,.project,.original-media,.ai-portrait,.ai-copy,.assistant-preview,.approach-grid>div,.contact-banner>div:not(.environment),.contact-copy,.contact-form,.footer>.brand,.footer>nav');
const syncMotion = () => {
  active = !reduced.matches && preference !== 'off';
  root.classList.toggle('motion-on', active);
  motionButton.setAttribute('aria-pressed', String(active));
  motionButton.setAttribute('aria-label', active ? 'Pausar animaciones' : 'Activar animaciones');
  motionButton.title = reduced.matches ? 'Movimiento reducido según tu dispositivo' : (active ? 'Pausar animaciones' : 'Activar animaciones');
  motionButton.querySelector('span').textContent = active ? 'Ⅱ' : '▷';
  observer?.disconnect();
  if (!active) {
    running.forEach(animation => animation.cancel());
    root.style.setProperty('--hero-drift', '0px');
    document.querySelectorAll('.tilt-active').forEach(card => card.classList.remove('tilt-active'));
    return;
  }
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); }
    }), { threshold: .1 });
    targets.forEach(element => observer.observe(element));
  }
};
motionButton.addEventListener('click', () => {
  preference = active ? 'off' : 'on';
  try { localStorage.setItem('ideasxinfin-motion', preference); } catch { /* Still works without storage. */ }
  syncMotion();
});
reduced.addEventListener('change', syncMotion);
syncMotion();

const header = document.querySelector('.header');
let scrollQueued = false;
const updateScroll = () => {
  scrollQueued = false;
  header.classList.toggle('is-scrolled', scrollY > 32);
  const total = document.documentElement.scrollHeight - innerHeight;
  root.style.setProperty('--page-progress', String(total > 0 ? Math.min(1, scrollY / total) : 0));
  if (active && finePointer.matches) root.style.setProperty('--hero-drift', `${Math.min(scrollY * .13, 75)}px`);
};
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
addEventListener('resize', updateScroll, { passive: true });
updateScroll();

document.querySelectorAll('.service-card,.project').forEach(card => {
  let queued = false;
  let pointer;
  card.addEventListener('pointermove', event => {
    if (!active || !finePointer.matches) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (!active || !card.matches(':hover')) return;
      const box = card.getBoundingClientRect();
      const x = (pointer.x - box.left) / box.width;
      const y = (pointer.y - box.top) / box.height;
      card.style.setProperty('--tilt-x', `${(y - .5) * -5}deg`);
      card.style.setProperty('--tilt-y', `${(x - .5) * 5}deg`);
      card.style.setProperty('--light-x', `${x * 100}%`);
      card.style.setProperty('--light-y', `${y * 100}%`);
      card.classList.add('tilt-active');
    });
  });
  card.addEventListener('pointerleave', () => card.classList.remove('tilt-active'));
});

// Suspend decorative loops in hidden tabs and keep the contact form unobstructed.
document.addEventListener('visibilitychange', () => root.classList.toggle('motion-suspended', document.hidden));
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => document.body.classList.toggle('contact-in-view', entry.isIntersecting), { threshold: .05 }).observe(document.querySelector('.contact-form'));
}
