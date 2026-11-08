import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleUserRound, Clock3, Menu, Moon, Plus, ShoppingBag, Sparkles, Sun, Trophy, X } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import i18n from './i18n'
import { clubs, demoQuiz, players, products, stories, type CityClub, type Language, type Product } from './data'
import { calculateQuizScore, formatSek } from './lib/domain'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type PageKey = 'home' | 'news' | 'matches' | 'clubs' | 'history' | 'players' | 'games' | 'shop' | 'login' | 'signup' | 'reset' | 'profile' | 'styleguide' | 'admin' | 'privacy' | 'terms' | 'shipping'
type CartLine = { id: string; quantity: number; size: string }
const paths: Record<Language, Record<PageKey, string>> = {
  sv: { home: '', news: 'nyheter', matches: 'matcher', clubs: 'klubbar', history: 'historia', players: 'spelare', games: 'spel', shop: 'shop', login: 'logga-in', signup: 'skapa-konto', reset: 'aterstall-losenord', profile: 'profil', styleguide: 'stilguide', admin: 'admin', privacy: 'integritet', terms: 'villkor', shipping: 'frakt-returer' },
  en: { home: '', news: 'news', matches: 'matches', clubs: 'clubs', history: 'history', players: 'players', games: 'games', shop: 'shop', login: 'login', signup: 'sign-up', reset: 'reset-password', profile: 'profile', styleguide: 'styleguide', admin: 'admin', privacy: 'privacy', terms: 'terms', shipping: 'shipping-returns' },
}

function parsePage(pathname: string, language: Language) {
  const tail = pathname.replace(new RegExp(`^/${language}/?`), '').replace(/\/$/, '')
  const [slug = '', ...segments] = tail.split('/')
  const key = (Object.keys(paths[language]) as PageKey[]).find((candidate) => paths[language][candidate] === slug) ?? 'home'
  return { key, rest: segments.join('/') }
}

function href(language: Language, key: PageKey, rest = '') {
  const slug = paths[language][key]
  return `/${language}${slug ? `/${slug}` : ''}${rest ? `/${rest}` : ''}`
}

function LanguageRedirect() {
  const saved = localStorage.getItem('sidlinjen-language')
  const preferred = saved === 'sv' || saved === 'en' ? saved : navigator.language.toLowerCase().startsWith('en') ? 'en' : 'sv'
  return <Navigate to={`/${preferred}`} replace />
}

function Pattern({ club, className = '' }: { club: CityClub; className?: string }) {
  return <div className={`pattern-art pattern-${club.pattern} ${className}`} style={{ '--city-a': club.colours[0], '--city-b': club.colours[1] } as CSSProperties}><span>{club.city_sv.slice(0, 1)}</span></div>
}

function PageHeader({ title, intro, eyebrow = 'SIDLINJEN · DAMALLSVENSKAN' }: { title: string; intro: string; eyebrow?: string }) {
  return <div className="page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>
}

function HomePage({ language }: { language: Language }) {
  const { t } = useTranslation('common')
  return <main>
    <section className="hero wrap"><div className="hero-copy"><span className="eyebrow"><Sparkles size={15} /> {t('home.eyebrow')}</span><h1>{t('home.headlineFirst')}<br />{t('home.headlineSecond')} <span>{t('home.headlineAccent')}</span></h1><p>{t('home.intro')}</p><div className="hero-actions"><Link className="button button-dark" to={href(language, 'matches')}>{t('home.matchesCta')} <ArrowRight size={17} /></Link><Link className="text-link" to={href(language, 'clubs')}>{t('home.clubsCta')}</Link></div><div className="hero-note"><span className="note-dot" /> {t('home.seasonPending')}</div></div>
      <div className="hero-art" role="img" aria-label={language === 'sv' ? 'Illustrerad fotbollsplan med boll och gula läktardetaljer' : 'Illustrated football pitch with a ball and yellow terrace details'}><div className="art-sun" /><div className="art-cloud cloud-one" /><div className="art-cloud cloud-two" /><div className="stadium"><div className="stand stand-top" /><div className="stand stand-bottom" /><div className="pitch"><div className="pitch-line" /><div className="center-circle" /><div className="ball"><span /></div></div></div><div className="art-sticker">HEJA!<span>✦</span></div><div className="art-tag">90 MIN<br />AV GLÄDJE</div></div>
    </section>
    <section className="match-strip wrap"><div className="strip-title"><span className="eyebrow">{t('home.nextMatches')}</span><h2>{t('home.matchTitle')}</h2><p>{t('home.matchSubtitle')}</p></div><div className="upcoming-placeholder"><div className="placeholder-icon"><Trophy size={20} /></div><div><strong>{t('home.matchEmptyTitle')}</strong><span>{t('home.matchEmptyText')}</span></div><Link to={href(language, 'matches')} aria-label={t('home.matchesCta')}><ArrowRight size={19} /></Link></div></section>
    <section className="community-band"><div className="wrap band-inner"><span className="band-star">✳</span><div><span className="eyebrow">{t('home.community')}</span><h2>{t('home.communityHeadline')}<br />{t('home.communitySecond')}</h2></div><p>{t('home.communityText')}</p><Link className="button button-light" to={href(language, 'games')}>{t('home.playCta')} <ArrowRight size={16} /></Link></div></section>
    <section className="wrap bottom-feature"><div><span className="eyebrow">{t('home.explore')}</span><h2>{t('home.exploreHeadline')}<br />{t('home.exploreSecond')}</h2><p>{t('home.exploreText')}</p></div><div className="feature-links"><Link to={href(language, 'clubs')}><span>01</span> {t('home.linkClubs')} <ArrowRight size={17} /></Link><Link to={href(language, 'history')}><span>02</span> {t('home.linkHistory')} <ArrowRight size={17} /></Link><Link to={href(language, 'players')}><span>03</span> {t('home.linkPlayers')} <ArrowRight size={17} /></Link></div></section>
  </main>
}

