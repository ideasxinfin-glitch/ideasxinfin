export const SERVICES = Object.freeze(['Plataformas digitales y landing pages', 'IA y automatizaciones', 'Marketing digital, redes sociales y SEO', 'Quiero explorar una idea']);
export const WHATSAPP_PHONE = '529991850841';
export function prepareInquiry({ name, service, message, consent, website = '', reference = '' }) {
  if (typeof name !== 'string' || typeof message !== 'string' || typeof website !== 'string') throw new Error('Revisa los campos de tu consulta.');
  if (website) throw new Error('No pudimos preparar la consulta. Escríbenos directamente por WhatsApp.');
  const clean = value => value.trim().normalize('NFC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '');
  const cleanName = clean(name).replace(/\s+/g, ' ');
  const cleanMessage = clean(message);
  if (cleanName.length < 2 || cleanName.length > 80) throw new Error('Escribe tu nombre (entre 2 y 80 caracteres).');
  if (!SERVICES.includes(service)) throw new Error('Selecciona un servicio de la lista.');
  if (cleanMessage.length < 10 || cleanMessage.length > 1500) throw new Error('Cuéntanos tu idea en entre 10 y 1500 caracteres.');
  if (consent !== true) throw new Error('Acepta el aviso para continuar en WhatsApp.');
  // Price the visitor saw on the page (built by pricing.js, never typed by the visitor).
  const cleanReference = typeof reference === 'string' ? clean(reference).replace(/\s+/g, ' ').slice(0, 200) : '';
  const quote = cleanReference ? `\n\nPrecio de referencia que vi: ${cleanReference}. Entiendo que es orientativo y que la cotización formal se confirma con alcance y vigencia.` : '';
  const text = `Hola, Ideas Xinfin. Soy ${cleanName}.\nMe interesa: ${service}.\n\n${cleanMessage}${quote}`;
  return new URL(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`);
}
