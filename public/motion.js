// Progressive enhancement: all content is readable before JavaScript runs.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const hero = document.querySelector('.hero');
const header = document.querySelector('.header');
const workflow = document.querySelector('.workflow-panel');
const nodes = [...document.querySelectorAll('.workflow-node')];
const projects = [...document.querySelectorAll('.project')];
const navLinks = [...document.querySelectorAll('.desktop-nav a,.mobile-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
const targets = document.querySelectorAll('.section-heading,.service-card,.project,.original-media,.workflow-panel,.ai-copy,.assistant-preview,.approach-grid>div,.contact-banner>div:not(.environment),.contact-copy,.contact-form,.footer>.brand,.footer>nav');
let enabled = false;
let active = false;
let revealObserver;
let workflowVisible = false;
let workflowTimer = 0;
let workflowStep = 0;
let scrollFrame = 0;
let heroEntered = false;
const running = new Set();
const pointerFrames = new Map();
const easing = 'cubic-bezier(.22,1,.36,1)';

function animateIn(element, delay = 0, distance = 22, duration = 760) {
  if (!active || !element?.animate || element.dataset.revealed) return;
  element.dataset.revealed = 'true';
  const animation = element.animate([
    { opacity: 0, translate: `0 ${distance}px` },
    { opacity: 1, translate: '0 0' }
  ], { duration, delay, easing, fill: 'backwards' });
  running.add(animation);
  animation.finished.catch(() => {}).finally(() => running.delete(animation));
}

function enterHero() {
  if (heroEntered || !active || !hero) return;
  heroEntered = true;
  if (hero.getBoundingClientRect().bottom <= 0) return;
  document.querySelectorAll('.hero-copy > *').forEach((element, index) => animateIn(element, 70 + index * 90));
  animateIn(document.querySelector('.laptop'), 180, 32, 1050);
  animateIn(document.querySelector('.phone-device'), 340, 24, 1100);
  animateIn(document.querySelector('.device-caption'), 520, 8, 700);
}

function stopWorkflow() {
  clearTimeout(workflowTimer);
  workflowTimer = 0;
  nodes.forEach(node => node.classList.remove('is-active'));
}

function advanceWorkflow() {
  if (!active || !workflowVisible || !nodes.length) return;
  nodes.forEach((node, index) => node.classList.toggle('is-active', index === workflowStep));
  workflowTimer = setTimeout(() => {
    workflowTimer = 0;
    workflowStep = (workflowStep + 1) % nodes.length;
    advanceWorkflow();
  }, 2400);
}

function resetPointerMotion() {
  pointerFrames.forEach(frame => cancelAnimationFrame(frame));
  pointerFrames.clear();
  root.style.setProperty('--device-x', '0px');
  root.style.setProperty('--device-y', '0px');
  root.style.setProperty('--hero-drift', '0px');
  projects.forEach(project => {
    project.style.setProperty('--image-x', '0px');
    project.style.setProperty('--image-y', '0px');
  });
}

function updateScroll() {
  scrollFrame = 0;
  if (document.hidden) return;
  header?.classList.toggle('is-scrolled', scrollY > 32);
  const total = root.scrollHeight - innerHeight;
  root.style.setProperty('--page-progress', String(total > 0 ? Math.max(0, Math.min(1, scrollY / total)) : 0));
  if (active && finePointer.matches) root.style.setProperty('--hero-drift', `${Math.min(Math.max(scrollY, 0) * .08, 46)}px`);
  let current = sections[0]?.id;
  sections.forEach(section => {
    if (section.getBoundingClientRect().top <= innerHeight * .35) current = section.id;
  });
  // Unlisted sections (such as the AI feature) keep the preceding navigation item.
  let selected;
  for (const section of sections) {
    if (navLinks.some(link => link.getAttribute('href') === `#${section.id}`)) selected = section.id;
    if (section.id === current) break;
  }
  navLinks.forEach(link => {
    const isCurrent = link.getAttribute('href') === `#${selected}`;
    link.classList.toggle('active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function syncMotion() {
  enabled = !reduced.matches;
  active = enabled && !document.hidden;
  root.classList.toggle('motion-on', enabled);
  root.classList.toggle('motion-suspended', document.hidden);
  revealObserver?.disconnect();
  stopWorkflow();
  resetPointerMotion();
  cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  if (!active) {
    running.forEach(animation => animation.cancel());
    running.clear();
  } else {
    enterHero();
    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!active || !entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.children];
        animateIn(entry.target, Math.min(siblings.indexOf(entry.target) * 65, 130));
        revealObserver.unobserve(entry.target);
      }), { threshold: .08 });
      targets.forEach(element => {
        if (!element.dataset.revealed) revealObserver.observe(element);
      });
    }
    advanceWorkflow();
  }
  updateScroll();
}

reduced.addEventListener('change', syncMotion);
finePointer.addEventListener('change', () => { resetPointerMotion(); updateScroll(); });
document.addEventListener('visibilitychange', syncMotion);
addEventListener('scroll', () => {
  if (document.hidden || scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScroll);
}, { passive: true });
addEventListener('resize', updateScroll, { passive: true });

function attachPointerMotion(element, render, reset) {
  if (!element) return;
  let pointer;
  element.addEventListener('pointermove', event => {
    if (!active || !finePointer.matches) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (pointerFrames.has(element)) return;
    pointerFrames.set(element, requestAnimationFrame(() => {
      pointerFrames.delete(element);
      if (!active || !finePointer.matches) return;
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = Math.max(-.5, Math.min(.5, (pointer.x - box.left) / box.width - .5));
      const y = Math.max(-.5, Math.min(.5, (pointer.y - box.top) / box.height - .5));
      render(x, y);
    }));
  }, { passive: true });
  element.addEventListener('pointerleave', () => {
    cancelAnimationFrame(pointerFrames.get(element));
    pointerFrames.delete(element);
    reset();
  });
}
attachPointerMotion(hero, (x, y) => {
  root.style.setProperty('--device-x', `${x * 14}px`);
  root.style.setProperty('--device-y', `${y * 10}px`);
}, () => {
  root.style.setProperty('--device-x', '0px');
  root.style.setProperty('--device-y', '0px');
});
projects.forEach(project => attachPointerMotion(project, (x, y) => {
  project.style.setProperty('--image-x', `${x * 8}px`);
  project.style.setProperty('--image-y', `${y * 6}px`);
}, () => {
  project.style.setProperty('--image-x', '0px');
  project.style.setProperty('--image-y', '0px');
}));

if ('IntersectionObserver' in window) {
  if (workflow) new IntersectionObserver(([entry]) => {
    workflowVisible = entry.isIntersecting;
    stopWorkflow();
    advanceWorkflow();
  }, { threshold: .2 }).observe(workflow);
  const form = document.querySelector('.contact-form');
  if (form) new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('contact-in-view', entry.isIntersecting);
  }, { threshold: .05 }).observe(form);
}
syncMotion();
