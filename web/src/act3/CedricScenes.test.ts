import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from './Act3'
import {
  FLAG_ACT3_CEDRIC_GATE_ANSWERED,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_MINERS_RESCUE_STARTED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
} from './Act3StoryFlags'
import { parseTurn } from '@/lantern/parseTurn'
import { Miners } from './characters/Miners'
import { SirCedric } from './characters/SirCedric'
import { Mira } from './characters/Mira'
import { Phoenix } from './characters/Phoenix'
import { TideBornGuardian } from './characters/TideBornGuardian'
import { FallenRock } from './items/FallenRock'
import { ReinforcedBraces } from './items/ReinforcedBraces'
import { SupportStraps } from './items/SupportStraps'
import { WedgeBlocks } from './items/WedgeBlocks'
import { LifelightElixir } from './items/LifelightElixir'
import { HeatWardMix } from './items/HeatWardMix'
import { FumarolePassages } from './rooms/FumarolePassages'
import {
  expectCharacterInRoom,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** A started game with the party (Elior, Mira and Sir Cedric) in the room. */
function partyAt(roomKey: string): Game {
  const game = new Game([new Act3()])
  game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
  const room = game.state.allRooms[roomKey]
  const hut = game.state.allRooms.MirasHut
  for (const who of ['mira', 'cedric']) {
    const c = hut.getCharacterByName(who)
    if (c && room !== hut) {
      hut.characters.splice(hut.characters.indexOf(c), 1)
      room.characters.push(c)
    }
  }
  game.state.currentRoom = room
  return game
}

/** Mira's circle talk from the room, with the flags that let it move on. */
function circleTalk(roomKey: string, flags: string[]): string {
  const game = partyAt(roomKey)
  flags.forEach((f) => game.state.setStoryFlag(f, true))
  const mira = game.state.currentRoom.getCharacterByName('mira') as Mira
  const out = mira.talkTo(game.state)
  expectMarkupWellFormed(out)
  return out
}

/** Whether `first` comes before `second` in `text`. */
function inOrder(text: string, first: string, second: string): boolean {
  return text.indexOf(first) >= 0 && text.indexOf(first) < text.indexOf(second)
}

/** Walk the Guardian's trial to the third step, where the vow is asked. */
function walkTrial(guardian: TideBornGuardian, game: Game): void {
  for (let i = 0; i < 3; i++) guardian.walkEast(game.state)
}

describe('Sir Cedric reacts to the story', () => {
  it('turns the Guardian to him at the vow, once', () => {
    const game = partyAt('SanctumOfTheTide')
    const guardian = game.state.currentRoom.getCharacterByName(
      'tide-born guardian',
    ) as TideBornGuardian
    walkTrial(guardian, game)
    const first = guardian.sayTo(game.state, 'myself')
    const second = guardian.sayTo(game.state, 'myself')

    expectMarkupWellFormed(first)
    expect(inOrder(first, 'You may now', 'turns its rippling face to')).toBe(
      true,
    )
    expect(first).toContain('Name what you will not abandon.')
    expect(first).toContain('My king.')
    expect(first).toContain('I did once.')
    expect(first.endsWith('The water does not answer him.')).toBe(true)
    expect(second).not.toContain('Sir Cedric')
    expect(game.state.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(true)
  })

  it('stays out of the vow when he is not in the Sanctum', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.SanctumOfTheTide
    const guardian = game.state.currentRoom.getCharacterByName(
      'tide-born guardian',
    ) as TideBornGuardian
    walkTrial(guardian, game)
    expect(guardian.sayTo(game.state, 'myself')).not.toContain('Sir Cedric')
  })

  it.each([
    [
      'TidalCauseway',
      [FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, FLAG_ACT3_SEA_SEALED_LETTER_READ],
      'He is weaker than when we set out.',
      'I had the wall that night.',
    ],
    [
      'LowerSwitchbacks',
      [FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, FLAG_ACT3_CHARRED_INSCRIPTION_READ],
      'The king is weaker still.',
      'Weaker still. And I stood on a mountain, waiting on a bird.',
    ],
    [
      'CavernMouth',
      [FLAG_ACT3_DRAGONS_SCALE_ACQUIRED],
      'The king is fading, Elior.',
      'He was taken on my watch. He will not die on it.',
    ],
  ])(
    'reacts after Mira in %s and before the circle',
    (key, flags, miraLine, cedricLine) => {
      const out = circleTalk(key, flags)
      expect(inOrder(out, miraLine, cedricLine)).toBe(true)
      expect(inOrder(out, cedricLine, 'Mira traces a prism')).toBe(true)
    },
  )

  it('plays the king-weaker reaction nowhere else', () => {
    const out = circleTalk('MirasHut', [FLAG_ACT3_ECHOES_QUEST_STARTED])
    expect(out).not.toContain('Every day he is weaker')
  })

  it('sets them down at the fortress with the gate line after the arrival', () => {
    const game = partyAt('MirasHut')
    ;[
      FLAG_ACT3_ECHOES_QUEST_STARTED,
      FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
    ].forEach((f) => game.state.setStoryFlag(f, true))
    game.state.addItemToInventory(new LifelightElixir())
    const mira = game.state.currentRoom.getCharacterByName('mira') as Mira

    const out = mira.talkTo(game.state)

    expectMarkupWellFormed(out)
    expect(game.state.currentRoom.name).toBe("Entrance to Malakar's Fortress")
    expect(out).not.toContain('You arrive at')
    expect(inOrder(out, 'Steel yourself', 'looking up at the gates')).toBe(true)
    expect(inOrder(out, 'looking up at the gates', 'sunlit glade')).toBe(true)
    expectCharacterInRoom(game.state.currentRoom, 'Sir Cedric')
  })

  it('looks at the ground when the Phoenix gives the feather, once', () => {
    const game = partyAt('PhoenixCrater')
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    const first = phoenix.sayTo(game.state, 'patience')
    const again = phoenix.sayTo(game.state, 'patience')
    expectMarkupWellFormed(first)
    expect(first.endsWith('looks at the ground.')).toBe(true)
    expect(again).not.toContain('looks at the ground')
  })

  it('steps toward the vents every time the heat ward is tried too early', () => {
    const game = partyAt('FumarolePassages')
    const room = game.state.currentRoom as FumarolePassages
    const mix = new HeatWardMix()
    for (let i = 0; i < 2; i++) {
      const out = room.applyHeatWard(game.state, mix)
      expectMarkupWellFormed(out)
      expect(
        inOrder(out, 'not yet synchronized', 'steps toward the vents'),
      ).toBe(true)
      expect(out).toContain('Between breaths, then.')
    }
  })

  it('holds the beam and drives the last block, once each', () => {
    const game = partyAt('CollapsedGalleries')
    const rock = new FallenRock()
    game.state.currentRoom.addItem(rock)
    rock.examine(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_STARTED)).toBe(true)

    const braces = rock.useWith(game.state, new ReinforcedBraces())
    const bracesAgain = rock.useWith(game.state, new ReinforcedBraces())
    rock.useWith(game.state, new SupportStraps())
    const wedge = rock.useWith(game.state, new WedgeBlocks())
    const wedgeAgain = rock.useWith(game.state, new WedgeBlocks())

    expect(braces).toContain('holds it while you set it')
    expect(bracesAgain).not.toContain('Sir Cedric')
    expect(wedge).toContain('flat of his shield')
    expect(wedgeAgain).not.toContain('Sir Cedric')
    expectMarkupWellFormed(braces)
    expectMarkupWellFormed(wedge)
  })
})

