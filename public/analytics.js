// Optional first-party adapter. No third-party SDK, IDs, cookies or personal data.
const allowed = new Set(['contact_start', 'whatsapp_click', 'demo_open', 'theme_change']);
export function track(event) {
  if (!allowed.has(event)) return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  // A future consent-aware adapter can listen here. Never attach form values.
  window.dispatchEvent(new CustomEvent('ideasxinfin:analytics', { detail: { event } }));
}
