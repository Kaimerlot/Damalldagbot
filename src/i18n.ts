import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonSv from './locales/sv/common.json'
import commonEn from './locales/en/common.json'
import newsSv from './locales/sv/news.json'
import newsEn from './locales/en/news.json'
import matchesSv from './locales/sv/matches.json'
import matchesEn from './locales/en/matches.json'
import clubsSv from './locales/sv/clubs.json'
import clubsEn from './locales/en/clubs.json'
import historySv from './locales/sv/history.json'
import historyEn from './locales/en/history.json'
import gamesSv from './locales/sv/games.json'
import gamesEn from './locales/en/games.json'
import shopSv from './locales/sv/shop.json'
import shopEn from './locales/en/shop.json'
import authSv from './locales/sv/auth.json'
import authEn from './locales/en/auth.json'
import playersSv from './locales/sv/players.json'
import playersEn from './locales/en/players.json'
import termsSv from './locales/sv/terms.json'
import termsEn from './locales/en/terms.json'

const resources = {
  sv: { common: commonSv, news: newsSv, matches: matchesSv, clubs: clubsSv, history: historySv, games: gamesSv, shop: shopSv, auth: authSv, players: playersSv, terms: termsSv },
  en: { common: commonEn, news: newsEn, matches: matchesEn, clubs: clubsEn, history: historyEn, games: gamesEn, shop: shopEn, auth: authEn, players: playersEn, terms: termsEn },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: window.location.pathname.startsWith('/en') ? 'en' : 'sv',
  fallbackLng: 'sv',
  defaultNS: 'common',
  ns: ['common', 'news', 'matches', 'clubs', 'history', 'games', 'shop', 'auth', 'players', 'terms'],
  interpolation: { escapeValue: false },
})

export default i18n