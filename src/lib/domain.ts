import type { Language } from '../data'

export function formatSek(priceOre: number, language: Language): string {
  return new Intl.NumberFormat(language === 'sv' ? 'sv-SE' : 'en-GB', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(priceOre / 100)
}

export function calculateQuizScore(difficulty: 'easy' | 'medium' | 'hard', elapsedMs: number, streak: number, usedHint = false): number {
  const basePoints = { easy: 100, medium: 150, hard: 200 }[difficulty]
  const elapsed = Math.max(0, Math.min(elapsedMs, 20_000))
  const speedBonus = Math.floor((20_000 - elapsed) / 200)
  const streakMultiplier = 1 + Math.max(0, Math.min(streak, 5)) * 0.1
  const points = Math.round((basePoints + speedBonus) * streakMultiplier)
  return usedHint ? Math.floor(points / 2) : points
}

export function pickLocalized<T>(swedish: T | null | undefined, english: T | null | undefined, language: Language): T | undefined {
  const preferred = language === 'sv' ? swedish : english
  return preferred ?? (language === 'sv' ? english : swedish) ?? undefined
}