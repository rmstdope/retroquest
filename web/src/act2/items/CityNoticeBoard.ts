import { Item, type GameState } from '@/engine'

/** Public notice board with postings that provide in-game leads and quests. */
export class CityNoticeBoard extends Item {
  constructor() {
    super({
      name: 'city notice board',
      shortName: 'board',
      description:
        'A large wooden board posted with official notices, job postings, and ' +
        "announcements. The most prominent posting seeks brave souls for 'The " +
        "Gathering Storm' — a call for heroes to help defend against rising dark " +
        'forces.',
      canBeCarried: false,
    })
  }

  /** Read the postings on the board. */
  override examine(_gameState: GameState): string {
    return (
      'You read through the various postings on the notice board. Most are mundane ' +
      'announcements about trade regulations and festival dates, but one catches ' +
      "your eye: a formal call for heroes to aid in 'The Gathering Storm.' The " +
      'notice bears the seal of Sir Cedric and promises great rewards for those ' +
      'brave enough to answer the call.'
    )
  }
}
