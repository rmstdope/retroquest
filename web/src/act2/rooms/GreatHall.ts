import { Room, characterName, clue, writing } from '@/engine'
import type { GameState } from '@/engine'
import { CourtHerald } from '../characters/CourtHerald'
import { Historians } from '../characters/Historians'
import { LordCommander } from '../characters/LordCommander'
import {
  FLAG_COURT_HERALD_FORMAL_PRESENTATION,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_SHOWED_JOURNAL_TO_HISTORIANS,
} from '../Act2StoryFlags'

/** The visitors' register entry the archive search shows, and recalls on a repeat search. */
const VISITOR_ENTRY =
  "'A man in a grey cloak. Asked for the birth rolls of Willowbrook and the " +
  'families who came there. Would not give his name. Said he came on the ' +
  "business of Malakar.'"

/** The Great Hall description; `Act2.afterLoad` restores it in older saves. */
export const GREAT_HALL_DESCRIPTION =
  'A magnificent hall with soaring ceilings supported by massive stone columns. ' +
  'Tapestries depicting legendary battles cover the walls, and the ' +
  "king's throne stands empty on a raised dais at the far end, a dark cloth " +
  'laid across its arms. Behind it, the doors to the throne room are barred. ' +
  'Sunlight streams through tall stained-glass windows, casting colorful ' +
  'patterns on the stone floor. This is where the lords of Greendale hold ' +
  'court; for now, the Lord Commander holds it alone.'

/**
 * Great Hall room: political nexus enabling a gated heritage research sequence.
 *
 * `search()` conducts lineage research through progressive flag checks and sets
 * FLAG_RESEARCHED_FAMILY_HERITAGE on success.
 */
export class GreatHall extends Room {
  constructor() {
    super({
      name: 'Great Hall',
      description: GREAT_HALL_DESCRIPTION,
      items: [],
      characters: [new CourtHerald(), new Historians(), new LordCommander()],
      exits: { east: 'CastleCourtyard' },
    })
  }

  /** Conduct lineage research through progressive flag checks. */
  override search(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION)) {
      return clue(
        `The ${characterName('Court Herald')} steps between you and the ` +
          'shelves and holds out his hand for your pass.',
      )
    }
    if (!gameState.getStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS)) {
      return clue(
        'The archive runs to three hundred years of shelves. Without someone ' +
          'who knows them, you could read for a month and find nothing.',
      )
    }
    if (gameState.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE)) {
      return (
        'You have already been through the archive. One entry in the ' +
        "visitors' register stays with you:" +
        '\n' +
        writing(VISITOR_ENTRY)
      )
    }
    gameState.setStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE, true)
    return (
      "[success]With the historians' guidance you work through the archive. " +
      'Most of it is tax rolls and land grants, but near the oldest shelves ' +
      'you find two things.[/success]\n' +
      'The first is a page from an old history, its sigil drawn in faded gold:' +
      '\n' +
      writing(
        "'Of the Wardens of the Dawn. Their mark is the sun rising over three " +
          'linked rings. They kept watch over the kingdom when the old wars ' +
          'ended and answered to no lord but the crown. The king stood with ' +
          "them, and lent the crown's own binding to their last " +
          'great work. None of them has been ' +
          "seen in a generation, and few now remember their names.'",
      ) +
      '\n' +
      "The second is the archive's own register of visitors. The same entry " +
      'appears again and again over the past year, in different hands:' +
      '\n' +
      writing(VISITOR_ENTRY) +
      '\n' +
      'Malakar. You had always thought him a name from old books, a tale to ' +
      'frighten children. Yet someone walks into this archive in his name, ' +
      'asking after the families of Willowbrook. The last entry is dated ' +
      'the week King Alden vanished.'
    )
  }
}
