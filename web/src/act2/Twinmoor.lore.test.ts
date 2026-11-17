import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act2 } from './Act2'
import {
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_SPECTRAL_LIBRARIAN_FRIENDLY,
} from './Act2StoryFlags'

/** The founding oath, exactly as every act says it. */
const OATH = 'What the Wardens bind, the crown will hold.'

/** An Act II game with Elior in the named room. */
function gameIn(room: string): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms[room]
  return game
}

/** Check a once-only line: absent before the trigger, said once after, never again, not after a reload. */
function expectOnce(
  room: string,
  who: string,
  trigger: string,
  line: string,
): void {
  const game = gameIn(room)
  expect(executeCommands(game, [`talk to ${who}`])).not.toContain(line)
  game.state.setStoryFlag(trigger, true)
  const first = executeCommands(game, [`talk to ${who}`])
  expect(first).toContain(line)
  expect(executeCommands(game, [`talk to ${who}`])).not.toContain(line)
  const loaded = new Game([new Act2()])
  loaded.loadSaveData(game.toSaveData())
  expect(executeCommands(loaded, [`talk to ${who}`])).not.toContain(line)
}

describe('Twinmoor lore in Act II', () => {
  it('has the Historians tell of the first grant, once, after the archive search', () => {
    expectOnce(
      'GreatHall',
      'historians',
      FLAG_RESEARCHED_FAMILY_HERITAGE,
      "The land grants are older than the crown. The first is not a grant at all: a page in the Wardens' hand naming the moor Twinmoor, and under it the first king's mark, swearing to hold what they bind. Every king since has sworn the same words at his crowning. We had thought them only words.",
    )
  })

  it('has the Court Herald say the oath, once, after the archive search', () => {
    expectOnce(
      'GreatHall',
      'court herald',
      FLAG_RESEARCHED_FAMILY_HERITAGE,
      `I read the oath at His Majesty's crowning. '${OATH}' I did not know who the Wardens were. I am told you do.`,
    )
  })

  it('has the Spectral Librarian name the land, once, when friendly', () => {
    expectOnce(
      'HiddenLibrary',
      'spectral librarian',
      FLAG_SPECTRAL_LIBRARIAN_FRIENDLY,
      'They named it Twinmoor before there was a crown to name it. Ask the crown what it promised them.',
    )
  })

  it('has Sir Cedric swear the oath, once, when his name is cleared', () => {
    expectOnce(
      'CastleCourtyard',
      'sir cedric',
      FLAG_CEDRIKS_HONOR_COMPLETED,
      `Every knight swears on the crown's oath. '${OATH}' I swore it at sixteen and never asked whose words they were. I will ask now.`,
    )
  })
})
