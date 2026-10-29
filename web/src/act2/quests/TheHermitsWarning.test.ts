import { describe, it, expect } from 'vitest'
import { TheHermitsWarningQuest } from './TheHermitsWarning'

describe("The Hermit's Warning quest", () => {
  it('tells the player to make camp by the stones first', () => {
    const quest = new TheHermitsWarningQuest()

    expect(quest.description).toContain('make camp by the stones first')
    expect(quest.description).not.toContain('prepare yourself')
    expect(quest.completion).toBe(
      "You spent a night on the forest's doorstep, and she let you. " +
        'The way east is open.',
    )
  })
})
