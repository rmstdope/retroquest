import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED,
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
} from '../Act4StoryFlags'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
  expectStoryFlag,
} from '@/testing/gameHelpers'
import { ThroneChamer } from './ThroneChamer'

const FIRST_DESCRIPTION =
  'A vast chamber under a broken dome. A throne of black stone, twisted like a root, stands at its head. Above a ritual circle King Alden hangs in a prison of crystal, and from him a thin thread of light bleeds into a rift in the air: the wound in time. Malakar stands beside it, grey and failing. The wound is killing him too.'
const AMULET_DESCRIPTION =
  'The light of the ward fills the chamber from the open amulet. King Alden hangs in his crystal prison, the wound bleeds in the air beside him, and Malakar waits on his knees between them. The Lifelight Elixir is warm in your hand.'
const HEALED_DESCRIPTION =
  'Malakar sits by the wound, the grey gone from his face, watching it with the eyes of the young man at the workbench. The wound still flickers in the air. King Alden hangs in his prison, waiting.'
const SHATTERED_DESCRIPTION =
  'The crystal lies in shards around the ritual circle. King Alden sits among them, weak but alive. The wound still stands open, and Malakar stands beside it, greyer than before.'

/** The golden path as far as the parents' memories. */
const TO_PARENTS_VAULT = ACT4_GOLDEN_PATH.slice(
  0,
  ACT4_GOLDEN_PATH.indexOf('examine memories') + 1,
)

/** A game with Elior just inside the Throne Chamber. */
function inThrone(): Game {
  const game = new Game([new Act4()])
  executeCommands(game, [...TO_PARENTS_VAULT, 'n'])
  return game
}

function refrained(): Game {
  const game = inThrone()
  executeCommands(game, ['say refrain to malakar'])
  return game
}

function opened(): Game {
  const game = refrained()
  executeCommands(game, ['use ancient amulet'])
  return game
}

function reload(game: Game): void {
  expect(game.loadSaveData(game.toSaveData())).toContain(
    'Game loaded successfully.',
  )
}

