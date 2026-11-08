export type Language = 'sv' | 'en'

export type CityClub = {
  slug: string
  city_sv: string
  city_en: string
  colours: [string, string]
  pattern: 'stripes' | 'waves' | 'dots' | 'diamonds'
  verified: boolean
}

// City and district suffixes distinguish clubs sharing Stockholm without using club marks or names.
export const clubs: CityClub[] = [
  { slug: 'stockholm-soder', city_sv: 'Stockholm Söder', city_en: 'Stockholm South', colours: ['#ff6b6b', '#ffd43b'], pattern: 'stripes', verified: false },
  { slug: 'stockholm-solna', city_sv: 'Stockholm Solna', city_en: 'Stockholm Solna', colours: ['#4fb6ec', '#12324a'], pattern: 'dots', verified: false },
  { slug: 'stockholm-vasterort', city_sv: 'Stockholm Västerort', city_en: 'Stockholm West', colours: ['#77bd8a', '#f4a949'], pattern: 'diamonds', verified: false },
  { slug: 'goteborg', city_sv: 'Göteborg', city_en: 'Gothenburg', colours: ['#68c984', '#4fb6ec'], pattern: 'waves', verified: false },
  { slug: 'malmo', city_sv: 'Malmö', city_en: 'Malmö', colours: ['#ff8b67', '#5a78c9'], pattern: 'stripes', verified: false },
  { slug: 'norrkoping', city_sv: 'Norrköping', city_en: 'Norrköping', colours: ['#f1a84b', '#2c617c'], pattern: 'dots', verified: false },
  { slug: 'kristianstad', city_sv: 'Kristianstad', city_en: 'Kristianstad', colours: ['#b2c65d', '#496c7c'], pattern: 'diamonds', verified: false },
  { slug: 'pitea', city_sv: 'Piteå', city_en: 'Piteå', colours: ['#ef8b76', '#477f9c'], pattern: 'waves', verified: false },
  { slug: 'linkoping', city_sv: 'Linköping', city_en: 'Linköping', colours: ['#96b967', '#d86460'], pattern: 'stripes', verified: false },
  { slug: 'vaxjo', city_sv: 'Växjö', city_en: 'Växjö', colours: ['#64a987', '#e7b44a'], pattern: 'dots', verified: false },
  { slug: 'eskilstuna', city_sv: 'Eskilstuna', city_en: 'Eskilstuna', colours: ['#db796b', '#537b98'], pattern: 'diamonds', verified: false },
  { slug: 'umea', city_sv: 'Umeå', city_en: 'Umeå', colours: ['#80a8ce', '#efbe51'], pattern: 'waves', verified: false },
  { slug: 'hassleholm', city_sv: 'Hässleholm', city_en: 'Hässleholm', colours: ['#c7799d', '#548b7a'], pattern: 'stripes', verified: false },
  { slug: 'boras', city_sv: 'Borås', city_en: 'Borås', colours: ['#8c82bd', '#e59b5c'], pattern: 'dots', verified: false },
]

const productKinds = [
  { id: 'scarf', sv: 'Stadshalsduk', en: 'City scarf', category: 'accessories', price: 24900 },
  { id: 'tee', sv: 'Läktartröja', en: 'Terrace tee', category: 'clothing', price: 34900 },
  { id: 'hoodie', sv: 'Matchdagshoodie', en: 'Matchday hoodie', category: 'clothing', price: 69900 },
  { id: 'tote', sv: 'Stadskasse', en: 'City tote', category: 'accessories', price: 19900 },
  { id: 'cap', sv: 'Solkeps', en: 'Sun cap', category: 'accessories', price: 24900 },
  { id: 'socks', sv: 'Ribbade strumpor', en: 'Ribbed socks', category: 'clothing', price: 14900 },
  { id: 'beanie', sv: 'Vintermössa', en: 'Winter beanie', category: 'accessories', price: 27900 },
  { id: 'jacket', sv: 'Vindjacka', en: 'Light jacket', category: 'clothing', price: 89900 },
  { id: 'kids', sv: 'Minifan-tröja', en: 'Little fan tee', category: 'kids', price: 24900 },
  { id: 'sweatshirt', sv: 'Stadssweatshirt', en: 'City sweatshirt', category: 'clothing', price: 59900 },
]