describe('Sir Cedric in the story view', () => {
  /** Who the story view labels each quote of the output with. */
  function speakers(markup: string): string[] {
    return parseTurn(markup).flatMap((b) =>
      b.kind === 'dialogue' ? [`${b.speaker}: ${b.markup}`] : [],
    )
  }

  it("does not put the Guardian's question in his mouth", () => {
    const game = partyAt('SanctumOfTheTide')
    const guardian = game.state.currentRoom.getCharacterByName(
      'tide-born guardian',
    ) as TideBornGuardian
    walkTrial(guardian, game)
    const quotes = speakers(guardian.sayTo(game.state, 'myself'))
    expect(quotes).toContain(
      'Tide-Born Guardian: Name what you will not abandon.',
    )
    expect(quotes).toContain('Sir Cedric: My king.')
    expect(quotes).toContain('Sir Cedric: I did once.')
  })

  it('gives the oldest miner his own words', () => {
    const game = partyAt('CollapsedGalleries')
    const quotes = speakers(new Miners().talkTo(game.state))
    expect(quotes.some((q) => q.startsWith('oldest miner: '))).toBe(true)
    expect(quotes).toContain(
      'Sir Cedric: Someone should stay until the braces settle. I will.',
    )
  })

  it('narrates the refrain Elior speaks before Sir Cedric answers', () => {
    const game = partyAt('FortressEntrance')
    const out = new SirCedric().sayTo(game.state, 'refrain')
    expect(out).toContain(
      'You: “Power follows purpose; purpose follows truth.”\n',
    )
    expect(speakers(out)).toEqual([
      'Sir Cedric: Truth, then. The truth is I was on the wall. The truth is he is still alive. Let us go and get him.',
    ])
  })
})

describe('Sir Cedric and the save', () => {
  it('keeps where he stands and whether the gate was answered', () => {
    const game = partyAt('FortressEntrance')
    game.state.setStoryFlag(FLAG_ACT3_CEDRIC_GATE_ANSWERED, true)
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    expectCharacterInRoom(fresh.state.currentRoom, 'Sir Cedric')
    expect(fresh.state.getStoryFlag(FLAG_ACT3_CEDRIC_GATE_ANSWERED)).toBe(true)
    expect(fresh.state.currentRoom.name).toBe("Entrance to Malakar's Fortress")
  })

  it('names him in title case when loading a save that has him in lower case', () => {
    const game = new Game([new Act3()])
    const cedric = game.state.allRooms.MirasHut.getCharacterByName('cedric')
    if (!cedric) throw new Error('Sir Cedric starts in the hut')
    cedric.name = 'sir cedric'
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    expect(
      fresh.state.allRooms.MirasHut.getCharacterByName('cedric')?.name,
    ).toBe('Sir Cedric')
  })
})
