import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'
import { HealSpell } from '../spells/HealSpell'

const QUEST = 'Fishing expedition'

describe('Fishing expedition', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.Riverbank
    game.state.learnSpell(new HealSpell())
  })

  /** The active quest's log as the hint and the quest log read it. */
  function quest(): { description: string; hint: string | null } {
    const found = game.state.activatedQuests.find((q) => q.name === QUEST)
    if (!found) throw new Error(`${QUEST} is not active`)
    return { description: found.description, hint: found.hint(game.state) }
  }

  it('tells of his stiff arm before it is healed', () => {
    executeCommands(game, ['talk to fisherman'])
    expect(quest().hint).toContain('stiff arm')
  })

  it('stops calling the arm stiff once healed, and still leads to the fish', () => {
    executeCommands(game, ['talk to fisherman', 'cast heal on fisherman'])
    expect(quest().hint).not.toContain('stiff arm')
    expect(quest().hint).toContain('fresh fish')
  })

  it('opens without the stiff arm when it was healed before they talked', () => {
    executeCommands(game, ['cast heal on fisherman', 'talk to fisherman'])
    expect(quest().description).not.toContain('stiff arm')
    expect(quest().hint).toContain('fresh fish')
  })

  it('keeps the healed log through a save and load', () => {
    executeCommands(game, ['talk to fisherman', 'cast heal on fisherman'])
    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())
    const saved = loaded.state.activatedQuests.find((q) => q.name === QUEST)
    expect(saved?.hint(loaded.state)).not.toContain('stiff arm')
  })
})
