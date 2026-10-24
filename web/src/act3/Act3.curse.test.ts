import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act3 } from './Act3'
import { ACT3_GOLDEN_PATH } from './Act3GoldenPath'
import { AncientAmulet } from './items/AncientAmulet'
import { expectMarkupWellFormed, executeCommands } from '@/testing/gameHelpers'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
} from './Act3StoryFlags'
import { Mira } from './characters/Mira'
import { AncientDragon } from './characters/AncientDragon'
import { CharredInscription } from './items/CharredInscription'
import { SeaSealedLetter } from './items/SeaSealedLetter'

const MOMENT_1 =
  'Out past the arches the tide turns, and the surf that breaks on the ' +
  'causeway runs grey. Dead sea birds lie along the stones, more than you ' +
  'can count, their feathers dull with salt. Whatever is draining the king ' +
  'is draining the sea as well.'
const MOMENT_2 =
  'Ash begins to fall over the slopes, slow and grey as rain. Down the ' +
  'mountain the braziers gutter one by one and sink to embers. The curse ' +
  'lies heavier here than it did by the sea.'
const MOMENT_3 =
  'Far off in the mines the ring of picks stops, and does not start again. ' +
  "Then the cavern's old dripping stops too, and the silence is complete. " +
  'The curse has reached even here, beneath the oldest hills.'
const LINE_1 = 'Dead sea birds line the stones, and the surf runs grey.'
const LINE_2 =
  'Ash falls over the terraces like slow grey rain, and down the slope the ' +
  'braziers have guttered to embers.'
const LINE_3 =
  'The old dripping has stopped; from the mines beyond comes no sound of ' +
  'picks at all.'
const MIRA_1 =
  'And Elior—I can feel the king through the focus. He is weaker than when ' +
  'we set out.'
const MIRA_2 =
  'The king is weaker still. Whatever drains him draws harder with every ' +
  'site we reach.'
const MIRA_3 = 'The king is fading, Elior. We have less time than I hoped.'
/** Mira's one line telling the Wasting from the blight, at the Mount Ember departure. */
const MIRA_WASTING =
  'There is a word the old folk will reach for when this ash comes down on ' +
  'them: the Wasting. It is not that. The Wasting killed. This drinks.'

/** Number of times `needle` occurs in `text`. */
function count(text: string, needle: string): number {
  return text.split(needle).length - 1
}

/** A fresh Act III game standing in the named room. */
function gameIn(roomKey: string): Game {
  const game = new Game([new Act3()])
  game.state.currentRoom = game.state.allRooms[roomKey]
  return game
}