function NewsPage({ language, rest }: { language: Language; rest: string }) {
  const { t } = useTranslation(['news', 'common'])
  const story = stories.find((item) => item.slug === rest)
  if (story) return <main className="wrap inner-page"><Link className="back-link" to={href(language, 'news')}><ArrowLeft size={15} /> {t('common:nav.news')}</Link><article className="article"><span className="eyebrow">{t(`news:${story.category}`)}</span><h1>{language === 'sv' ? story.title_sv : story.title_en}</h1><div className="article-meta"><Clock3 size={14} /> {new Intl.DateTimeFormat(language === 'sv' ? 'sv-SE' : 'en-GB', { dateStyle: 'long' }).format(new Date(story.date))} <span>·</span> Sidlinjen</div><div className="article-art"><Pattern club={clubs[stories.indexOf(story)]} /></div><p>{language === 'sv' ? story.summary_sv : story.summary_en}</p><p>{t('news:sourceNote')}</p></article></main>
  return <main className="wrap inner-page"><PageHeader title={t('news:title')} intro={t('news:intro')} /><div className="news-grid">{stories.map((item, index) => <Link className={`news-card news-card-${index}`} key={item.slug} to={href(language, 'news', item.slug)}><Pattern club={clubs[index]} /><div className="news-card-copy"><span className="eyebrow">{t(`news:${item.category}`)}</span><h2>{language === 'sv' ? item.title_sv : item.title_en}</h2><p>{language === 'sv' ? item.summary_sv : item.summary_en}</p><span className="text-link">{t('common:generic.readMore')} <ArrowRight size={14} /></span></div></Link>)}</div></main>
}

