import { describe, it, expect } from 'vitest'
import { Game, dialogue } from '@/engine'
import { Act4 } from '../Act4'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED,
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
  VIRTUE_TRUTH,
} from '../Act4StoryFlags'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
  expectStoryFlag,
} from '@/testing/gameHelpers'
import { ThroneChamber } from './ThroneChamber'

const FIRST_DESCRIPTION =
  'A vast chamber under a broken dome. A throne of black stone, twisted like a root, stands at its head. Above a ritual circle King Alden hangs in a prison of crystal, and from his crown a thin thread of light bleeds into a rift in the air: the wound in time. Malakar stands beside it, grey and failing. The wound is killing him too.'
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
  executeCommands(game, ['talk to malakar', 'say refrain to malakar'])
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

function healed(): Game {
  const game = opened()
  executeCommands(game, ['use lifelight elixir on malakar'])
  return game
}

function shattered(): Game {
  const game = opened()
  game.state.addVirtue(VIRTUE_TRUTH)
  game.state.addVirtue(VIRTUE_TRUTH)
  executeCommands(game, ['use lifelight elixir on prison'])
  return game
}

/** The four speech blocks of the first talk, in order. */
const OFFER_BLOCKS = [
  "Aren's son. You have their eyes, both of them. You have seen the vault, so you know what I did, and you know it worked. They woke, Elior. For a little while, they woke.",
  'The wound runs backwards. Open it all the way and it pulls the days back to before the fever, and they wake at the workbench as they were. I am not lying to you. I have done the sums.',
  "Only the ward holds it shut: half in your amulet, half in Alden's crown. I have been bleeding the king for years to loosen his half. Give me yours and he can stop dying today.",
  'And the price is the rest of it. The king. Every year the kingdom has had since. And you. You were born after the tear, Elior. When the days go back, you go with them. I am sorry. The sums are still right.',
]

/** The sharper plea on every later talk before the refrain. */
const PLEA =
  'They would wake, Elior. Your mother would laugh at something your father said. Is one boy and one tired king too much to pay for that? Give me the amulet.'

describe('Malakar and the turned back', () => {
  it('looks at the wound, not at Elior, until the refrain turns him', () => {
    const game = inThrone()

    const before = executeCommands(game, ['examine malakar'])
    const offer = executeCommands(game, ['talk to malakar'])
    const refrain = executeCommands(game, ['say refrain to malakar'])

    expect(before).toContain('He is looking at the wound, not at you.')
    expect(offer).not.toContain('Malakar turns from the wound.')
    expect(refrain).toContain(
      'Malakar turns from the wound. For the first time since you came in, ' +
        'he is looking at you.',
    )
    expect(executeCommands(game, ['examine malakar'])).not.toContain(
      'not at you',
    )
  })
})

