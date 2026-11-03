// Runs before paint. Storage can be unavailable in private browsing.
(() => {
  let theme;
  try { theme = localStorage.getItem('ideasxinfin-theme'); } catch { /* System preference remains usable. */ }
  if (theme !== 'light' && theme !== 'dark') theme = 'dark';
  const previewTheme = new URLSearchParams(location.search).get('tema');
  if (previewTheme === 'dark' || previewTheme === 'light') theme = previewTheme;
  document.documentElement.dataset.theme = theme;
  // Section anchors per language (Spanish → English), shared with the language switch in public/site.js.
  const anchors = window.ixfAnchors = { inicio: 'home', contenido: 'content', servicios: 'services', precios: 'pricing', portafolio: 'projects', agentes: 'ai-agents', nosotros: 'about', contacto: 'contact' };
  // Only a visitor who picked English follows it here, and only when this page has an English version.
  // Crawlers and first visits have no saved choice, so each URL keeps serving its own language.
  const english = document.documentElement.dataset.en;
  let language;
  try { language = localStorage.getItem('ixf-lang'); } catch { /* The URL decides. */ }
  if (english && language === 'en') {
    const hash = location.hash.slice(1);
    location.replace(english + location.search + (hash ? `#${anchors[hash] || hash}` : ''));
  }
})();
