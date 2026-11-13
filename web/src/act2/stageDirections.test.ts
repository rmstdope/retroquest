/** Stage directions in Act II speech are narration, not asterisk text inside quotes (rq-525). */
import { describe, it, expect } from 'vitest'
import { Game, Quest } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act2 } from './Act2'
import {
  FLAG_CEDRIC_RECOGNISED_SIGIL,
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
} from './Act2StoryFlags'
import { BarmaidElena } from './characters/BarmaidElena'
import { InnkeeperMarcus } from './characters/InnkeeperMarcus'
import { SirCedric } from './characters/SirCedric'
import { Squires } from './characters/Squires'
import { TrainingMaster } from './characters/TrainingMaster'

/** The narration lines of a turn with markup tags stripped. */
function narration(raw: string): string[] {
  return parseTurn(raw)
    .filter((block) => block.kind === 'text')
    .map((block) => ('markup' in block ? block.markup : ''))
    .map((markup) => markup.replace(/\[\/?[a-z_]+\]/g, ''))
}

/** Every quote of a turn, as speaker and spoken words. */
function quotes(raw: string): { speaker: string | null; words: string }[] {
  return parseTurn(raw).flatMap((block) =>
    block.kind === 'dialogue'
      ? [{ speaker: block.speaker, words: block.markup }]
      : [],
  )
}

function newGame(): Game {
  return new Game([new Act2()])
}

describe('Barmaid Elena stage directions', () => {
  const cases: [string, (e: BarmaidElena, g: Game) => void, string][] = [
    ['cursed', () => {}, 'Elena coughs, and turns it into a smile.'],
    [
      'asked again',
      (_e, g) => g.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true),
      'Elena pulls her shawl tighter.',
    ],
    [
      'partly healed',
      (e) => {
        e.elenaInitialHealing = true
      },
      'Elena turns her hand over and looks at it as if it belonged to someone else.',
    ],
    [
      'purified',
      (e) => {
        e.elenaPurified = true
      },
      'Elena rubs at the inside of her wrist.',
    ],
    [
      'cured',
      (_e, g) => g.state.setStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED, true),
      'Elena sets her tray down and takes both your hands.',
    ],
  ]
  it.each(cases)(
    '%s: narration, then one labelled quote',
    (_n, setUp, line) => {
      const game = newGame()
      const elena = new BarmaidElena()
      setUp(elena, game)
      const out = elena.talkTo(game.state)
      expect(out).not.toContain('*')
      expect(narration(out)).toEqual([line])
      const spoken = quotes(out)
      // After the healing Elena speaks twice: it did not take, and Lyria.
      expect(spoken).toHaveLength(line.includes('turns her hand') ? 2 : 1)
      expect(spoken[0].speaker).toBe('barmaid elena')
      expect(parseTurn(out)[0].kind).toBe('text')
    },
  )
})

describe('Innkeeper Marcus stage direction', () => {
  it('lifts the wiped eyes out of the quote', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED, true)
    const out = new InnkeeperMarcus().talkTo(game.state)
    expect(out).not.toContain('*')
    expect(narration(out)[0]).toBe(
      'Marcus has to wipe his eyes before he can speak.',
    )
    expect(parseTurn(out)[0].kind).toBe('text')
    expect(quotes(out)[0].words.startsWith('You gave me back my girl.')).toBe(
      true,
    )
  })
})

describe('Training Master stage directions', () => {
  it('first talk: quote, narration, unlabelled second quote', () => {
    const game = newGame()
    const out = new TrainingMaster().talkTo(game.state)
    expect(out).not.toContain('*')
    expect(narration(out)).toEqual([
      'He glances toward Sir Cedric and away again.',
      'He leans closer, lowering his voice.',
    ])
    const kinds = parseTurn(out).map((b) => b.kind)
    expect(kinds).toEqual(['dialogue', 'text', 'dialogue', 'text', 'dialogue'])
    expect(new Set(quotes(out).map((q) => q.speaker))).toEqual(
      new Set(['Training Master']),
    )
  })

  it('later talk: narration opens, then the labelled quote', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)
    const out = new TrainingMaster().talkTo(game.state)
    expect(out).not.toContain('*')
    expect(narration(out)).toEqual(['The Training Master nods.'])
    expect(parseTurn(out)[0].kind).toBe('text')
    expect(quotes(out)[0].words.startsWith('Still at it?')).toBe(true)
  })
})

describe('Squires stage directions', () => {
  it('before the quest: narration, then the quote without inner quote marks', () => {
    const game = newGame()
    const out = new Squires().talkTo(game.state)
    expect(out).not.toContain('*')
    expect(narration(out)).toEqual([
      'The squires keep their eyes on their drill. One of them answers ' +
        'without turning.',
    ])
    expect(quotes(out)).toEqual([
      {
        speaker: 'Squires',
        words: "Can't stop. The Training Master's watching, and he counts.",
      },
    ])
  })

  it('after the quest: narration, then three quotes split by two directions', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)
    const out = new Squires().talkTo(game.state)
    expect(out).not.toContain('*')
    expect(narration(out)).toEqual([
      'The young squires lower their voices and glance around nervously.',
      'One squire looks particularly troubled.',
      'Another squire nods.',
    ])
    expect(parseTurn(out).map((b) => b.kind)).toEqual([
      'text',
      'dialogue',
      'text',
      'dialogue',
      'text',
      'dialogue',
    ])
    expect(new Set(quotes(out).map((q) => q.speaker))).toEqual(
      new Set(['Squires']),
    )
  })
})

describe('Sir Cedric narration between quotes', () => {
  it('shows the charm line without asterisks and with a full stop', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL, true)
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)
    const out = new SirCedric().talkTo(game.state)
    expect(out).not.toContain('*')
    expect(narration(out).filter((l) => l.startsWith('Sir Cedric '))).toEqual([
      'Sir Cedric reaches into his pack and takes out a small wooden charm, dark with handling.',
    ])
    expect(narration(out)).toContain("You receive nature's charm.")
    expect(quotes(out).map((q) => q.speaker)).toEqual([
      'Sir Cedric',
      'Sir Cedric',
      'Sir Cedric',
    ])
  })

  it('shows the coins line without asterisks and with a full stop', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL, true)
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    game.state.completedQuests.push(
      new Quest({ name: "The Knight's Test", description: '', completion: '' }),
    )
    const out = new SirCedric().talkTo(game.state)
    expect(out).not.toContain('*')
    expect(narration(out).filter((l) => l.startsWith('Sir Cedric '))).toEqual([
      'Sir Cedric reaches into his pouch and hands you a bag of coins.',
      'Sir Cedric hesitates, then rests a hand on a small pouch at his belt.',
    ])
    expect(narration(out)).toContain('You receive 150 gold coins.')
    expect(quotes(out).map((q) => q.speaker)).toEqual([
      'Sir Cedric',
      'Sir Cedric',
      'Sir Cedric',
    ])
  })
})
