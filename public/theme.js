// Runs before paint. Storage can be unavailable in private browsing.
(() => {
  let theme;
  try { theme = localStorage.getItem('ideasxinfin-theme'); } catch { /* System preference remains usable. */ }
  if (theme !== 'light' && theme !== 'dark') theme = 'dark';
  const previewTheme = new URLSearchParams(location.search).get('tema');
  if (previewTheme === 'dark' || previewTheme === 'light') theme = previewTheme;
  document.documentElement.dataset.theme = theme;
})();