describe('ThroneChamer', () => {
  it('has the correct name and a way back south only', () => {
    const room = new ThroneChamer()
    expect(room.name).toBe('Throne Chamber')
    expect(room.exits).toEqual({ south: 'ParentsVault' })
  })

  it('describes the scene and lets the people and things be examined', () => {
    const game = inThrone()
    expect(game.state.currentRoom.name).toBe('Throne Chamber')
    expect(game.state.currentRoom.description).toBe(FIRST_DESCRIPTION)
    expect(executeCommands(game, ['examine malakar'])).toContain(
      "A tall man in a grey robe that was once a Warden's blue. ",
    )
    expect(executeCommands(game, ['examine prison'])).toContain(
      'The crystal is clouded and cold. Inside it King Alden sleeps without breathing, his crown dark. A thread of light runs from him into the wound.',
    )
    expect(executeCommands(game, ['examine wound'])).toContain(
      'A tear in the air, no wider than a door, its edges flickering with days that never happened. It drinks the light from the king, and from Malakar too.',
    )
    expect(executeCommands(game, ['examine king alden'])).not.toBe('')
  })

  it('carries the elixir and the amulet from the start of the act', () => {
    const game = inThrone()
    expectItemInInventory(game.state, 'Lifelight Elixir')
    expectItemInInventory(game.state, 'Ancient Amulet')
  })

  it('keeps south open in every state', () => {
    for (const make of [inThrone, refrained, opened]) {
      const game = make()
      expect(Object.keys(game.state.currentRoom.getExits(game.state))).toEqual([
        'south',
      ])
    }
  })

  it('asks for the answer first: talk twice, other words, and the failures', () => {
    const game = inThrone()
    const first = executeCommands(game, ['talk to malakar'])
    expectDialogueSpeaker(first, 'Malakar')
    expect(first).toContain("Aren's son. You have their eyes, both of them.")
    expect(first).toContain('Stand with me. Please.')
    expect(executeCommands(game, ['talk to malakar'])).toContain(
      'Please, Elior. The amulet, and they come home.',
    )
    expect(executeCommands(game, ['say hello to malakar'])).toContain(
      'Malakar only waits for your answer.',
    )
    expect(executeCommands(game, ['use ancient amulet'])).toContain(
      'The amulet is cold. Malakar is still waiting for your answer.',
    )
    for (const target of ['malakar', 'wound', 'prison']) {
      expect(
        executeCommands(game, [`use lifelight elixir on ${target}`]),
      ).toContain('Not yet. Malakar is still waiting for your answer.')
    }
    expectItemInInventory(game.state, 'Lifelight Elixir')
  })

  it('plays the refrain once', () => {
    const game = inThrone()
    const text = executeCommands(game, ['say refrain to malakar'])
    expect(text).toContain(
      "“Power follows purpose; purpose follows truth,” you say. The words from the stone in Willowbrook, from Nyx, from the Dragon's hall. They are yours now.",
    )
    expectDialogueSpeaker(text, 'Malakar')
    expect(text).toContain(
      'We carved those words together, your father and I. I had forgotten them.',
    )
    expectStoryFlag(game.state, FLAG_ACT4_THRONE_REFRAIN_SAID, true)
    expect(executeCommands(game, ['talk to malakar'])).toContain(
      'Then show me what they left you.',
    )
    expect(executeCommands(game, ['say refrain to malakar'])).toContain(
      'You have said it. Malakar heard.',
    )
    expect(
      executeCommands(game, ['use lifelight elixir on malakar']),
    ).toContain('Not yet. The amulet at your chest is stirring.')
  })

  it('opens the amulet once, with the voice and the named choice', () => {
    for (const command of [
      'use ancient amulet',
      'use ancient amulet on malakar',
    ]) {
      const game = refrained()
      const text = executeCommands(game, [command])
      expect(text).toContain(
        'You raise the amulet. It opens in your hand like a flower, and the light of the ward pours out over the chamber. Malakar staggers. When he speaks again, it is not his voice.',
      )
      expectDialogueSpeaker(text, 'Shadow of the Past')
      expect(text).toContain(
        'Elior. I tore the world to keep them, and I lost them anyway. Finish what I could not.',
      )
      expect(text).toContain(
        'The Lifelight Elixir is warm in your hand. It can be used only once. It could break the crystal and free the king, or it could be offered to Malakar, to heal the wound that is killing him.',
      )
      expectStoryFlag(game.state, FLAG_ACT4_THRONE_AMULET_OPENED, true)
      expect(game.state.currentRoom.description).toBe(AMULET_DESCRIPTION)
      expect(executeCommands(game, ['use ancient amulet'])).toContain(
        'The amulet is already open, its light filling the chamber.',
      )
      expect(executeCommands(game, ['talk to malakar'])).toContain(
        'Malakar does not answer. He is staring at the open amulet.',
      )
      expect(
        executeCommands(game, ['use lifelight elixir on king alden']),
      ).toContain(
        "The elixir is for the king's prison, or for Malakar's wound.",
      )
    }
  })

  it('refuses the amulet on the wound in every state', () => {
    const NOT_YET =
      'Not yet. The wound is not yours to close while Malakar still waits for you.'
    for (const make of [inThrone, refrained, opened]) {
      expect(
        executeCommands(make(), ['use ancient amulet on wound']),
      ).toContain(NOT_YET)
    }
  })

  for (const command of [
    'use lifelight elixir on malakar',
    'use lifelight elixir on wound',
    'give lifelight elixir to malakar',
  ]) {
    it(`heals Malakar with "${command}"`, () => {
      const game = opened()
      const text = executeCommands(game, [command])
      expect(text).toContain(
        "You kneel and hold the elixir to Malakar's lips. He drinks. The grey goes out of his face, and for a moment he is the young man at the workbench again. The wound flickers, and waits.",
      )
      expect(text).toContain('The Lifelight Elixir is gone.')
      expectItemInInventory(game.state, 'Lifelight Elixir', false)
      expectStoryFlag(game.state, FLAG_ACT4_ELIXIR_ON_MALAKAR, true)
      expectStoryFlag(game.state, FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED, true)
      expect(game.state.currentRoom.description).toBe(HEALED_DESCRIPTION)
      expect(executeCommands(game, ['talk to malakar'])).toContain(
        'It does not hurt. For the first time in years, it does not hurt.',
      )
      expect(executeCommands(game, ['talk to king alden'])).not.toContain(
        'You came for me.',
      )
      reload(game)
      expect(game.state.currentRoom.description).toBe(HEALED_DESCRIPTION)
      expectItemInInventory(game.state, 'Lifelight Elixir', false)
      expect(executeCommands(game, ['talk to malakar'])).toContain(
        'It does not hurt.',
      )
    })
  }

  it('breaks the prison and frees the king', () => {
    const game = opened()
    const text = executeCommands(game, ['use lifelight elixir on prison'])
    expect(text).toContain(
      'You pour the elixir over the crystal. It cracks like ice in spring, and King Alden falls free, gasping, alive. But the wound still stands open, and Malakar still stands beside it.',
    )
    expect(text).toContain('The Lifelight Elixir is gone.')
    expectItemInInventory(game.state, 'Lifelight Elixir', false)
    expectStoryFlag(game.state, FLAG_ACT4_ELIXIR_ON_KING, true)
    expect(game.state.currentRoom.description).toBe(SHATTERED_DESCRIPTION)
    const king = executeCommands(game, ['talk to king alden'])
    expectDialogueSpeaker(king, 'King Alden')
    expect(king).toContain('You came for me. Whoever you are, you came.')
    const malakar = executeCommands(game, ['talk to malakar'])
    expectDialogueSpeaker(malakar, 'Malakar')
    expect(malakar).toContain(
      'You chose the king. Of course you did. So would they.',
    )
    reload(game)
    expect(game.state.currentRoom.description).toBe(SHATTERED_DESCRIPTION)
    expect(executeCommands(game, ['talk to king alden'])).toContain(
      'You came for me.',
    )
    expect(
      executeCommands(game, ['use lifelight elixir on malakar']),
    ).toContain("You don't have")
  })

  it('shows the current description on coming back and replays nothing', () => {
    const game = opened()
    executeCommands(game, ['s', 'n'])
    expect(game.state.currentRoom.name).toBe('Throne Chamber')
    expect(game.state.currentRoom.description).toBe(AMULET_DESCRIPTION)
    reload(game)
    expect(executeCommands(game, ['use ancient amulet'])).toContain(
      'already open',
    )
  })
})
