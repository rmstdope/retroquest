import { Item, type GameState } from '@/engine'

/** The board's description: the most prominent posting is the Lord Commander's call. */
export const CITY_NOTICE_BOARD_DESCRIPTION =
  'A large wooden board posted with official notices, job postings, and ' +
  "announcements. The most prominent posting, under the Lord Commander's seal, " +
  'calls for able hands to serve the castle.'

/** Public notice board with postings that provide in-game leads and quests. */
export class CityNoticeBoard extends Item {
  constructor() {
    super({
      name: 'city notice board',
      shortName: 'board',
      description: CITY_NOTICE_BOARD_DESCRIPTION,
      canBeCarried: false,
    })
  }

  /** Read the postings on the board. */
  override examine(_gameState: GameState): string {
    return (
      'You read through the various postings on the notice board. Most are mundane ' +
      'announcements about trade regulations and festival dates, but one catches ' +
      "your eye: a call under the Lord Commander's seal for able hands to serve " +
      'the castle in these uncertain times. Beneath it, in a smaller hand, ' +
      'someone has written: [italic]Enquire in the training yard.[/italic]'
    )
  }
}
