import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED } from '../Act2StoryFlags'
import { TheForestGuardiansRiddles } from './TheForestGuardiansRiddles'

const NEW_DESCRIPTION =
  'The forest sprites have challenged you to prove your wisdom by solving ' +
  'the riddles of the forest guardians. You must journey east from the ' +
  'Forest Entrance to the Whispering Glade, where ancient spirits will test ' +
  'your understanding of forest ways and natural wisdom.'

const COMPLETION =
  'You have successfully solved the riddles of the forest guardians, ' +
  'proving your wisdom and respect for the natural world. The forest ' +
  'spirits acknowledge your understanding.'

const OLD_DESCRIPTION =
  'The forest sprites have challenged you to prove your wisdom by solving ' +
  'the riddles of the forest guardians. You must journey to the Ancient ' +
  'Grove and beyond to the Whispering Glade, where ancient spirits will ' +
  'test your understanding of forest ways and natural wisdom.'

/** The riddles quest of a game. */
function riddles(game: Game): TheForestGuardiansRiddles {
  const quest = game.state.getQuest("The Forest Guardian's Riddles")
  if (!(quest instanceof TheForestGuardiansRiddles)) throw new Error('no quest')
  return quest
}

describe("The Forest Guardian's Riddles text", () => {
  it('sends the player east from the Forest Entrance', () => {
    const quest = new TheForestGuardiansRiddles()
    expect(quest.description).toBe(NEW_DESCRIPTION)
    expect(quest.description).not.toContain('Ancient Grove')
    expect(quest.description).not.toContain('beyond')
    expect(quest.completion).toBe(COMPLETION)
    expect(quest.name).toBe("The Forest Guardian's Riddles")
  })

  it('shows the new description once the sprites offer the quest', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ForestEntrance
    game.commandParser.parse('talk to forest sprites')
    game.state.settleQuests()
    expect(game.state.activatedQuests).toContain(riddles(game))
    expect(riddles(game).details()).toEqual({
      kind: 'journal',
      latest: NEW_DESCRIPTION,
      earlier: [],
    })
  })
})

describe("The Forest Guardian's Riddles in older saves", () => {
  /** Save a game whose quest holds the old wording, in the given state, and load it. */
  function loadOld(state: 'unoffered' | 'active' | 'completed'): Game {
    const game = new Game([new Act2()])
    if (state !== 'unoffered') {
      game.state.currentRoom = game.state.allRooms.ForestEntrance
      game.commandParser.parse('talk to forest sprites')
      game.state.settleQuests()
    }
    if (state === 'completed') {
      game.state.setStoryFlag(FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED, true)
      game.state.settleQuests()
    }
    riddles(game).description = OLD_DESCRIPTION
    const loaded = new Game([new Act2()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
    return loaded
  }

  it.each(['unoffered', 'active', 'completed'] as const)(
    'reads in the new words when the save is %s',
    (state) => {
      const loaded = loadOld(state)
      const quest = riddles(loaded)
      expect(quest.description).toBe(NEW_DESCRIPTION)
      expect(quest.completion).toBe(COMPLETION)
      expect(quest.details()).toEqual({
        kind: 'journal',
        latest: NEW_DESCRIPTION,
        earlier: [],
      })
      expect(loaded.state.completedQuests.includes(quest)).toBe(
        state === 'completed',
      )
      expect(loaded.state.activatedQuests.includes(quest)).toBe(
        state === 'active',
      )
    },
  )
})