function MatchesPage() {
  const { t } = useTranslation('matches')
  const [tab, setTab] = useState('fixtures')
  return <main className="wrap inner-page"><PageHeader title={t('title')} intro={t('intro')} /><div className="match-page-top"><div className="segmented">{(['results', 'fixtures', 'live'] as const).map((item) => <button key={item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{t(item)}</button>)}</div><span className="text-link">{t('standings')}</span></div><div className="notice notice-warm"><span className="notice-mark">!</span><div><strong>{t('providerTitle')}</strong><p>{t('providerText')}</p></div></div><div className="empty-panel compact-empty"><div className="empty-mark">✳</div><h2>{t('empty')}</h2><p>{t('apiNote')}</p></div></main>
}

function ClubsPage({ language, rest }: { language: Language; rest: string }) {
  const { t } = useTranslation(['clubs', 'common', 'matches', 'shop'])
  const [query, setQuery] = useState('')
  const [favourite, setFavourite] = useState(localStorage.getItem('sidlinjen-favourite') ?? '')
  const club = clubs.find((item) => item.slug === rest)
  if (rest && club) return <main className="wrap inner-page"><Link className="back-link" to={href(language, 'clubs')}><ArrowLeft size={15} /> {t('common:nav.clubs')}</Link><section className="club-detail"><Pattern club={club} className="club-banner" /><div className="club-detail-heading"><span className="eyebrow">{t('clubs:pattern')}</span><h1>{language === 'sv' ? club.city_sv : club.city_en}</h1><span className="unverified"><span>!</span> {t('common:generic.unverified')}</span></div><button className={`button follow-button ${favourite === club.slug ? 'is-following' : ''}`} onClick={() => { const next = favourite === club.slug ? '' : club.slug; setFavourite(next); localStorage.setItem('sidlinjen-favourite', next) }}>{favourite === club.slug ? <Check size={16} /> : <Plus size={16} />}{favourite === club.slug ? t('clubs:following') : t('clubs:follow')}</button><div className="detail-columns"><section><h2>{t('clubs:about')}</h2><p>{t('clubs:pending')}</p><h2>{t('clubs:latest')}</h2><p>{t('matches:empty')}</p></section><section className="related-shop"><h2>{t('clubs:shop')}</h2><p>{t('shop:unofficial')}</p><Link className="button button-dark" to={href(language, 'shop', club.slug)}>{t('common:nav.shop')} <ArrowRight size={16} /></Link></section></div></section></main>
  const visible = clubs.filter((item) => (language === 'sv' ? item.city_sv : item.city_en).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <main className="wrap inner-page"><PageHeader title={t('clubs:title')} intro={t('clubs:intro')} /><div className="page-controls"><label className="search-control"><span className="sr-only">{t('clubs:search')}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('clubs:search')} /></label><span className="small-muted">{t('clubs:pending')}</span></div><div className="club-grid">{visible.map((item, index) => <Link className="club-card" style={{ '--tilt': `${index % 2 ? 1 : -1}deg` } as CSSProperties} to={href(language, 'clubs', item.slug)} key={item.slug}><Pattern club={item} /><div className="club-card-copy"><span className="eyebrow">{t('clubs:pattern')}</span><h2>{language === 'sv' ? item.city_sv : item.city_en}</h2><span className="unverified"><span>!</span> {t('common:generic.unverified')}</span></div><ArrowRight size={18} /></Link>)}</div></main>
}

function PlayersPage() {
  const { t } = useTranslation('players')
  const [query, setQuery] = useState('')
  const filtered = players.filter((player) => player.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <main className="wrap inner-page"><PageHeader title={t('title')} intro={t('intro')} /><label className="search-control"><span className="sr-only">{t('search')}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} /></label><div className="player-grid">{filtered.map((player, index) => <article className="player-card" key={player.id}><div className={`player-avatar avatar-${index % 5}`} aria-hidden="true"><CircleUserRound size={43} /></div><h2>{player.name}</h2><p>{t('pending')}</p><span className="unverified"><span>!</span> {t('unverified')}</span></article>)}</div></main>
}

function GamesPage({ language }: { language: Language }) {
  type ActiveQuestion = { id?: string; question: string; options: string[]; answer?: number; explanation?: string }
  const { t } = useTranslation(['games', 'common'])
  const demoQuestions: ActiveQuestion[] = demoQuiz[language].map((question, questionIndex) => ({ ...question, id: `demo-${questionIndex}` }))
  const [serverQuestions, setServerQuestions] = useState<ActiveQuestion[] | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null)
  const [explanation, setExplanation] = useState('')
  const [score, setScore] = useState(0)
  const [seconds, setSeconds] = useState(20)
  const [errorMessage, setErrorMessage] = useState('')
  const questions = serverQuestions ?? demoQuestions
  const question = questions[index]
  const done = started && index >= questions.length
  async function submitAnswer(answer: number) {
    if (selected !== null || !question) return
    setSelected(answer)
    if (sessionId && supabase && question.id) {
      const { data, error } = await supabase.rpc('submit_answer', {
        p_session_id: sessionId,
        p_question_id: question.id,
        p_option_index: answer,
        p_elapsed_ms: (20 - seconds) * 1000,
        p_used_hint: false,
      })
      if (error) { setErrorMessage(error.message); return }
      const result = data as { correct: boolean; score_added: number; explanation: string | null }
      setAnswerCorrect(result.correct)
      setExplanation(result.explanation ?? '')
      setScore((value) => value + result.score_added)
      return
    }
    const correct = answer === question.answer
    setAnswerCorrect(correct)
    setExplanation(question.explanation ?? '')
    if (correct) setScore((value) => value + calculateQuizScore('easy', (20 - seconds) * 1000, 0))
  }
  useEffect(() => {
    if (!started || selected !== null || done) return
    const timer = window.setInterval(() => setSeconds((value) => value <= 1 ? 0 : value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [started, selected, done, index])
  useEffect(() => {
    if (started && seconds === 0 && selected === null) void submitAnswer(-1)
  }, [started, seconds, selected])
  const start = async () => {
    setErrorMessage('')
    if (supabase) {
      const { data, error } = await supabase.rpc('start_quiz', { p_category: null, p_language: language })
      if (error) { setErrorMessage(error.message); return }
      const result = data as { session_id: string; questions: ActiveQuestion[] }
      setSessionId(result.session_id)
      setServerQuestions(result.questions)
    }
    setStarted(true)
  }
  const advance = async () => {
    if (sessionId && supabase && index === questions.length - 1) {
      const { data, error } = await supabase.rpc('finish_quiz', { p_session_id: sessionId })
      if (error) { setErrorMessage(error.message); return }
      const result = data as { score: number }
      setScore(result.score)
    }
    setIndex((value) => value + 1)
    setSelected(null)
    setAnswerCorrect(null)
    setExplanation('')
    setSeconds(20)
  }
  const reset = () => { setStarted(false); setServerQuestions(null); setSessionId(null); setIndex(0); setSelected(null); setAnswerCorrect(null); setScore(0); setSeconds(20); setErrorMessage('') }
  return <main className="wrap inner-page"><PageHeader title={t('games:title')} intro={t('games:intro')} />{!started ? <div className="quiz-start"><div className="quiz-stamp"><Sparkles size={28} /></div><span className="eyebrow">{t('games:quiz')}</span><h2>{t('games:category')} · {t('games:categories.mixed')}</h2><p>{isSupabaseConfigured ? t('games:server') : t('games:demo')}</p>{errorMessage && <p className="auth-message" role="alert">{errorMessage}</p>}<button className="button button-dark" onClick={start}>{t('games:start')} <ArrowRight size={16} /></button></div> : done ? <div className="quiz-start quiz-result"><Trophy size={38} /><span className="eyebrow">{t('games:finish')}</span><h2>{score} {t('games:score')}</h2><p>{questions.length} {t('games:question').toLocaleLowerCase()}</p><button className="button button-dark" onClick={reset}>{t('games:playAgain')} <ArrowRight size={16} /></button></div> : question && <section className="quiz-box"><div className="quiz-progress"><span>{t('games:question')} {index + 1} / {questions.length}</span><span className="timer"><Clock3 size={15} /> {seconds}s</span></div><div className="timer-track"><span style={{ width: `${seconds * 5}%` }} /></div><h2>{question.question}</h2><div className="answer-list">{question.options.map((option, answer) => <button className={`answer-option ${selected === answer && answerCorrect ? 'correct' : ''} ${selected === answer && answerCorrect === false ? 'incorrect' : ''}`} key={option} onClick={() => void submitAnswer(answer)} disabled={selected !== null}>{String.fromCharCode(65 + answer)}<span>{option}</span>{selected === answer && answerCorrect && <Check size={18} />}</button>)}</div>{selected !== null && <div className="quiz-feedback"><strong>{answerCorrect ? t('games:correct') : t('games:incorrect')}</strong>{explanation && <p><b>{t('games:explanation')}:</b> {explanation}</p>}{errorMessage && <p role="alert">{errorMessage}</p>}<button className="button button-dark" onClick={() => void advance()}>{index === questions.length - 1 ? t('games:finish') : t('games:next')} <ArrowRight size={16} /></button></div>}</section>}</main>
}

function ProductVisual({ product }: { product: Product }) {
  const { i18n: locale } = useTranslation()
  const city = locale.resolvedLanguage === 'en' ? product.club.city_en : product.club.city_sv
  return <div className={`product-visual garment-${product.kind}`} style={{ '--city-a': product.club.colours[0], '--city-b': product.club.colours[1] } as CSSProperties}><div className="garment-shape"><span className="garment-label">{city}</span><span className="garment-pattern" /></div><span className="visual-spark">✳</span></div>
}

function formatPrice(ore: number, language: Language) {
  return formatSek(ore, language)
}

function ShopPage({ language, rest, add }: { language: Language; rest: string; add: (product: Product, size: string) => void }) {
  const { t } = useTranslation(['shop', 'common'])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [size, setSize] = useState('M')
  const product = products.find((item) => item.id === rest)
  const club = clubs.find((item) => item.slug === rest)
  const listed = products.filter((item) => (!club || item.club.slug === club.slug) && (category === 'all' || item.category === category) && (language === 'sv' ? item.name_sv : item.name_en).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  if (product) return <main className="wrap inner-page"><Link className="back-link" to={href(language, 'shop', product.club.slug)}><ArrowLeft size={15} /> {language === 'sv' ? product.club.city_sv : product.club.city_en}</Link><div className="product-detail"><ProductVisual product={product} /><div><span className="eyebrow">{language === 'sv' ? product.club.city_sv : product.club.city_en}</span><h1>{language === 'sv' ? product.name_sv : product.name_en}</h1><strong className="price">{formatPrice(product.price_sek, language)}</strong><p>{t('shop:unofficial')}</p><label className="field-label">{t('shop:sizes')}<select value={size} onChange={(event) => setSize(event.target.value)}>{['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Kids 6-8'].map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button-dark" onClick={() => add(product, size)}>{t('shop:add')} <ShoppingBag size={16} /></button></div></div></main>
  return <main className="wrap inner-page"><PageHeader title={club ? (language === 'sv' ? club.city_sv : club.city_en) : t('shop:title')} intro={t('shop:intro')} /><div className="notice notice-blue"><span className="notice-mark">✳</span><p>{t('shop:unofficial')}</p></div><div className="shop-controls"><label className="search-control"><span className="sr-only">{t('shop:search')}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('shop:search')} /></label><label className="select-control"><span className="sr-only">{t('shop:category')}</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">{t('shop:all')}</option><option value="clothing">{t('shop:clothing')}</option><option value="accessories">{t('shop:accessories')}</option><option value="kids">{t('shop:kids')}</option></select><ChevronDown size={15} /></label></div><div className="product-grid">{listed.slice(0, 48).map((item) => <article className="product-card" key={item.id}><Link to={href(language, 'shop', item.id)}><ProductVisual product={item} /><div className="product-copy"><span>{language === 'sv' ? item.club.city_sv : item.club.city_en}</span><h2>{language === 'sv' ? item.name_sv : item.name_en}</h2><strong>{formatPrice(item.price_sek, language)}</strong></div></Link><button className="add-icon" aria-label={`${t('shop:add')}: ${item.name_sv}`} onClick={() => add(item, 'M')}><Plus size={17} /></button></article>)}</div></main>
}

function CartDrawer({ language, cart, close, remove, update }: { language: Language; cart: CartLine[]; close: () => void; remove: (id: string, size: string) => void; update: (id: string, size: string, quantity: number) => void }) {
  const { t } = useTranslation('shop')
  const lines = cart.map((line) => ({ ...line, product: products.find((item) => item.id === line.id) })).filter((line): line is CartLine & { product: Product } => Boolean(line.product))
  const total = lines.reduce((sum, line) => sum + line.product.price_sek * line.quantity, 0)
  return <div className="drawer-backdrop" onClick={close}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label={t('cart')} onClick={(event) => event.stopPropagation()}><div className="drawer-head"><h2>{t('cart')}</h2><button className="icon-button" onClick={close} aria-label={t('close')}><X size={19} /></button></div>{lines.length === 0 ? <p className="cart-empty">{t('empty')}</p> : <><div className="cart-lines">{lines.map((line) => <div className="cart-line" key={`${line.id}-${line.size}`}><ProductVisual product={line.product} /><div className="cart-line-copy"><strong>{language === 'sv' ? line.product.name_sv : line.product.name_en}</strong><span>{t('sizes')}: {line.size}</span><span>{formatPrice(line.product.price_sek * line.quantity, language)}</span><div className="quantity-control"><button onClick={() => update(line.id, line.size, line.quantity - 1)} aria-label="Decrease quantity">−</button><span>{line.quantity}</span><button onClick={() => update(line.id, line.size, line.quantity + 1)} aria-label="Increase quantity">+</button><button className="remove-link" onClick={() => remove(line.id, line.size)}>{t('remove')}</button></div></div></div>)}</div><div className="cart-total"><span>{t('subtotal')}</span><strong>{formatPrice(total, language)}</strong></div><p className="small-muted">{t('secure')}</p><button className="button button-dark checkout-button" disabled title={t('unavailable')}>{t('checkout')} <ArrowRight size={16} /></button><span className="small-muted">{t('unavailable')}</span></>}</aside></div>
}

function AuthPage({ language, type }: { language: Language; type: 'login' | 'signup' | 'reset' }) {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(() => type === 'reset' && new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery')
  const [resetComplete, setResetComplete] = useState(false)
  const [messageIsError, setMessageIsError] = useState(false)
  const title = type === 'signup' ? t('signupTitle') : type === 'reset' ? (recoveryMode ? t('resetPassword') : t('reset')) : t('loginTitle')
  const intro = type !== 'reset' ? t('intro') : recoveryMode ? t('recoveryIntro') : t('resetIntro')

  useEffect(() => {
    if (type !== 'reset' || !supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })
    return () => subscription.unsubscribe()
  }, [type])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) { setMessage(t('needsSetup')); setMessageIsError(true); return }
    setBusy(true)
    setMessage('')
    setMessageIsError(false)
    try {
      if (type === 'reset' && recoveryMode) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setResetComplete(true)
        setMessage(t('passwordUpdated'))
        return
      }

      const result = type === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${href(language, 'profile')}`, data: { language } } })
        : type === 'reset'
          ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${href(language, 'reset')}` })
          : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      if (type === 'login') navigate(href(language, 'profile'))
      else setMessage(type === 'signup' ? t('confirmation') : t('emailSent'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('requestFailed'))
      setMessageIsError(true)
    } finally {
      setBusy(false)
    }
  }
  const sendMagicLink = async () => {
    if (!supabase) { setMessage(t('needsSetup')); setMessageIsError(true); return }
    if (!email.trim()) { setMessage(t('emailRequired')); setMessageIsError(true); return }
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}${href(language, 'profile')}` } })
      if (error) throw error
      setMessage(t('emailSent'))
      setMessageIsError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('requestFailed'))
      setMessageIsError(true)
    } finally {
      setBusy(false)
    }
  }
  const signInWithGoogle = async () => {
    if (!supabase) { setMessage(t('needsSetup')); setMessageIsError(true); return }
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${href(language, 'profile')}` } })
      if (error) throw error
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('requestFailed'))
      setMessageIsError(true)
      setBusy(false)
    }
  }
  return <main className="wrap inner-page"><div className="auth-panel"><CircleUserRound size={36} /><PageHeader title={title} intro={intro} />{!isSupabaseConfigured && <div className="notice notice-warm"><span className="notice-mark">!</span><p>{t('needsSetup')}</p></div>}{!resetComplete && <form className="auth-form" onSubmit={submit}>{!(type === 'reset' && recoveryMode) && <label className="field-label">{t('email')}<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>}{(type !== 'reset' || recoveryMode) && <label className="field-label">{recoveryMode ? t('newPassword') : t('password')}<input type="password" autoComplete={type === 'signup' || recoveryMode ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}<button className="button button-dark" type="submit" disabled={busy || !isSupabaseConfigured}>{busy ? t('working') : type === 'signup' ? t('signup') : type === 'reset' ? recoveryMode ? t('savePassword') : t('reset') : t('login')} <ArrowRight size={16} /></button></form>}{type === 'login' && <div className="auth-alternatives"><button className="text-link" disabled={busy || !isSupabaseConfigured} onClick={sendMagicLink}>{t('magic')}</button><button className="text-link" disabled={busy || !isSupabaseConfigured} onClick={signInWithGoogle}>{t('google')}</button><Link className="text-link" to={href(language, 'reset')}>{t('reset')}</Link></div>}{message && <p className="auth-message" role={messageIsError ? 'alert' : 'status'}>{message}</p>}<Link className="text-link" to={href(language, type === 'login' ? 'signup' : 'login')}>{type === 'login' ? t('signup') : t('login')}</Link></div></main>
}

