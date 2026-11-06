import { describe, it, expect } from 'vitest'
import { Game, characterName } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'
import { ReviveSpell } from './ReviveSpell'
import { PurifySpell } from './PurifySpell'
import { BlessSpell } from './BlessSpell'
import { HealSpell } from './HealSpell'
import { UnlockSpell } from './UnlockSpell'
import { LightSpell } from './LightSpell'
import { GrowSpell } from './GrowSpell'
import { executeCommands } from '@/testing/gameHelpers'

/** An Act I game in Mira's hut with every Act I spell known and magic unlocked. */
function awake(): Game {
  const game = new Game([new Act1()])
  game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
  for (const spell of [
    new ReviveSpell(),
    new PurifySpell(),
    new BlessSpell(),
    new HealSpell(),
    new UnlockSpell(),
    new LightSpell(),
    new GrowSpell(),
  ]) {
    game.state.learnSpell(spell)
  }
  game.state.currentRoom = game.state.allRooms.MirasHut
  return game
}

describe('Act I spell descriptions remember who gave the spell', () => {
  const expected: [{ new (): { description: string } }, string][] = [
    [
      ReviveSpell,
      "Your father's word for calling a thing back when it is nearly " +
        'gone. [character_name]Grandmother[/character_name] remembered it for you.',
    ],
    [
      PurifySpell,
      'Your mother taught it to the [character_name]fisherman[/character_name] at the bend, and he gave ' +
        'it back to you. It makes foul water clean.',
    ],
    [
      BlessSpell,
      'The blessing the [character_name]priest[/character_name] said over you when you found the ' +
        "founders' locket.",
    ],
    [
      HealSpell,
      'The first thing [character_name]Mira[/character_name] showed you: how to mend.',
    ],
    [
      UnlockSpell,
      'The second thing [character_name]Mira[/character_name] showed you: how to open.',
    ],
    [
      LightSpell,
      'The third thing [character_name]Mira[/character_name] showed you: how to make a light.',
    ],
    [
      GrowSpell,
      'Read word by word off the mossy stone in the glade. It feels ' +
        'like your own.',
    ],
  ]
  it.each(expected)('%o reads as agreed', (SpellClass, text) => {
    expect(new SpellClass().description).toBe(text)
  })
})

describe('Act I spell descriptions in older saves', () => {
  it('colour the people you can meet after loading', () => {
    const game = awake()
    for (const spell of game.state.knownSpells) spell.description = 'Old.'
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())
    for (const spell of fresh.state.knownSpells) {
      if (spell.id !== 'grow') expect(spell.description).not.toBe('Old.')
    }
    const revive = fresh.state.knownSpells.find((s) => s.id === 'revive')
    expect(revive?.description).toContain(characterName('Grandmother'))
    for (const id of ['heal', 'unlock', 'light']) {
      const spell = fresh.state.knownSpells.find((s) => s.id === id)
      expect(spell?.description).toContain(characterName('Mira'))
    }
    const bless = fresh.state.knownSpells.find((s) => s.id === 'bless')
    expect(bless?.description).toContain(characterName('priest'))
    const purify = fresh.state.knownSpells.find((s) => s.id === 'purify')
    expect(purify?.description).toContain(characterName('fisherman'))
    expect(purify?.description).toContain('Your mother')
  })
})

describe('Act I fallback cast lines speak in the world', () => {
  it('heal on someone with nothing to mend', () => {
    const out = executeCommands(awake(), ['cast heal on Mira'])
    expect(out).toContain(
      'A warm light settles over [character_name]Mira[/character_name] and finds nothing ' +
        'that needs mending.',
    )
  })

  it('purify on someone finds nothing to wash away', () => {
    const out = executeCommands(awake(), ['cast purify on Mira'])
    expect(out).toContain(
      'The cleansing runs over [character_name]Mira[/character_name] and finds nothing to wash away.',
    )
  })

  it('grow with no target', () => {
    const out = executeCommands(awake(), ['cast grow'])
    expect(out).toContain(
      'The grass at your feet stands a little taller. Nothing here was ' +
        'waiting for it.',
    )
  })

  it('bless on yourself', () => {
    const out = executeCommands(awake(), ['cast bless'])
    expect(out).toContain(
      'A quiet warmth settles on your shoulders and stays, the way the ' +
        `${characterName('priest')}'s hand did.`,
    )
  })

  it('heal and purify name a character known by what it is with its article', () => {
    const game = awake()
    game.state.currentRoom = game.state.allRooms.VillageChapel
    const priest = `the ${characterName('priest')}`
    expect(executeCommands(game, ['cast heal on priest'])).toContain(
      `A warm light settles over ${priest} and finds nothing`,
    )
    expect(executeCommands(game, ['cast purify on priest'])).toContain(
      `The cleansing runs over ${priest} `,
    )
  })
})

describe('Act I fallback cast lines read right for their target', () => {
  it('heal never calls a named character them', () => {
    const game = awake()
    game.state.currentRoom = game.state.allRooms.VillageChapel
    const out = executeCommands(game, ['cast heal on priest'])
    expect(out).not.toContain('them')
  })

  it('bless names a character known by what it is with its article, and no them', () => {
    const game = awake()
    game.state.currentRoom = game.state.allRooms.VillageChapel
    const out = executeCommands(game, ['cast bless on priest'])
    expect(out).toContain(
      `A divine light surrounds the ${characterName('priest')} and leaves ` +
        'strength and resolve behind.',
    )
    expect(out).not.toContain('they')
  })

  it('grow on the vines does not say "vines does"', () => {
    const game = awake()
    game.state.currentRoom = game.state.allRooms.ForestPath
    const out = executeCommands(game, ['cast grow on vines'])
    expect(out).not.toContain('does not respond')
    expect(out).toContain(
      'The [spell_name]grow[/spell_name] spell finds nothing to wake in ' +
        'the [item_name]vines[/item_name].',
    )
  })

  it('light in the outdoor vegetable field does not call it a room', () => {
    const game = awake()
    game.state.currentRoom = game.state.allRooms.VegetableField
    const out = executeCommands(game, ['cast light'])
    expect(out).not.toContain('room')
    expect(out).toContain('It is already light enough here.')
  })
})
