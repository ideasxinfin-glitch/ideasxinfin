import { normalize } from './text.js';

// Approved English answers for the assistant, translated from the approved Spanish knowledge (seed.js).
// Prices are not here: they come from the catalog in pricing.js. If a Spanish answer changes in the panel,
// update its English version here too; see docs/IDIOMAS-SEO.md.
const FAQ = [
  [['what services', 'what do you do', 'what do you offer', 'which services'], 'We help businesses grow online with: websites, landing pages and custom platforms; AI agents for customer service; business process automation; digital marketing and social media; SEO; and integration of digital tools. Which one would you like to explore first?'],
  [['what is an ai agent', 'what is a chatbot', 'what does an ai agent do', 'what are ai agents'], 'It is an assistant that talks with your customers, answers common questions using your business information and helps organize opportunities, for example by identifying which service they are looking for. That way your team spends less time on repetitive work and comes better prepared to each conversation, with human review wherever you decide.'],
  [['automate my business', 'can you automate', 'how can you automate', 'business process automation', 'automate processes'], 'Yes, we can help you identify repetitive tasks (such as answering enquiries, organizing requests or following up) and design a flow that simplifies them. We start by understanding your current process, and you decide what to automate and where your team steps in. Which task takes up most of your time today?'],
  [['integrate whatsapp', 'work with whatsapp', 'whatsapp integration', 'whatsapp business', 'whatsapp bot'], 'Yes. WhatsApp is our contact channel, and we can integrate it into your website and into flows that organize your customers’ enquiries. The type of integration is defined in the proposal, based on the tools your business uses.'],
  [['do you do seo', 'seo services', 'improve my seo', 'rank on google', 'show up on google', 'appear on google'], 'Yes. We review your website structure, your content and your visibility on Google so your business is easier to find. Rankings depend on many factors, so we do not promise guaranteed positions, but we do give you a clear improvement plan.'],
  [['custom platform', 'develop platforms', 'build platforms', 'custom software', 'develop applications', 'build an app'], 'Yes. Besides websites and landing pages, we develop custom platforms when your business needs specific features, such as catalogs, bookings or integrations. We define the scope together before we start.'],
  [['get a quote', 'request a quote', 'how do i quote', 'how can i contact', 'want a proposal', 'like a proposal'], 'It’s simple: message us on WhatsApp at +52 999 185 0841 or use the form on the page, which prepares a message for you to review and send. With a little context about your business we talk and give you a proposal with scope, timeline and budget.'],
  [['custom design', 'use templates', 'use a template'], 'We start from your business, your audience and what you need to achieve. We define the structure, visual language and interactions for your project; we do not pick a template and change the colors.'],
  [['already have a website', 'already have a page', 'improve my website', 'redesign my'], 'Yes. We start by reviewing what works and what is holding the experience back. From there we can rethink the design, improve the content or connect new features, depending on the scope we agree on.'],
  [['need to know about technology', 'not technical', 'know anything about technology'], 'No. Tell us what you offer, who you want to reach and what you would like to improve. We help you turn that into clear design and technology decisions.'],
  [['how long', 'how much time', 'timeline', 'delivery time'], 'It depends on the content, features and integrations. Once we understand your idea, we give you a proposal with stages and timeline before we start.'],
  [['outside mexico', 'other countries', 'another country', 'international clients', 'work internationally', 'work with clients abroad'], 'Yes. We work remotely, by video call and WhatsApp, with businesses in Mexico and abroad. Published prices can be shown in Mexican pesos or as a reference in US dollars, and each project gets a proposal with scope, price and validity before we start.']
];

export function englishFaq(message) {
  const text = normalize(message);
  return FAQ.find(([phrases]) => phrases.some(phrase => text.includes(phrase)))?.[1] || null;
}