export type Product = {
  id: string
  club: CityClub
  name_sv: string
  name_en: string
  category: string
  price_sek: number
  kind: string
}

export const products: Product[] = clubs.flatMap((club) => productKinds.map((kind) => ({
  id: `${club.slug}-${kind.id}`,
  club,
  name_sv: `${kind.sv} · ${club.city_sv}`,
  name_en: `${kind.en} · ${club.city_en}`,
  category: kind.category,
  price_sek: kind.price,
  kind: kind.id,
})))

export const stories = [
  { slug: 'redaktionens-forsta-avspark', category: 'news', date: '2026-11-08', title_sv: 'Välkommen till Sidlinjen', title_en: 'Welcome to the touchline', summary_sv: 'En ny mötesplats för dig som följer svensk damfotboll. Det här är början på vår gemensamma läktarsektion.', summary_en: 'A new meeting place for everyone following Swedish women’s football. This is the start of our shared terrace.' },
  { slug: 'matchdagen-ar-var', category: 'community', date: '2026-11-08', title_sv: 'Matchdagen är vår', title_en: 'Matchday belongs to us', summary_sv: 'Vi bygger en plats för allt runt fotbollen: uppladdningen, samtalen och känslan efter slutsignal.', summary_en: 'We are building a place for everything around football: the build-up, the conversations and the feeling after the final whistle.' },
  { slug: 'stad-for-stad', category: 'clubs', date: '2026-11-08', title_sv: 'Stad för stad', title_en: 'City by city', summary_sv: 'Våra klubbprofiler lyfter fram städerna med egna färger och mönster. Mer innehåll kommer snart.', summary_en: 'Our club profiles celebrate the cities with original colours and patterns. More content is on the way.' },
]

export type QuizQuestion = { question: string; options: string[]; answer: number; explanation: string }
export const demoQuiz: Record<Language, QuizQuestion[]> = {
  sv: [
    { question: 'Vilka två färger är Sidlinjens baspalett byggd kring?', options: ['Gult och himmelsblått', 'Grönt och svart', 'Rött och vitt', 'Lila och orange'], answer: 0, explanation: 'Sidlinjens visuella grund använder solgult och himmelsblått.' },
    { question: 'Vad visar en stadsprofil i Sidlinjen?', options: ['En egen stadspalett och ett abstrakt mönster', 'Ett officiellt klubbmärke', 'En spelarstatistik', 'En matchbiljett'], answer: 0, explanation: 'Klubbidentiteterna utgår från städer och egna, abstrakta mönster.' },
    { question: 'Var kontrolleras riktiga quizsvar i produktionsläget?', options: ['På servern', 'I sidans källkod', 'I webbläsarens adressfält', 'I en bildfil'], answer: 0, explanation: 'I produktionsläget ska svar kontrolleras av Supabase RPC på serversidan.' },
  ],
  en: [
    { question: 'Which two colours form Sidlinjen’s core palette?', options: ['Yellow and sky blue', 'Green and black', 'Red and white', 'Purple and orange'], answer: 0, explanation: 'Sidlinjen’s visual foundation uses sunshine yellow and sky blue.' },
    { question: 'What does a city profile show on Sidlinjen?', options: ['An original city palette and abstract pattern', 'An official club crest', 'Player statistics', 'A match ticket'], answer: 0, explanation: 'The club identities use cities and original abstract patterns.' },
    { question: 'Where are real quiz answers checked in production?', options: ['On the server', 'In the page source', 'In the browser address bar', 'Inside an image file'], answer: 0, explanation: 'In production, answers should be checked by a server-side Supabase RPC.' },
  ],
}

export const players = [
  'Hanna Ljungberg', 'Marta', 'Lotta Schelin', 'Victoria Sandell Svensson', 'Malin Moström', 'Therese Sjögran',
  'Caroline Seger', 'Nilla Fischer', 'Pia Sundhage', 'Hedvig Lindahl', 'Kosovare Asllani', 'Fridolina Rolfö',
].map((name, index) => ({ id: `${index}-${name.toLowerCase().replace(/ /g, '-')}`, name, verified: false }))