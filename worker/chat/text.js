// Pure text helpers: no bindings, so they are unit-testable and cheap to run.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f‪-‮⁦-⁩]/g;

export const clean = value => String(value ?? '').normalize('NFC').replace(CONTROL, '').trim();

export function normalize(value) {
  return clean(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

const STOP = new Set('a al algo como con de del el ella en es esta este hay la las lo los me mi mis no o para pero por que quiero se si sin su sus te tu tus un una uno unos y ya yo usted ustedes ustedes puedo pueden puedes tienen tiene hacen hacer'.split(' '));
export const tokens = value => normalize(value).split(' ').filter(word => word.length > 2 && !STOP.has(word));

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Personal data must never enter the shared cache or review candidates.
const PII = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/g,
  /(?:\+?\d[\s-]?){7,}/g,
  /\b(?:me llamo|mi nombre es|soy)\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)?/g,
  /https?:\/\/\S+/g,
  /\b(?:rfc|curp|tarjeta|cuenta|clabe)\b[\s:#]*\S+/gi
];
export const hasPersonalData = value => PII.some(pattern => { pattern.lastIndex = 0; return pattern.test(value); });
export const scrub = value => PII.reduce((text, pattern) => text.replace(pattern, '[dato omitido]'), clean(value)).slice(0, 300);

// Relevance rules run before any model call. Off-topic answers cost nothing.
const BUSINESS = /\b(website|websites|site|sites|page|pages|online store|ecommerce|platforms?|application|ai|agents?|automat\w*|social media|ranking|search engine\w*|brand|design|business|businesses|company|companies|startup|customers?|sales|quote|proposal|services?|project|appointments?|bookings?|orders?|campaigns?|ads|domain|pagina|paginas|web|sitio|sitios|landing|tienda en linea|ecommerce|e commerce|plataforma|plataformas|app|aplicacion|sistema|software|ia|inteligencia artificial|agente|agentes|chatbot|bot|bots|automatiza\w*|whatsapp|crm|marketing|redes|instagram|facebook|tiktok|seo|google|posicionamiento|buscador\w*|contenido|marca|branding|logo|diseno|negocio|negocios|empresa|emprendimiento|clientes|ventas|prospectos|leads|cotiza\w*|presupuesto|propuesta|diagnostico|servicio|servicios|xinfin|proyecto|citas|reservas|pedidos|digital\w*|campana|anuncios|dominio|hosting)\b/;
const VENUES = /\b(restaurant|bakery|coffee shop|clinic|dentist|real estate|workshop|gym|barbershop|school|shop|store|agency|law firm|restaurante|hamburgueseria|taqueria|cafeteria|pizzeria|panaderia|reposteria|tienda|clinica|consultorio|dentista|inmobiliaria|taller|gimnasio|salon|barberia|escuela|colegio|hotel|despacho|agencia|club|spa|veterinaria|farmacia|boutique|negocio|empresa|marca|emprendimiento)\b/;
const OFF_TOPIC = [
  ['food', /\b(burger|burgers|hamburger|pizza|pizzas|recipe|recipes|fries|sushi|soda|beer|cook|dinner|lunch|hamburguesa|hamburguesas|pizza|pizzas|tacos?|receta|recetas|papas fritas|papas|hot ?dog|sushi|refresco|cerveza|comida|cocinar|platillo)\b/],
  ['weather', /\b(weather|rain|forecast|hurricane|clima|lluvia|llover|temperatura|pronostico|huracan)\b/],
  ['sports', /\b(football|soccer|baseball|basketball|world cup|futbol|partido|liga|mundial|beisbol|nba|nfl|gol|goles|equipo favorito)\b/],
  ['homework', /\b(homework|essay|exam|solve this|equation|capital of|translate|tarea|ensayo|examen|resuelve|ecuacion|cuanto es \d+|capital de|quien gano|traduce|traduceme)\b/],
  ['personal', /\b(horoscope|joke|girlfriend|boyfriend|song|lyrics|movie|horoscopo|chiste|novia|novio|pareja|amor|cancion|letra de|pelicula|serie)\b/]
];
const GREETING = /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal|saludos|hi|hello|hi there|hello there|good morning|good afternoon|good evening)( [a-z]+)?$/;
const THANKS = /^(gracias|muchas gracias|ok gracias|perfecto gracias|mil gracias|genial|ok|vale|thanks|thank you|thanks a lot|thank you very much|great|ok thanks)$/;
const PRICE = /\b(price|prices|pricing|cost|costs|how much|fee|fees|budget|promotion|promotions|discount|discounts|precio|precios|costo|costos|cuesta|cuestan|cobran|cobras|tarifa|tarifas|presupuesto|promocion|promociones|descuento|cuanto vale|cuanto sale)\b/;

export function classify(message) {
  const text = normalize(message);
  if (GREETING.test(text)) return { category: 'greeting', topic: null, priceIntent: false };
  if (THANKS.test(text)) return { category: 'thanks', topic: null, priceIntent: false };
  const business = BUSINESS.test(text) || VENUES.test(text);
  const offTopic = OFF_TOPIC.find(([, pattern]) => pattern.test(text));
  const priceIntent = PRICE.test(text);
  if (offTopic && !business) return { category: 'offtopic', topic: offTopic[0], priceIntent };
  if (business) return { category: 'business', topic: null, priceIntent };
  return { category: 'ambiguous', topic: null, priceIntent };
}

