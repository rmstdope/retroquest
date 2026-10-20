import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { CourtHerald } from '../characters/CourtHerald'
import { Historians } from '../characters/Historians'
import { LordCommander } from '../characters/LordCommander'
import {
  FLAG_COURT_HERALD_FORMAL_PRESENTATION,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_SHOWED_JOURNAL_TO_HISTORIANS,
} from '../Act2StoryFlags'

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
      description:
        'A magnificent hall with soaring ceilings supported by massive stone columns. ' +
        'Tapestries depicting legendary battles cover the walls, and a throne sits on ' +
        'a raised dais at the far end. Sunlight streams through tall stained-glass ' +
        'windows, casting colorful patterns on the stone floor. This is where the ' +
        'lords of Greendale hold court and make important decisions.',
      items: [],
      characters: [new CourtHerald(), new Historians(), new LordCommander()],
      exits: { east: 'CastleCourtyard' },
    })
  }

  /** Conduct lineage research through progressive flag checks. */
  override search(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION)) {
      return (
        '[failure]The Court Herald stops you from accessing the archives. You need formal ' +
        'approval from him first.[/failure]'
      )
    }
    if (!gameState.getStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS)) {
      return (
        '[failure]The archives are vast, filled with countless books and scrolls. ' +
        "You don't know where to start. You need guidance from someone familiar " +
        'with these records.[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE, true)
    return (
      "[success]With the historians' expert guidance, you navigate through the vast " +
      'archives to find records mentioning Willowbrook and your family lineage. The ' +
      'ancient chronicles reveal that your ancestors, the Ravencrest family, were ' +
      'among the first settlers of Willowbrook. For generations, they served as protectors ' +
      'of the realm, wielding hereditary magical abilities passed down through bloodlines. ' +
      'Your family has long been connected to the ancient tradition of safeguarding the ' +
      'balance between the natural and mystical worlds, with each generation producing ' +
      'individuals capable of channeling protective magic to defend their community.' +
      '[/success]'
    )
  }
}