describe('ThroneChamber', () => {
  it('survives a save at every point, and coming back replays nothing', () => {
    for (const make of [inThrone, refrained, opened, healed, shattered]) {
      const game = make()
      const description = game.state.currentRoom.description
      const flags = { ...game.state.storyFlags }
      reload(game)
      expect(game.state.currentRoom.description).toBe(description)
      expect(game.state.storyFlags).toEqual(flags)
      expect(Object.keys(game.state.currentRoom.getExits(game.state))).toEqual([
        'south',
      ])
      executeCommands(game, ['s', 'n'])
      expect(game.state.currentRoom.description).toBe(description)
    }
  })

  it('accepts the full refrain and answers the amulet given to Malakar', () => {
    const game = inThrone()
    expect(executeCommands(game, ['give ancient amulet to malakar'])).toContain(
      'Malakar only waits for your answer.',
    )
    executeCommands(game, ['talk to malakar'])
    const text = executeCommands(game, [
      'say "Power follows purpose; purpose follows truth." to malakar',
    ])
    expect(text).toContain('We carved those words together')
  })

  it('shows the freed king when examined', () => {
    expect(executeCommands(shattered(), ['examine king alden'])).toContain(
      'weak and grey, but breathing',
    )
  })

  it('has the correct name and a way back south only', () => {
    const room = new ThroneChamber()
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
      'The crystal is clouded and cold. Inside it King Alden sleeps without breathing, his crown dark. A thread of light runs from his crown into the wound.',
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
    let from = 0
    for (const block of OFFER_BLOCKS) {
      const at = first.indexOf(block, from)
      expect(at).toBeGreaterThanOrEqual(from)
      from = at + block.length
    }
    expect(first.match(/\[dialogue\]/g)).toHaveLength(4)
    expect(
      first.match(/\[character_name\]Malakar\[\/character_name\]/g),
    ).toHaveLength(4)
    expect(first).not.toContain('Stand with me. Please.')
    for (let i = 0; i < 2; i++) {
      expect(executeCommands(game, ['talk to malakar'])).toContain(PLEA)
    }
    expect(executeCommands(game, ['say hello to malakar'])).toContain(
      'Malakar only waits for your answer.',
    )
    expect(executeCommands(game, ['use ancient amulet'])).toContain(
      'it burns white',
    )
    for (const target of ['malakar', 'wound', 'prison']) {
      expect(
        executeCommands(game, [`use lifelight elixir on ${target}`]),
      ).toMatch(/stops a finger|twitches toward the glass/)
    }
    expectItemInInventory(game.state, 'Lifelight Elixir')
  })

  it('plays the refrain once', () => {
    const game = inThrone()
    executeCommands(game, ['talk to malakar'])
    const text = executeCommands(game, ['say refrain to malakar'])
    expect(text).toContain(
      dialogue('Elior', 'Power follows purpose; purpose follows truth.') +
        "\n[event]The words from the stone in Willowbrook, from Nyx, from the Dragon's hall. They are yours now.[/event]",
    )
    expect(text).not.toContain('you say')
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
        'Elior. I tore the world to keep them, and I lost them anyway. I could not wait; you can. Be patient where I was not. Close what I opened, and let them rest.',
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
        `You kneel and hold the elixir to Malakar's lips. He drinks. The grey goes out of his face, and for a moment he is the young man at the workbench again. "Hush, little seed," he sings under his breath, and does not seem to know he does. The wound flickers, and waits.`,
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
    game.state.addVirtue(VIRTUE_TRUTH)
    game.state.addVirtue(VIRTUE_TRUTH)
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

describe('Throne Chamber, commands out of order', () => {
  it('answers the refrain before talk with a laugh and the full offer, uncounted', () => {
    const game = inThrone()
    const out = executeCommands(game, ['say refrain to malakar'])
    expect(out).toContain(
      'Malakar laughs, a dry sound that goes on too long. Then it stops, all at once.',
    )
    expect(out).toContain(
      'Not yet. You have not heard me. Hear me, and then say it to my face.',
    )
    for (const block of OFFER_BLOCKS) expect(out).toContain(block)
    expectStoryFlag(game.state, FLAG_ACT4_THRONE_REFRAIN_SAID, false)
    const again = executeCommands(game, ['say refrain to malakar'])
    expect(again).toContain('We carved those words')
    expectStoryFlag(game.state, FLAG_ACT4_THRONE_REFRAIN_SAID, true)
  })

  it('plays the elixir reach once, sharpened when the offer is heard', () => {
    const game = inThrone()
    executeCommands(game, ['talk to malakar'])
    const first = executeCommands(game, ['use lifelight elixir on malakar'])
    expect(first).toContain('stops a finger')
    expect(first).toContain('Give me the amulet, Elior, and your mother wakes')
    const later = executeCommands(game, ['use lifelight elixir on prison'])
    expect(later).toContain(
      "Malakar's hand twitches toward the glass, and stays where it is.",
    )
    expect(later).not.toContain('stops a finger')
  })

  it('has him say he has not spoken when the elixir comes first', () => {
    const game = inThrone()
    const out = executeCommands(game, ['use lifelight elixir'])
    expect(out).toContain('You have not even heard what I am offering.')
  })

  it("keeps today's refusal between the refrain and the amulet", () => {
    const game = refrained()
    expect(
      executeCommands(game, ['use lifelight elixir on malakar']),
    ).toContain('Not yet. The amulet at your chest is stirring.')
  })

  it('burns Malakar once when the amulet comes before the refrain', () => {
    const game = inThrone()
    const first = executeCommands(game, ['use amulet on malakar'])
    expect(first).toContain('it burns white')
    expectDialogueSpeaker(first, 'Shadow of the Past')
    expect(first).toContain('Not like this.')
    expectStoryFlag(game.state, FLAG_ACT4_THRONE_AMULET_OPENED, false)
    const later = executeCommands(game, ['use amulet'])
    expect(later).toContain(
      'The amulet is still warm. Malakar keeps his hand well away from it.',
    )
    expect(later).not.toContain('burns white')
  })

  it('remembers played reactions across save and load', () => {
    const game = inThrone()
    executeCommands(game, ['use amulet', 'use lifelight elixir'])
    reload(game)
    expect(executeCommands(game, ['use amulet'])).toContain('still warm')
    expect(executeCommands(game, ['use lifelight elixir'])).toContain(
      'twitches toward the glass',
    )
  })

  it("starts the early refrain with today's refrain line and offers once", () => {
    const game = inThrone()
    const out = executeCommands(game, ['say refrain to malakar'])
    expect(
      out.startsWith(
        '[character_name]Elior[/character_name]\n[dialogue]Power follows purpose',
      ),
    ).toBe(true)
    expect(executeCommands(game, ['talk to malakar'])).toContain(PLEA)
  })

  it('burns Malakar after talk too, and keeps the picture stage on reload', () => {
    const game = inThrone()
    executeCommands(game, ['talk to malakar'])
    expect(executeCommands(game, ['use amulet on malakar'])).toContain(
      'it burns white',
    )
    executeCommands(game, ['say refrain to malakar'])
    reload(game)
    expect(executeCommands(game, ['examine amulet'])).toContain(
      'Malakar as he is now',
    )
  })
})
