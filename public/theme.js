// Runs before paint. Storage can be unavailable in private browsing.
(() => {
  let theme;
  try { theme = localStorage.getItem('ideasxinfin-theme'); } catch { /* System preference remains usable. */ }
  if (theme !== 'light' && theme !== 'dark') theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
})();