function HistoryPage() {
  const { t } = useTranslation('history')
  return <main className="wrap inner-page"><PageHeader title={t('history:title')} intro={t('history:intro')} /><div className="notice notice-warm"><span className="notice-mark">!</span><div><strong>{t('history:pending')}</strong><p>{t('history:source')}</p></div></div><div className="timeline"><div className="timeline-line" />{['Founding and early years', 'Rise of the dominant clubs', 'European success', 'Professionalisation', 'Recent seasons'].map((title, index) => <div className={`timeline-item timeline-item-${index}`} key={title}><span className="timeline-dot">{index + 1}</span><div><span className="eyebrow">{t('history:source')}</span><h2>{title}</h2><p>{t('history:pending')}</p></div></div>)}</div><div className="table-wrap"><h2>{t('history:champions')}</h2><p>{t('history:pending')}</p><table><thead><tr><th>{t('history:year')}</th><th>{t('history:champion')}</th><th>{t('history:runnerUp')}</th></tr></thead><tbody><tr><td colSpan={3}>{t('history:source')}</td></tr></tbody></table></div></main>
}

function SimplePage({ page }: { page: PageKey }) {
  const { t } = useTranslation(['common', 'auth', 'terms'])
  const title = page === 'profile' ? t('auth:profile') : page === 'admin' ? 'Admin' : page === 'privacy' ? t('terms:privacy') : page === 'terms' ? t('terms:title') : t('terms:shipping')
  const text = page === 'admin' ? t('auth:needsSetup') : t('terms:review')
  return <main className="wrap inner-page"><PageHeader title={title} intro={text} /><div className="notice notice-warm"><span className="notice-mark">!</span><p>{text}</p></div></main>
}

