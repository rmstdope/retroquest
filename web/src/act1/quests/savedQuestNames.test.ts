import { describe, it, expect } from 'vitest'
import { Game, Quest } from '@/engine'
import { Act1 } from '../Act1'
import { FadedPhotographQuest } from './FadedPhotograph'
import { HintOfMagicQuest } from './HintOfMagic'
import { ShadowsOverWillowbrookQuest } from './ShadowsOverWillowbrook'

/** The title-case names and completion lines that older saves carry. */
const OLD_NAMES: [() => Quest, string][] = [
  [() => new HintOfMagicQuest(), 'Hint of Magic'],
  [() => new FadedPhotographQuest(), 'The Faded Photograph'],
  [() => new ShadowsOverWillowbrookQuest(), 'Shadows Over Willowbrook'],
]

describe('quests loaded from a save made with the title-case names', () => {
  it.each(OLD_NAMES)('%# takes the sentence-case name back', (make, old) => {
    const game = new Game([new Act1()])
    const quest = make()
    const fresh = make()
    quest.name = old
    quest.completion = `You have completed the quest '${old}'.`
    quest.refreshSavedText(game.state)
    expect(quest.name).toBe(fresh.name)
    expect(quest.completion).toBe(fresh.completion)
    expect(quest.name).not.toBe(old)
  })
})