const OFF_TOPIC_REPLIES = {
  food: '¡Eso sí que se antoja! 🍔 No vendemos comida, pero si tienes un restaurante o negocio de alimentos podemos ayudarte a conseguir más clientes con una página web, pedidos digitales y automatización con inteligencia artificial. ¿Tienes algún negocio que te gustaría impulsar?',
  weather: 'Del clima no sé mucho 🌤️, pero sí de cómo una presencia digital puede ayudar a tu negocio en cualquier temporada. ¿Te gustaría crear una página web, automatizar consultas o mejorar tu marketing?',
  sports: 'Ese partido lo dejo a los expertos ⚽. Lo mío es ayudar a negocios a crecer en digital: páginas web, automatización con IA, marketing y SEO. ¿Hay algún proyecto en el que te pueda orientar?',
  homework: 'Eso queda fuera de lo que puedo resolver: soy el asistente de Ideas Xinfin y me enfoco en proyectos digitales para negocios. ¿Te gustaría saber cómo una web o una automatización podría ayudarte?',
  personal: 'Ahí no te puedo ayudar 🙂. Soy el asistente de IA de Ideas Xinfin y me especializo en páginas web, automatización, inteligencia artificial y marketing para negocios. ¿Tienes algún proyecto en mente?'
};
const OFF_TOPIC_REPLIES_EN = {
  food: 'That does sound good! 🍔 We don’t sell food, but if you run a restaurant or food business, we can help you win more customers with a website, digital ordering and AI automation. Do you have a business you’d like to grow?',
  weather: 'I don’t know much about the weather 🌤️, but I do know how a digital presence can help your business in any season. Would you like to create a website, automate enquiries or improve your marketing?',
  sports: 'I’ll leave that game to the experts ⚽. What I do is help businesses grow online: websites, AI automation, marketing and SEO. Is there a project I can guide you on?',
  homework: 'That is outside what I can help with: I’m the Ideas Xinfin assistant and I focus on digital projects for businesses. Would you like to know how a website or an automation could help you?',
  personal: 'I can’t help with that one 🙂. I’m the Ideas Xinfin AI assistant, and I specialize in websites, automation, artificial intelligence and marketing for businesses. Do you have a project in mind?'
};
export const offTopicReply = (topic, lang = 'es') => { const replies = lang === 'en' ? OFF_TOPIC_REPLIES_EN : OFF_TOPIC_REPLIES; return replies[topic] || replies.personal; };

// Replies follow the visitor's own words; the page language decides when the message gives no clear signal.
const WORDS_EN = /\b(the|what|how|much|does|do|can|could|you|your|need|want|would|like|website|cost|price|prices|for|with|my|is|are|i|im|hello|hi|thanks|thank|please|and|of|to|we|our|business|about|have|an|get)\b/g;
const WORDS_ES = /\b(el|la|los|las|que|como|cuanto|cuesta|cuestan|quiero|necesito|para|con|mi|mis|una|un|es|son|hola|gracias|por|de|del|y|negocio|pagina|puedo|tienen|hacen|sitio|precio|precios|tu|en|sobre|ofrecen|buenas|buenos)\b/g;
export function detectLanguage(message, selected = 'es') {
  const text = normalize(message);
  const english = (text.match(WORDS_EN) || []).length;
  const spanish = (text.match(WORDS_ES) || []).length + (/[¿¡áéíóúñ]/i.test(String(message)) ? 2 : 0);
  return english > spanish ? 'en' : spanish > english ? 'es' : selected;
}

export const WELCOME = '¡Hola! 👋 Soy el asistente de inteligencia artificial de Ideas Xinfin.\n\n¿Te gustaría crear una página web, automatizar tu negocio o descubrir cómo la IA puede ayudarte a conseguir más clientes?';
export const WELCOME_EN = 'Hi! 👋 I’m the Ideas Xinfin artificial intelligence assistant.\n\nWould you like to create a website, automate your business or find out how AI can help you win more customers?';
export const THANKS_REPLY_EN = 'You’re welcome! If you want to move forward, I can guide you on your project, or you can message us on WhatsApp to talk with the team.';
export const THANKS_REPLY = '¡Con gusto! Si quieres avanzar, puedo orientarte con tu proyecto o puedes escribirnos por WhatsApp para hablar con el equipo.';
export const STARTERS = Object.freeze([
  { label: 'Crear mi página web', question: 'Quiero crear una página web para mi negocio' },
  { label: 'Automatizar mi negocio', question: '¿Cómo pueden automatizar mi negocio?' },
  { label: 'Agentes de inteligencia artificial', question: '¿Qué es un agente de inteligencia artificial y cómo me ayuda?' },
  { label: 'Mejorar mi marketing y SEO', question: 'Quiero mejorar mi marketing digital y mi SEO' }
]);

export const STARTERS_EN = Object.freeze([
  { label: 'Create my website', question: 'I want to create a website for my business' },
  { label: 'Automate my business', question: 'How can you automate my business?' },
  { label: 'Artificial intelligence agents', question: 'What is an AI agent and how does it help me?' },
  { label: 'Improve my marketing and SEO', question: 'I want to improve my digital marketing and SEO' }
]);

// Models answer in Markdown-ish text; the widget renders plain text only.
export function tidyReply(value) {
  return String(value ?? '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s*/gm, '').replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\((?:https?:)?[^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n').trim().slice(0, 1400);
}

// Errors safe to show to visitors; anything else becomes a generic 500.
export const fail = (message, status = 400) => Object.assign(new Error(message), { status, public: true });
