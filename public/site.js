import { track } from './analytics.js';

// Theme, mobile menu and WhatsApp tracking shared by the landing and the service/city pages.
const themeToggle = document.querySelector('.theme-toggle');
const syncTheme = () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', `Cambiar a tema ${isDark ? 'claro' : 'oscuro'}`);
  themeToggle.setAttribute('aria-pressed', String(!isDark));
  themeToggle.firstElementChild.textContent = isDark ? '☼' : '☾';
  themeToggle.querySelector('.theme-label').textContent = isDark ? 'Claro' : 'Oscuro';
  themeToggle.title = `Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`;
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#191c1e' : '#f6f6f3';
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
matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelectorAll('[data-track="whatsapp"]').forEach(link => link.addEventListener('click', () => track('whatsapp_click')));
