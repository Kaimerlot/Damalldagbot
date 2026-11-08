import { describe, expect, it } from 'vitest'
import { calculateQuizScore, formatSek, pickLocalized } from './domain'

describe('formatSek', () => {
  it('formats Swedish and English prices from öre', () => {
    expect(formatSek(49900, 'sv')).toContain('499')
    expect(formatSek(49900, 'en')).toContain('499')
    expect(formatSek(49900, 'en')).toContain('SEK')
  })
})

describe('calculateQuizScore', () => {
  it('rewards difficulty, speed and streak while capping elapsed time', () => {
    expect(calculateQuizScore('hard', 0, 2)).toBeGreaterThan(calculateQuizScore('easy', 20_000, 0))
    expect(calculateQuizScore('easy', 30_000, 0)).toBe(calculateQuizScore('easy', 20_000, 0))
  })

  it('halves points after a hint', () => {
    expect(calculateQuizScore('medium', 10_000, 0, true)).toBe(Math.floor(calculateQuizScore('medium', 10_000, 0) / 2))
  })
})

describe('pickLocalized', () => {
  it('falls back to the available language when the preferred value is empty', () => {
    expect(pickLocalized('', 'English copy', 'sv')).toBe('')
    expect(pickLocalized(undefined, 'English copy', 'sv')).toBe('English copy')
    expect(pickLocalized('Svensk text', undefined, 'en')).toBe('Svensk text')
  })
})