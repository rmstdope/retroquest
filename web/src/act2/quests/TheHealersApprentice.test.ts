import { describe, it, expect } from 'vitest'
import { TheHealersApprenticeQuest } from './TheHealersApprentice'

describe("The Healer's Apprentice texts", () => {
  it('describes the bed and the missing focus', () => {
    const quest = new TheHealersApprenticeQuest()

    expect(quest.description).toContain("dying carter's bed")
    expect(quest.description).toContain('Crystal Focus')
    expect(quest.completion).toContain('He will live.')
  })
})