type ProfileRow = { display_name: string | null; language: Language; favourite_club_id: string | null }
type ClubOption = { id: string; slug: string; city_sv: string; city_en: string }
type OrderRow = { id: string; status: string; total_sek: number; created_at: string }

function ProfilePage({ language }: { language: Language }) {
  const { t } = useTranslation(['auth', 'common'])
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<ProfileRow>({ display_name: '', language, favourite_club_id: null })
  const [clubOptions, setClubOptions] = useState<ClubOption[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)
  const [ready, setReady] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!supabase) { setReady(true); return }
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!active) return
        setUserId(user?.id ?? '')
        if (!user) return
        const [profileResult, clubsResult, ordersResult] = await Promise.all([
          supabase.from('profiles').select('display_name, language, favourite_club_id').eq('id', user.id).maybeSingle(),
          supabase.from('clubs').select('id, slug, city_sv, city_en').order('city_sv'),
          supabase.from('orders').select('id, status, total_sek, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        ])
        if (!active) return
        const loadError = profileResult.error ?? clubsResult.error ?? ordersResult.error
        if (loadError) throw loadError
        if (profileResult.data) setProfile(profileResult.data as ProfileRow)
        setClubOptions((clubsResult.data ?? []) as ClubOption[])
        setOrders((ordersResult.data ?? []) as OrderRow[])
        setProfileLoaded(true)
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : t('auth:requestFailed'))
          setMessageIsError(true)
        }
      } finally {
        if (active) setReady(true)
      }
    }
    void load()
    return () => { active = false }
  }, [t])
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !userId) return
    try {
      const { error } = await supabase.from('profiles').update(profile).eq('id', userId)
      if (error) throw error
      setMessage(t('auth:profileSaved'))
      setMessageIsError(false)
      localStorage.setItem('sidlinjen-language', profile.language)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('auth:requestFailed'))
      setMessageIsError(true)
    }
  }
  const logout = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) {
      setMessage(error.message)
      setMessageIsError(true)
      return
    }
    setMessage('')
    setMessageIsError(false)
    setUserId('')
  }
  if (!isSupabaseConfigured) return <main className="wrap inner-page"><PageHeader title={t('auth:profile')} intro={t('auth:needsSetup')} /><div className="notice notice-warm"><span className="notice-mark">!</span><p>{t('auth:needsSetup')}</p></div></main>
  if (!ready) return <main className="wrap inner-page"><PageHeader title={t('auth:profile')} intro={t('common:generic.loading')} /></main>
  if (!userId) return <main className="wrap inner-page"><PageHeader title={t('auth:profile')} intro={t('auth:loginRequired')} />{message && <p role="alert">{message}</p>}<Link className="button button-dark" to={href(language, 'login')}>{t('auth:login')} <ArrowRight size={16} /></Link></main>
  if (!profileLoaded) return <main className="wrap inner-page"><PageHeader title={t('auth:profile')} intro={t('auth:requestFailed')} /><div className="notice notice-warm" role="alert"><span className="notice-mark">!</span><p>{message || t('auth:requestFailed')}</p></div></main>
  return <main className="wrap inner-page"><PageHeader title={t('auth:profile')} intro={t('auth:intro')} />{message && <p role={messageIsError ? 'alert' : 'status'}>{message}</p>}<form className="profile-form" onSubmit={save}><label className="field-label">{t('auth:displayName')}<input value={profile.display_name ?? ''} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} /></label><label className="field-label">{t('auth:favourite')}<select value={profile.favourite_club_id ?? ''} onChange={(event) => setProfile({ ...profile, favourite_club_id: event.target.value || null })}><option value="">{t('clubs:all')}</option>{clubOptions.map((club) => <option value={club.id} key={club.id}>{language === 'sv' ? club.city_sv : club.city_en}</option>)}</select></label><div className="field-label"><span>{t('common:switchLanguage')}</span><div className="segmented"><button type="button" className={profile.language === 'sv' ? 'selected' : ''} onClick={() => setProfile({ ...profile, language: 'sv' })}>SV</button><button type="button" className={profile.language === 'en' ? 'selected' : ''} onClick={() => setProfile({ ...profile, language: 'en' })}>EN</button></div></div><button className="button button-dark" type="submit">{t('auth:save')} <Check size={16} /></button><button type="button" className="text-link logout-link" onClick={logout}>{t('auth:logout')}</button></form><section className="orders-section"><h2>{t('auth:orders')}</h2>{orders.length === 0 ? <p>{t('auth:noOrders')}</p> : orders.map((order) => <div className="order-row" key={order.id}><span>{new Intl.DateTimeFormat(language === 'sv' ? 'sv-SE' : 'en-GB').format(new Date(order.created_at))}</span><span>{order.status}</span><strong>{formatPrice(order.total_sek, language)}</strong></div>)}</section></main>
}