describe('Act III curse grows worse at each relic site', () => {
  it('shows each curse moment once, straight after its glow', () => {
    const amulet = new AncientAmulet()
    const moments = [MOMENT_1, MOMENT_2, MOMENT_3]
    const glows = ['grows warm', 'glows again', 'blazes in your hand']

    for (const stage of [1, 2, 3] as const) {
      const out = amulet.glow(stage)
      expect(out.indexOf(glows[stage - 1])).toBeLessThan(
        out.indexOf(moments[stage - 1]),
      )
      expect(out).toContain(moments[stage - 1])
      expect(out).not.toContain('[event]')
      expectMarkupWellFormed(out)
      expect(amulet.glow(stage)).toBe('')
    }
  })

  it('plays moment 1 on the first reading of the letter only', () => {
    const game = new Game([new Act3()])
    const letter = new SeaSealedLetter()
    const first = letter.examine(game.state)
    const again = letter.examine(game.state)

    expect(count(first, MOMENT_1)).toBe(1)
    expect(again).not.toContain(MOMENT_1)
  })

  it('plays moment 2 on the first reading of the inscription only', () => {
    const game = new Game([new Act3()])
    const inscription = new CharredInscription()
    const first = inscription.examine(game.state)
    const again = inscription.examine(game.state)

    expect(count(first, MOMENT_2)).toBe(1)
    expect(again).not.toContain(MOMENT_2)
  })

  it('plays moment 3 after the glow and before the dragon’s closing reply, once', () => {
    const game = new Game([new Act3()])
    const dragon = new AncientDragon()
    const first = dragon.talkTo(game.state)
    const again = dragon.talkTo(game.state)

    expect(first.indexOf('blazes in your hand')).toBeLessThan(
      first.indexOf(MOMENT_3),
    )
    expect(first.indexOf(MOMENT_3)).toBeLessThan(
      first.indexOf('The memory has been shared'),
    )
    expect(again).not.toContain(MOMENT_3)
  })

  it.each([
    ['TidalCauseway', FLAG_ACT3_SEA_SEALED_LETTER_READ, LINE_1],
    ['MirrorTerraces', FLAG_ACT3_CHARRED_INSCRIPTION_READ, LINE_2],
    ['DragonsHall', FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, LINE_3],
  ])('%s keeps one closing line after its clue', (key, flag, line) => {
    const game = gameIn(key)
    const room = game.state.currentRoom
    const before = room.describe(game.state)
    expect(before).not.toContain(line)

    game.state.setStoryFlag(flag, true)
    const after = room.describe(game.state)

    expect(after).toBe(
      before.replace(`${room.description}\n`, `${room.description} ${line}\n`),
    )
    expect(count(after, line)).toBe(1)
    expect(game.state.currentRoom.description).not.toContain(line)
  })

  it('shows the closing line on the room card, also after a save and load', () => {
    const game = gameIn('MirrorTerraces')
    const room = game.state.currentRoom
    expect(new GameController(game).getRoomDescription()).toBe(room.description)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const shown = new GameController(fresh).getRoomDescription()

    expect(shown).toBe(`${room.description} ${LINE_2}`)
  })

  it('plays no moment for a save already past the clue, with the amulet still unglowed', () => {
    const game = gameIn('MirrorTerraces')
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const out = executeCommands(fresh, ['examine inscription'])

    expect(out).not.toContain(MOMENT_2)
    expect(out).not.toContain('glows again')
  })

  it('ends Mira’s parting speech at each of the three departures with the king line', () => {
    const cases: [string, string[], string][] = [
      [
        'TidalCauseway',
        [FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, FLAG_ACT3_SEA_SEALED_LETTER_READ],
        MIRA_1,
      ],
      [
        'LowerSwitchbacks',
        [
          FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
          FLAG_ACT3_CHARRED_INSCRIPTION_READ,
        ],
        MIRA_2,
      ],
      ['CavernMouth', [FLAG_ACT3_DRAGONS_SCALE_ACQUIRED], MIRA_3],
    ]
    for (const [key, flags, sentence] of cases) {
      const game = gameIn(key)
      game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
      flags.forEach((f) => game.state.setStoryFlag(f, true))
      const mira = new Mira()
      game.state.currentRoom.characters.push(mira)

      const out = mira.talkTo(game.state)

      expect(out).toContain(`[dialogue]${sentence}[/dialogue]`)
      expect(out).not.toContain('You arrive at')
      expect(out).toContain('you arrive at your next destination')
      if (key === 'LowerSwitchbacks') {
        expect(out).toContain(`[dialogue]${MIRA_WASTING}[/dialogue]`)
        expect(out.indexOf(MIRA_WASTING)).toBeLessThan(out.indexOf(sentence))
      } else {
        expect(out).not.toContain('The Wasting killed')
      }
      expectMarkupWellFormed(out)
    }
  })

  it('leaves Mira’s refusals without the king line', () => {
    const game = gameIn('TidalCauseway')
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    const mira = new Mira()
    game.state.currentRoom.characters.push(mira)

    const out = mira.talkTo(game.state)

    expect(out).not.toContain('weaker')
    expect(out).not.toContain('fading')
  })

  it('plays each moment once along the golden path and not again after a reload', () => {
    const game = new Game([new Act3()])
    const out = executeCommands(game, ACT3_GOLDEN_PATH)
    for (const moment of [MOMENT_1, MOMENT_2, MOMENT_3]) {
      expect(count(out, moment)).toBe(1)
    }
    for (const sentence of [MIRA_1, MIRA_2, MIRA_3]) {
      expect(count(out, sentence)).toBe(1)
    }

    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    const again =
      new SeaSealedLetter().examine(fresh.state) +
      new CharredInscription().examine(fresh.state) +
      new AncientDragon().talkTo(fresh.state)
    for (const moment of [MOMENT_1, MOMENT_2, MOMENT_3]) {
      expect(again).not.toContain(moment)
    }
    expect(again).not.toContain('Ancient Amulet[/item_name] glows')
  })
})
