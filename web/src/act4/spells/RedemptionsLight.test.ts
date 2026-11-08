import { describe, it, expect } from 'vitest'
import { ShadowOfThePast } from '../characters/ShadowOfThePast'
import { SorceressOfLies } from '../characters/SorceressOfLies'
import {
  FLAG_ACT4_BANNERS_SEEN,
  FLAG_ACT4_ECHO_STONE_HEARD,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
} from '../Act4StoryFlags'
import { Game, clue, dialogue } from '@/engine'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import { endingPlayed } from '../endings'
import { Act4 } from '../Act4'
import { RedemptionsLight } from './RedemptionsLight'
import { GhostlyWarriors } from '../characters/GhostlyWarriors'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { TrueSelf } from '../characters/TrueSelf'
import {
  FLAG_ACT4_CEDRIC_FORGAVE,
  FLAG_ACT4_WARRIORS_AT_PEACE,
} from '../Act4StoryFlags'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

const NOTHING =
  '[dim]Soft light gathers in your hand and fades. There is no fallen soul here to remember itself.[/dim]'

/** A game in the Hall of Echoes where the knight is already redeemed. */
function createRedeemedGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = game.state.allRooms.HallOfEchoes
  game.state.setStoryFlag('act4_guardians_chain_raised', true)
  game.state.setStoryFlag('act4_knight_seen_through', true)
  game.state.setStoryFlag(FLAG_ACT4_BANNERS_SEEN, true)
  game.state.setStoryFlag(FLAG_ACT4_ECHO_STONE_HEARD, true)
  game.commandParser.parse('say redemption to knight')
  return game
}

describe('RedemptionsLight', () => {
  it('has the agreed name and description', () => {
    const spell = new RedemptionsLight()
    expect(spell.name).toBe("Redemption's Light")
    expect(spell.description).toBe(
      'Light that reminds a fallen soul of who it was.',
    )
    expect(spell.answersTo("redemption's light")).toBe(true)
  })

  it('has nothing to redeem without a target or on the knight', () => {
    const game = new Game([new Act4()])
    const spell = new RedemptionsLight()
    expect(spell.castSpell(game.state)).toBe(NOTHING)
    expect(spell.castOnCharacter(game.state, new KnightOfDespair())).toBe(
      NOTHING,
    )
    expectMarkupWellFormed(NOTHING)
  })

  it('fizzles on other characters', () => {
    const game = new Game([new Act4()])
    expect(
      new RedemptionsLight().castOnCharacter(game.state, new TrueSelf()),
    ).toContain('Nothing in them answers the spell.')
  })

  it('puts the warriors at peace, records mercy once', () => {
    const game = createRedeemedGame()
    const hall = game.state.currentRoom
    expect(hall.characters.some((c) => c instanceof GhostlyWarriors)).toBe(true)
    const cast = executeCommands(game, [
      "cast redemption's light on ghostly warriors",
    ])
    expect(cast).toContain(
      "Soft light spills from your hands across the hall. One by one the ghostly warriors lower their blades. One puts a hand on another's shoulder. Then they fade, at peace.",
    )
    expect(cast).toContain('[event]✦ Mercy — this will be remembered[/event]')
    expect(cast).not.toContain('Elior will remember this.')
    expect(game.state.hasVirtue('mercy')).toBe(true)
    expect(game.state.virtues.filter((v) => v === 'mercy')).toHaveLength(1)
    expect(game.state.getStoryFlag(FLAG_ACT4_WARRIORS_AT_PEACE)).toBe(true)
    expect(hall.characters.some((c) => c instanceof GhostlyWarriors)).toBe(
      false,
    )
    expect(hall.descriptionFor(game.state)).not.toContain('ghostly warriors')
    expect(hall.descriptionFor(game.state)).toContain('the knight kneels')
    expect(
      executeCommands(game, ["cast redemption's light on ghostly warriors"]),
    ).toContain("You don't see a 'ghostly warriors'")
  })

  it('is unknown before the knight is redeemed', () => {
    const game = new Game([new Act4()])
    game.state.currentRoom = game.state.allRooms.HallOfEchoes
    expect(
      executeCommands(game, ["cast redemption's light on ghostly warriors"]),
    ).toContain("You don't know any spell called")
  })

  it('lights the Shadow and the redeemed Sorceress, every time, and sets nothing', () => {
    const game = createRedeemedGame()
    const spell = new RedemptionsLight()
    const shadow = new ShadowOfThePast()
    const sorceress = new SorceressOfLies()
    const line = spell.castOnCharacter(game.state, shadow)
    expect(line).toContain(
      'Light gathers in your hand, and the Shadow turns from it, gently.\n' +
        '[character_name]Shadow of the Past[/character_name]\n' +
        '[dialogue]I have done nothing but remember. Keep it for him.[/dialogue]',
    )
    expect(line).not.toContain('"')
    expectMarkupWellFormed(line)
    expect(spell.castOnCharacter(game.state, shadow)).toBe(line)
    expect(spell.castOnCharacter(game.state, sorceress)).toContain(
      'Nothing in them answers the spell.',
    )
    game.state.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED, true)
    const redeemed = spell.castOnCharacter(game.state, sorceress)
    expect(redeemed).toContain(
      'Soft light touches the [character_name]Unmasked Sorceress[/character_name]. ' +
        'She does not flinch.\n' +
        '[character_name]Unmasked Sorceress[/character_name]\n' +
        '[dialogue]So this is what it is, to be looked at without a lie.[/dialogue]',
    )
    expect(redeemed).not.toContain('"')
    expectMarkupWellFormed(redeemed)
    expect(spell.castOnCharacter(game.state, sorceress)).toBe(redeemed)
    expect(game.state.hasVirtue('mercy')).toBe(false)
  })
})