function AdminPage() {
  const { t } = useTranslation(['auth', 'common'])
  const [allowed, setAllowed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [section, setSection] = useState('news')
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    let active = true
    const verify = async () => {
      if (!supabase) { setChecked(true); return }
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) return
        const { data, error } = await supabase.rpc('is_admin')
        if (error) throw error
        if (active) setAllowed(data === true)
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : t('auth:requestFailed'))
      } finally {
        if (active) setChecked(true)
      }
    }
    void verify()
    return () => { active = false }
  }, [t])
  if (!isSupabaseConfigured) return <main className="wrap inner-page"><PageHeader title={t('common:admin.title')} intro={t('auth:adminSetup')} /></main>
  if (!checked) return <main className="wrap inner-page"><PageHeader title={t('common:admin.title')} intro={t('common:generic.loading')} /></main>
  if (errorMessage) return <main className="wrap inner-page"><PageHeader title={t('common:admin.title')} intro={t('auth:adminSetup')} /><div className="notice notice-warm" role="alert"><span className="notice-mark">!</span><p>{errorMessage}</p></div></main>
  if (!allowed) return <main className="wrap inner-page"><PageHeader title={t('common:admin.title')} intro={t('auth:adminOnly')} /><div className="notice notice-warm"><span className="notice-mark">!</span><p>{t('auth:adminOnly')}</p></div></main>
  const sections = ['news', 'quiz', 'players', 'history', 'clubs', 'products', 'orders', 'sync']
  return <main className="wrap inner-page"><PageHeader title={t('common:admin.title')} intro={t('common:admin.empty')} /><div className="admin-layout"><nav className="admin-sidebar" aria-label={t('common:admin.title')}>{sections.map((item) => <button className={section === item ? 'selected' : ''} key={item} onClick={() => setSection(item)}>{t(`common:admin.${item}`)}</button>)}</nav><section className="admin-content"><h2>{t(`common:admin.${section}`)}</h2><p>{t('common:admin.empty')}</p></section></div></main>
}

