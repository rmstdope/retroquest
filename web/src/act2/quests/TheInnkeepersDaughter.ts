import { Quest, characterName, type GameState } from '@/engine'
import {
  QUEST_INNKEEPERS_DAUGHTER,
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_ELENA_HEALED,
  FLAG_LYRIA_DIAGNOSED,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
} from '../Act2StoryFlags'
import { BarmaidElena } from '../characters/BarmaidElena'

const LYRIA = characterName('Lyria')

/** What the log says while Elena is cursed: nobody can say who laid it. */
export const INNKEEPERS_DAUGHTER_DESCRIPTION =
  'Elena, the barmaid at the Silver Stag, wakes a little colder every ' +
  'morning. The healers call it a curse; nobody can say who laid it.'

/** The entry once Lyria has explained how such a curse is lifted. */
const DIAGNOSED =
  `\n\n${LYRIA} told you how a curse like Elena's is lifted, in this order ` +
  'or not at all: first a deeper healing to make her strong, then the ' +
  'mark washed in untouched water, from a spring no bucket has ever gone ' +
  'down, and last an unbinding of the old kind.'

/** The entry once greater heal has made her stronger and shown the mask. */
const HEALED =
  '\n\nGreater heal made Elena stronger, and a small silver mask surfaced ' +
  'on the inside of her wrist, smooth and smiling, with no eyes behind it. ' +
  'The curse still holds her.'

/** The entry once the nymphs' water has washed her. */
const PURIFIED =
  "\n\nThe water from the nymphs' spring washed the grey out of her skin, " +
  'but the silver mask on her wrist is untouched.'

/** The hint while Elena is still too weak for the rest of the cure. */
const NEXT_STRENGTH =
  'First Elena must be made strong, by a deeper healing than ' +
  `${LYRIA}'s own.`

/** The hint once she is strong, before the water. */
const NEXT_WATER =
  'Elena is strong enough now. Next in the order the mark is washed in ' +
  'untouched water, from a spring no bucket has ever gone down.'

/** The hint once she is washed, before the unbinding. */
const NEXT_UNBINDING =
  'The water has done what water can. Last, the curse must be unbound, ' +
  'with the old kind of unbinding.'

/** What the log says once the curse is unbound. */
export const INNKEEPERS_DAUGHTER_COMPLETION =
  'You made Elena strong with greater heal, washed the mark in water from ' +
  "the nymphs' spring, and unbound the curse with the Wardens' dispel. The " +
  'silver mask on her wrist faded, and she is warm again.'

/**
 * Quest to save Elena, the innkeeper's daughter, from a curse nobody can
 * trace. Its journal records Lyria's cure order and each step of the cure as
 * it is done; once she has explained it, its hint names the next step of
 * that order.
 */
export class TheInnkeepersDaughterQuest extends Quest {
  /** How many entries after the opening the log has reported as news. */
  stagesNoted = 0

  constructor() {
    super({
      name: QUEST_INNKEEPERS_DAUGHTER,
      description: INNKEEPERS_DAUGHTER_DESCRIPTION,
      completion: INNKEEPERS_DAUGHTER_COMPLETION,
    })
  }

  /** Bring the log up to date in a save made with the older wording. */
  override refreshSavedText(gameState: GameState): void {
    this.completion = INNKEEPERS_DAUGHTER_COMPLETION
    // Started quests are rebuilt on load; settle the rest without reporting news.
    if (this.completed) this.checkUpdate(gameState)
    else if (!gameState.activatedQuests.includes(this))
      this.description = INNKEEPERS_DAUGHTER_DESCRIPTION
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE)
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_INNKEEPERS_DAUGHTER_COMPLETED
  }

  /**
   * Rebuild the journal from the cure's progress, the steps in Lyria's
   * order; true once for each entry not reported before.
   */
  override checkUpdate(gameState: GameState): boolean {
    const entries: string[] = []
    if (gameState.getStoryFlag(FLAG_LYRIA_DIAGNOSED)) entries.push(DIAGNOSED)
    if (gameState.getStoryFlag(FLAG_ELENA_HEALED)) entries.push(HEALED)
    if (this.elena(gameState)?.elenaPurified) entries.push(PURIFIED)
    const stages = [INNKEEPERS_DAUGHTER_DESCRIPTION, ...entries]
    this.setJournal(stages.slice(0, -1), stages[stages.length - 1])
    if (entries.length <= this.stagesNoted) return false
    this.stagesNoted = entries.length
    return true
  }

  /**
   * The next step of the cure in Lyria's order, in-world; before she has
   * explained it, the log's newest entry, as for any quest.
   */
  override hint(gameState: GameState): string | null {
    if (!gameState.getStoryFlag(FLAG_LYRIA_DIAGNOSED))
      return super.hint(gameState)
    if (!gameState.getStoryFlag(FLAG_ELENA_HEALED)) return NEXT_STRENGTH
    if (!this.elena(gameState)?.elenaPurified) return NEXT_WATER
    return NEXT_UNBINDING
  }

  /** Elena, wherever the act keeps her. */
  private elena(gameState: GameState): BarmaidElena | undefined {
    for (const room of Object.values(gameState.allRooms)) {
      const found = room.characters.find((c) => c instanceof BarmaidElena)
      if (found instanceof BarmaidElena) return found
    }
    return undefined
  }
}
