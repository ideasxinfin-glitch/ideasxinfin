// English versions of the service pages (scripts/seo-pages.mjs). Same rules as seo-content.mjs: no invented
// clients, results or guarantees. Amounts stay in MXN here; public/pricing.js shows them in the visitor's currency.
export const PRICES_EN = {
  landing: { label: 'From $3,800 MXN', note: 'One-time payment. The final price depends on content and features.' },
  social: { label: 'From $3,500 MXN per month', note: 'Monthly service. The final price depends on the channels and the volume of content.' }
};

export const SERVICES_EN = [
  {
    slug: 'website-landing-page-design', es: 'landing-pages', short: 'Website and landing page design', price: 'landing',
    title: 'Professional Website & Custom Landing Page Design | Ideas Xinfin',
    description: 'Professional website design and custom landing page development: fast, mobile-ready pages built around your business and connected to WhatsApp, with a clear proposal first.',
    eyebrow: 'Websites and landing pages',
    h1: 'Professional website design and custom landing pages that turn visits into customers',
    lead: 'A site of your own that is fast and clear, built so customers understand what you offer and get in touch. No recycled templates: we start from your business and what you need to achieve.',
    blocks: [
      { h2: 'What is a landing page?', p: ['It is a page focused on one action: requesting a quote, making a booking, sending a WhatsApp message or leaving contact details. With distractions removed, people arriving from Google, Facebook or Instagram know exactly what to do next.', 'If you need to present several services, your story and your team, a website with more sections is the better fit. We help you choose before anything is built.'] },
      { h2: 'What is included', list: ['Custom design for your brand, not a template in different colors.', 'Layouts adapted to phones, tablets and computers.', 'Fast loading and optimized images.', 'Buttons and forms that lead to WhatsApp.', 'SEO foundations: titles, descriptions and structured data.', 'Copy reviewed with you so your offer is easy to understand.'] },
      { h2: 'AI-powered websites', p: ['A landing page can also include an AI assistant that answers your customers using the information you approve. Landing pages with artificial intelligence start from $6,500 MXN, and the final price depends on what the assistant needs to do.'] },
      { h2: 'How we work', list: ['Discovery: we get to know your business, your customer and your goal.', 'A proposal with scope, stages, timeline and price before we start.', 'Design and development, with reviews along the way.', 'Launch and final adjustments.'] }
    ],
    faq: [
      ['How much does a landing page cost?', 'From $3,800 MXN as a one-time payment; it is not a subscription. The final price depends on the content, sections and features you need, and it is set in the proposal before we start.'],
      ['How long does it take?', 'It depends on the content and features. The timeline is defined in the proposal, together with the stages and reviews.'],
      ['Are the domain and hosting included?', 'We go over that with you during discovery: if you already have a domain we use it, and if not, we explain the options and their cost before you commit.'],
      ['Does it work if my customers are in another country?', 'Yes. We work remotely, by video call and WhatsApp, with businesses in Mexico and abroad.']
    ]
  },
  {
    slug: 'ai-agents-automation', es: 'inteligencia-artificial', short: 'AI agents and automation', price: null,
    title: 'AI Agents & Business Process Automation | Ideas Xinfin',
    description: 'AI agents for businesses that answer customers, guide them and hand the conversation to WhatsApp, plus business process automation that removes repetitive work.',
    eyebrow: 'Artificial intelligence and automation',
    h1: 'AI agents for businesses that take care of your customers',
    lead: 'An assistant that answers common questions at any hour, explains your services using your own information and brings interested people to your team. You decide what it answers and what it does not.',
    blocks: [
      { h2: 'You can try one right here', p: ['The assistant on this page is a real example of the service: it answers with approved information, does not make up prices, filters out questions unrelated to the business and offers to continue on WhatsApp. Open it with the “AI assistant” button.'] },
      { h2: 'AI customer service automation', list: ['Answer frequently asked questions with your own information.', 'Explain services, opening hours, service areas and requirements.', 'Bring interested people to WhatsApp with the context ready.', 'Log the questions it could not answer so it keeps improving.', 'Connect with forms and other tools.'] },
      { h2: 'Business process automation, with your team in charge', p: ['We connect enquiries, follow-up and repetitive tasks to reduce manual steps. Each automation is designed with you, and your team keeps control of the important decisions.'] }
    ],
    faq: [
      ['How much does an AI agent cost?', 'It depends on what it needs to answer, where it lives (your website, WhatsApp or another channel) and the integrations. We quote it after a review of your project, with a clear scope and price.'],
      ['Can the AI make up answers?', 'We keep that to a minimum: the assistant answers with the information you approve, has rules against inventing prices or promises, and hands over to a person when it does not know.'],
      ['What happens to my customers’ data?', 'We define with you what is stored, for how long and who can see it. By default we do not store full conversations.']
    ]
  },
  {
    slug: 'digital-marketing', es: 'redes-sociales-google-business', short: 'Digital marketing, social media and Google Business', price: 'social',
    title: 'Digital Marketing Services: Social Media & Google Business | Ideas Xinfin',
    description: 'Digital marketing services for businesses: social media management and optimization of your Google Business Profile, for better local visibility and a consistent brand.',
    eyebrow: 'Digital marketing',
    h1: 'Digital marketing services: social media management and your Google Business Profile',
    lead: 'When someone looks for what you sell nearby, the first things they see are Google Maps and your social channels. We make sure your business appears complete, up to date and with an image that builds trust.',
    blocks: [
      { h2: 'Google Business Profile (Google Maps)', list: ['Review and optimization of categories, services and description.', 'Hours, service area, photos and contact details kept current.', 'Regular posts with news and promotions.', 'Support with replying to reviews in your brand’s voice.'] },
      { h2: 'Social media', list: ['A content calendar aligned with your goals.', 'Post design with an identity of its own.', 'Copy written for your audience and your market.', 'Regular reviews of what works, to adjust the plan.'] },
      { h2: 'Why together', p: ['Your Google profile, your social channels and your website tell the same story. When they are consistent, someone who finds you on the map and then checks your Instagram or your site can confirm you are a serious option.'] }
    ],
    faq: [
      ['How much does it cost?', 'From $3,500 MXN per month. The final price depends on the channels we manage, the amount of content and the scope agreed in the proposal.'],
      ['Do you guarantee first place on Google Maps?', 'Nobody can guarantee that: Google decides the order based on relevance, distance and reputation. What we do is keep your profile complete, active and well presented, which is the part within your control.'],
      ['Do I already need a Google profile?', 'No. If you do not have one, we guide you through creating and verifying it in your name; if you do, we start from what is there.'],
      ['Which social networks do you manage?', 'The ones your customers use, usually Facebook and Instagram. We define this with you during discovery.']
    ]
  },
  {
    slug: 'seo', es: 'seo', short: 'SEO services', price: null,
    title: 'SEO Services for Businesses | Ideas Xinfin',
    description: 'SEO services for businesses: technical SEO, useful content, service pages and Google Business Profile optimization, so customers can find you. No guaranteed-ranking promises.',
    eyebrow: 'SEO',
    h1: 'SEO services that help customers find your business on Google',
    lead: 'SEO is not a trick: it is a fast, clear website, content that answers what your customers ask, and signals of trust beyond your own site. We work on all three with you.',
    blocks: [
      { h2: 'Technical SEO', list: ['Speed, mobile readiness and a clean structure.', 'Titles, descriptions and structured data for each page.', 'Sitemap, Search Console and crawl error fixes.', 'Correct redirects when you change domain or website.'] },
      { h2: 'Content and local search', list: ['Service and location pages with original content.', 'Answers to the real questions your customers ask.', 'Google Business Profile optimization for nearby searches.'] },
      { h2: 'Authority', p: ['Google places more trust in sites that others mention. We help you identify relevant directories, partnerships and mentions for your industry, without buying links or using practices that put your domain at risk.'] }
    ],
    faq: [
      ['How soon will I see results?', 'The first changes often show within weeks, but rankings are built over months and depend on the competition in your industry and market. Be wary of anyone who guarantees first place.'],
      ['How much does SEO cost?', 'It depends on the state of your website, your competition and the number of pages or locations. We quote it after reviewing your case.'],
      ['Can it help me rank in other countries?', 'It can. We work on content that is useful for the audience you want to reach and on clear signals of who you serve, with each language on its own page.']
    ]
  }
];