function StyleguidePage() {
  const { t } = useTranslation('common')
  return <main className="wrap inner-page"><PageHeader title={t('styleguide:title')} intro={t('styleguide:intro')} /><div className="style-swatches"><div>Solgul</div><div>Himmelsblå</div><div>Bläck</div><div>Korall</div></div><div className="style-buttons"><button className="button button-dark">{t('generic.save')}</button><button className="button button-light">{t('generic.cancel')}</button><span className="badge-demo">{t('generic.unverified')}</span></div><div className="style-grid">{clubs.slice(0, 4).map((club) => <Pattern key={club.slug} club={club} />)}</div></main>
}

function Site({ language }: { language: Language }) {
  const location = useLocation()
  const navigate = useNavigate()
  const page = useMemo(() => parsePage(location.pathname, language), [location.pathname, language])
  const { t } = useTranslation('common')
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem('sidlinjen-cart') ?? '[]') as CartLine[] } catch { return [] } })
  useEffect(() => { void i18n.changeLanguage(language); localStorage.setItem('sidlinjen-language', language) }, [language])
  useEffect(() => { localStorage.setItem('sidlinjen-cart', JSON.stringify(cart)) }, [cart])
  const add = (product: Product, size: string) => setCart((items) => {
    const same = items.find((item) => item.id === product.id && item.size === size)
    return same ? items.map((item) => item === same ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { id: product.id, quantity: 1, size }]
  })
  const remove = (id: string, size: string) => setCart((items) => items.filter((item) => item.id !== id || item.size !== size))
  const update = (id: string, size: string, quantity: number) => quantity <= 0 ? remove(id, size) : setCart((items) => items.map((item) => item.id === id && item.size === size ? { ...item, quantity: Math.min(quantity, 10) } : item))
  const switchLanguage = language === 'sv' ? 'en' : 'sv'
  const navKeys: PageKey[] = ['news', 'matches', 'clubs', 'history', 'players', 'games', 'shop']
  const activeClub = clubs.find((club) => club.slug === page.rest)
  const activeProduct = products.find((product) => product.id === page.rest)
  const activeStory = stories.find((story) => story.slug === page.rest)
  const seoTitle = page.key === 'news' && activeStory ? (language === 'sv' ? activeStory.title_sv : activeStory.title_en)
    : page.key === 'clubs' && activeClub ? (language === 'sv' ? activeClub.city_sv : activeClub.city_en)
      : page.key === 'shop' && activeProduct ? (language === 'sv' ? activeProduct.name_sv : activeProduct.name_en)
        : page.key === 'home' ? t('brand')
          : page.key === 'login' ? t('auth:loginTitle')
            : page.key === 'signup' ? t('auth:signupTitle')
              : page.key === 'reset' ? t('auth:reset')
                : page.key === 'profile' ? t('auth:profile')
                  : page.key === 'styleguide' ? t('styleguide:title')
                    : page.key === 'admin' ? t('admin:title')
                      : page.key === 'privacy' ? t('terms:privacy')
                        : page.key === 'terms' ? t('terms:title')
                          : page.key === 'shipping' ? t('terms:shipping')
                            : t(`${page.key}:title`)
  const seoDescription = page.key === 'home' ? t('home.intro')
    : page.key === 'news' ? t('news:intro')
      : page.key === 'matches' ? t('matches:intro')
        : page.key === 'clubs' ? t('clubs:intro')
          : page.key === 'history' ? t('history:intro')
            : page.key === 'players' ? t('players:intro')
              : page.key === 'games' ? t('games:intro')
                : page.key === 'shop' ? t('shop:intro') : t('footerNote')
  const canonical = `${window.location.origin}${href(language, page.key, page.rest)}`
  let content: ReactNode
  switch (page.key) {
    case 'home': content = <HomePage language={language} />; break
    case 'news': content = <NewsPage language={language} rest={page.rest} />; break
    case 'matches': content = <MatchesPage />; break
    case 'clubs': content = <ClubsPage language={language} rest={page.rest} />; break
    case 'history': content = <HistoryPage />; break
    case 'players': content = <PlayersPage />; break
    case 'games': content = <GamesPage language={language} />; break
    case 'shop': content = <ShopPage language={language} rest={page.rest} add={add} />; break
    case 'login': content = <AuthPage language={language} type="login" />; break
    case 'signup': content = <AuthPage language={language} type="signup" />; break
    case 'reset': content = <AuthPage language={language} type="reset" />; break
    case 'profile': content = <ProfilePage language={language} />; break
    case 'admin': content = <AdminPage />; break
    case 'styleguide': content = <StyleguidePage />; break
    default: content = <SimplePage page={page.key} />
  }
  return <div className="app-shell"><Helmet><html lang={language} /><title>{seoTitle} | Sidlinjen</title><meta name="description" content={seoDescription} /><link rel="canonical" href={canonical} /><link rel="alternate" hrefLang="sv" href={`${window.location.origin}${href('sv', page.key, page.rest)}`} /><link rel="alternate" hrefLang="en" href={`${window.location.origin}${href('en', page.key, page.rest)}`} /><meta property="og:title" content={`${seoTitle} | Sidlinjen`} /><meta property="og:description" content={seoDescription} /><meta property="og:type" content="website" /><meta property="og:url" content={canonical} /></Helmet><header className="site-header"><div className="header-inner wrap"><Link to={href(language, 'home')} className="brand" aria-label={`${t('brand')} - ${t('backHome')}`}><span className="brand-mark">S<span>!</span></span><span className="brand-name">{t('brand')}<small>{t('tagline')}</small></span></Link><nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label={language === 'sv' ? 'Huvudmeny' : 'Main navigation'}>{navKeys.map((key) => <Link className={page.key === key ? 'active' : ''} key={key} to={href(language, key)} onClick={() => setMenuOpen(false)}>{t(`nav.${key}`)}</Link>)}</nav><div className="header-tools"><button className="language-switch" onClick={() => { localStorage.setItem('sidlinjen-language', switchLanguage); void i18n.changeLanguage(switchLanguage); navigate(href(switchLanguage, page.key, page.rest)) }} aria-label={t('switchLanguage')}>{language === 'sv' ? 'SV / EN' : 'EN / SV'}</button><button className="icon-button cart-button" onClick={() => setCartOpen(true)} aria-label={`${t('shop:cart')} (${cart.reduce((sum, item) => sum + item.quantity, 0)})`}><ShoppingBag size={19} /></button><Link className="login-link" to={href(language, 'login')}>{t('login')}</Link><button className="icon-button menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div></div></header>{content}<footer className="site-footer"><div className="wrap footer-inner"><Link to={href(language, 'home')} className="footer-brand">{t('brand')}<span>✳</span></Link><p>{t('footerNote')}</p><div><Link to={href(language, 'privacy')}>{t('footerPrivacy')}</Link><Link to={href(language, 'terms')}>{t('terms:title')}</Link><span>© 2026 Sidlinjen</span></div></div></footer>{cartOpen && <CartDrawer language={language} cart={cart} close={() => setCartOpen(false)} remove={remove} update={update} />}</div>
}

function ThemeToggle() {
  const { t } = useTranslation('common')
  const [dark, setDark] = useState(() => localStorage.getItem('sidlinjen-theme') === 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('sidlinjen-theme', dark ? 'dark' : 'light')
  }, [dark])
  return <button className="theme-toggle" onClick={() => setDark((value) => !value)} aria-label={dark ? t('lightMode') : t('darkMode')} title={dark ? t('lightMode') : t('darkMode')}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
}

export default function FanHub() {
  return <><ThemeToggle /><Routes><Route path="/" element={<LanguageRedirect />} /><Route path="/sv/*" element={<Site language="sv" />} /><Route path="/en/*" element={<Site language="en" />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></>
}