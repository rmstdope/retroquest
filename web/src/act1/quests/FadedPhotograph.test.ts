import { describe, it, expect } from 'vitest'
import { FadedPhotographQuest } from './FadedPhotograph'

const OPENING =
  'An old photograph of your parents, hidden away in a drawer. ' +
  "On the back is a line in your mother's hand."

describe('The Faded Photograph quest', () => {
  it('opens with what was found, not what to do next', () => {
    const quest = new FadedPhotographQuest()
    expect(quest.description).toBe(OPENING)
    expect(quest.description).not.toMatch(/river|grandmother|read the/i)
    expect(quest.description).not.toMatch(/somewhere in the cottage/i)
  })

  it('keeps its name and completion line', () => {
    const quest = new FadedPhotographQuest()
    expect(quest.name).toBe('The Faded Photograph')
    expect(quest.completion).toContain('At the river bend you found')
  })
})
