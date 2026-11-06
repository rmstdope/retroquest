import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { FLAG_LANTERN_LIT } from '../Act1StoryFlags'

const ENTRY_LANTERN =
  'You woke with three words written down, somewhere in the dark by your ' +
  'bed, and a tune still going in the house. The [item_name]lantern[/item_name] ' +
  'would show you where.'
const ENTRY_JOURNAL =
  'The [item_name]lantern[/item_name] found your [item_name]journal[/item_name]. ' +
  'The three words are in it, with the rest of the dream.'
const ENTRY_GRANDMOTHER =
  '[character_name]Grandmother[/character_name] is at the hearth, humming ' +
  'the tune from your dream. She will want to hear about it.'

const DARK_CORNER =
  'The curtains are still drawn on a grey morning, and the corner by your ' +
  'bed is too dark to see into.'
const GREY_MORNING =
  'Grey morning comes through the lace curtains onto shelves lined with ' +
  'trinkets and memories.'

const LANTERN_NUDGE =
  'And light that lantern before you go feeling about in your corner; ' +
  "you'll have the shelf down."
const JOURNAL_NUDGE =
  'You were scribbling in that journal before your eyes were open. ' +
  'Read me what it says, if you can make it out.'

/** A new Act I game, woken out of the dream into the cottage. */
function wokenGame(): Game {
  const game = new Game([new Act1()])
  executeCommands(game, ['talk to voice'])
  return game
}

/** The Hint of magic quest's log, newest entry and the earlier ones. */
function hintLog(game: Game): { latest: string; earlier: string[] } {
  const quest = game.state.activatedQuests.find(
    (q) => q.name === 'Hint of magic',
  )
  if (!quest) throw new Error('Hint of magic is not active')
  const details = quest.details()
  if (details.kind !== 'journal') throw new Error('not a journal')
  return { latest: details.latest, earlier: details.earlier }
}

/** The hint line for Hint of magic, without its bold quest-name lead. */
function hintLine(game: Game): string {
  const line = game
    .hint()
    .split('\n')
    .find((l) => l.startsWith('[bold]Hint of magic:[/bold] '))
  if (!line) throw new Error('no Hint of magic hint')
  return line.slice('[bold]Hint of magic:[/bold] '.length)
}

/** The cottage's room text as the player reads it now. */
function cottageText(game: Game): string {
  return game.state.allRooms.EliorsCottage.descriptionFor(game.state)
}

/** Save the game and load it into a fresh one. */
function reloaded(game: Game, edit?: (data: string) => string): Game {
  const fresh = new Game([new Act1()])
  const data = game.toSaveData()
  expect(fresh.loadSaveData(edit ? edit(data) : data)).toContain('loaded')
  return fresh
}

describe('The opening leads lantern, journal, Grandmother', () => {
  it('just woken: the hint and Grandmother point at the lantern', () => {
    const game = wokenGame()
    executeCommands(game, ['talk to grandmother'])

    const again = executeCommands(game, ['talk to grandmother'])

    expect(hintLine(game)).toBe(ENTRY_LANTERN)
    expect(hintLog(game)).toEqual({ latest: ENTRY_LANTERN, earlier: [] })
    expect(again).toContain(
      "Back again? There's bread on the board, if you're hungry. " +
        LANTERN_NUDGE,
    )
    expect(cottageText(game)).toContain(DARK_CORNER)
    expect(cottageText(game)).not.toContain('Sunlight')
  })

  it('gives no nudge in her first greeting', () => {
    const game = wokenGame()

    const first = executeCommands(game, ['talk to grandmother'])

    expect(first).toContain('There you are.')
    expect(first).not.toContain(LANTERN_NUDGE)
  })

  it('nudges toward the lantern after the loaf has been taken', () => {
    const game = wokenGame()
    executeCommands(game, ['take bread', 'talk to grandmother'])

    const again = executeCommands(game, ['talk to grandmother'])

    expect(again).toContain(
      "Back again? You've had the loaf, I see. I'll bake another. " +
        LANTERN_NUDGE,
    )
  })

  it('nudges toward the journal after the loaf has been taken', () => {
    const game = wokenGame()
    executeCommands(game, ['use lantern', 'take bread', 'talk to grandmother'])

    const again = executeCommands(game, ['talk to grandmother'])

    expect(again).toContain(
      "Back again? You've had the loaf, I see. I'll bake another. " +
        JOURNAL_NUDGE,
    )
  })

  it('lantern lit: the log grows and Grandmother asks after the journal', () => {
    const game = wokenGame()
    executeCommands(game, ['talk to grandmother', 'use lantern'])

    const again = executeCommands(game, ['talk to grandmother'])

    expect(hintLine(game)).toBe(ENTRY_JOURNAL)
    expect(hintLog(game)).toEqual({
      latest: ENTRY_JOURNAL,
      earlier: [ENTRY_LANTERN],
    })
    expect(again).toContain(
      "Back again? There's bread on the board, if you're hungry. " +
        JOURNAL_NUDGE,
    )
    expect(again).not.toContain(LANTERN_NUDGE)
    expect(cottageText(game)).toContain(GREY_MORNING)
    expect(cottageText(game)).not.toContain(DARK_CORNER)
  })

  it('keeps the lit sentence once the lantern leaves the cottage', () => {
    const game = wokenGame()
    executeCommands(game, ['use lantern', 'take lantern'])

    expect(cottageText(game)).toContain(GREY_MORNING)
  })

  it('journal read: the log points at Grandmother, who tells the dream', () => {
    const game = wokenGame()
    executeCommands(game, ['use lantern', 'use journal'])

    expect(hintLine(game)).toBe(ENTRY_GRANDMOTHER)
    expect(hintLog(game)).toEqual({
      latest: ENTRY_GRANDMOTHER,
      earlier: [ENTRY_LANTERN, ENTRY_JOURNAL],
    })
    const talk = executeCommands(game, ['talk to grandmother'])
    expect(talk).toContain('You tell her about the dream')
    expect(talk).not.toContain(JOURNAL_NUDGE)
    expect(game.state.hasSpell('revive')).toBe(true)
  })
})

describe('The opening after a load', () => {
  it('loads a save made with the lantern lit in that state', () => {
    const game = wokenGame()
    executeCommands(game, ['use lantern'])

    const fresh = reloaded(game)

    expect(hintLine(fresh)).toBe(ENTRY_JOURNAL)
    expect(cottageText(fresh)).toContain(GREY_MORNING)
  })

  it('loads an older save, lantern lit before the flag, in that state', () => {
    const game = wokenGame()
    executeCommands(game, ['use lantern', 'take lantern'])

    const fresh = reloaded(game, (data) =>
      data.replace(`"${FLAG_LANTERN_LIT}":true`, `"${FLAG_LANTERN_LIT}":false`),
    )

    expect(hintLine(fresh)).toBe(ENTRY_JOURNAL)
    expect(cottageText(fresh)).toContain(GREY_MORNING)
    const again = executeCommands(fresh, [
      'talk to grandmother',
      'talk to grandmother',
    ])
    expect(again).toContain(JOURNAL_NUDGE)
  })

  it('loads a save made after reading the journal in that state', () => {
    const game = wokenGame()
    executeCommands(game, ['use lantern', 'use journal'])

    expect(hintLine(reloaded(game))).toBe(ENTRY_GRANDMOTHER)
  })
})