describe("Redemption's Light in the Throne Chamber", () => {
  const TALK = ACT4_GOLDEN_PATH.indexOf('talk to malakar')
  const HEALED = ACT4_GOLDEN_PATH.indexOf('use lifelight elixir on malakar')
  const UNTIL_AMULET = ACT4_GOLDEN_PATH.slice(0, HEALED)
  const BEFORE_REFRAIN =
    'Soft light gathers around [character_name]Malakar[/character_name], ' +
    "and for a breath his robe is a Warden's blue again. He shuts his eyes " +
    'and turns back to the wound.\n' +
    dialogue('Malakar', 'I know who I was. It changes nothing.')
  const AFTER_REFRAIN =
    'The light settles on [character_name]Malakar[/character_name], and ' +
    'he does not turn from it.\n' +
    dialogue('Malakar', 'I remember. What happens now is yours, not mine.')
  const HEALED_LINE =
    'The light settles on [character_name]Malakar[/character_name]. He is ' +
    'himself already, or nearly.\n'
  const WOUND_LINE =
    'The light runs into the wound and is gone. There is no one in it to ' +
    'remember.'

  /** Every stage of the scene, from the door to each ending, by commands. */
  const STAGES: { stage: string; commands: string[]; malakar: string }[] = [
    {
      stage: 'before his offer',
      commands: ACT4_GOLDEN_PATH.slice(0, TALK),
      malakar: BEFORE_REFRAIN,
    },
    {
      stage: 'after his offer',
      commands: ACT4_GOLDEN_PATH.slice(0, TALK + 1),
      malakar: BEFORE_REFRAIN,
    },
    {
      stage: 'after the refrain',
      commands: ACT4_GOLDEN_PATH.slice(0, TALK + 2),
      malakar: AFTER_REFRAIN,
    },
    {
      stage: 'with the amulet open',
      commands: UNTIL_AMULET,
      malakar: AFTER_REFRAIN,
    },
    {
      stage: 'with the king freed',
      commands: [...UNTIL_AMULET, 'use lifelight elixir on prison'],
      malakar: AFTER_REFRAIN,
    },
    {
      stage: 'healed, before forgiveness',
      commands: ACT4_GOLDEN_PATH.slice(0, HEALED + 1),
      malakar:
        HEALED_LINE +
        '[character_name]Malakar[/character_name] looks up at you like a ' +
        'man waiting to be forgiven.',
    },
    {
      stage: 'healed and forgiven',
      commands: ACT4_GOLDEN_PATH.slice(0, HEALED + 2),
      malakar:
        HEALED_LINE +
        clue('You have forgiven him. It is the wound that is waiting now.'),
    },
  ]

  /** A fresh Act 4 game played through the commands. */
  function playedTo(commands: string[]): Game {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    executeCommands(game, commands)
    return game
  }

  for (const { stage, commands, malakar } of STAGES) {
    it(`answers in-world on Malakar and the wound ${stage}, changing nothing`, () => {
      const game = playedTo(commands)
      expect(game.state.currentRoom.name).toBe('Throne Chamber')
      const flags = { ...game.state.storyFlags }
      const onMalakar = executeCommands(game, [
        "cast redemption's light on malakar",
      ])
      expect(onMalakar).not.toContain('Nothing in them answers the spell.')
      expect(onMalakar).toContain(malakar)
      expectMarkupWellFormed(onMalakar)
      const onWound = executeCommands(game, [
        "cast redemption's light on wound",
      ])
      expect(onWound).not.toContain('Nothing in it answers the spell.')
      expect(onWound).toContain(WOUND_LINE)
      expect(game.state.storyFlags).toEqual(flags)
      expect(endingPlayed(game.state)).toBeNull()
    })
  }

  for (const [ending, last] of [
    ['redemption', ['cast forgiveness on wound']],
    [
      'justice',
      [
        'use lifelight elixir on prison',
        'say justice to malakar',
        'use ancient amulet on wound',
      ],
    ],
  ] as const) {
    it(`has nothing left to do on Malakar and the wound after ${ending}`, () => {
      const commands =
        ending === 'redemption'
          ? [...ACT4_GOLDEN_PATH.slice(0, HEALED + 2), ...last]
          : [...UNTIL_AMULET, ...last]
      const game = playedTo(commands)
      expect(endingPlayed(game.state)).toBe(ending)
      const flags = { ...game.state.storyFlags }
      const onMalakar = executeCommands(game, [
        "cast redemption's light on malakar",
      ])
      expect(onMalakar).toContain(
        ending === 'justice'
          ? "You don't see a 'malakar'"
          : '[dim]The light rests on Malakar and fades. It has nothing left ' +
              'to do.[/dim]',
      )
      expect(
        executeCommands(game, ["cast redemption's light on wound"]),
      ).toContain('[dim]The wound is gone.[/dim]')
      expect(game.state.storyFlags).toEqual(flags)
    })
  }

  it('is gone after sacrifice, with the rest of the magic', () => {
    const game = playedTo([
      ...UNTIL_AMULET,
      'use lifelight elixir on prison',
      'say sacrifice to malakar',
      'use ancient amulet on wound',
    ])
    expect(endingPlayed(game.state)).toBe('sacrifice')
    expect(
      executeCommands(game, ["cast redemption's light on malakar"]),
    ).toContain('That magic is gone from you now.')
  })

  it('points at what Sir Cedric did, healed, when Elior saw him forgive', () => {
    const game = playedTo(ACT4_GOLDEN_PATH.slice(0, HEALED + 1))
    game.state.setStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE, true)
    expect(
      executeCommands(game, ["cast redemption's light on malakar"]),
    ).toContain(
      HEALED_LINE +
        '[character_name]Malakar[/character_name] looks at you the way the ' +
        'knight looked at [character_name]Sir Cedric[/character_name] in the ' +
        'hall, before [character_name]Sir Cedric[/character_name] gave him ' +
        'his hand.',
    )
  })
})
