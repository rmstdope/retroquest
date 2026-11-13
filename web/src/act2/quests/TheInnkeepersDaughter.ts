import { Quest, characterName, type GameState, type QuestStage } from '@/engine'
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

/** The hint once she is healed, while Lyria has not yet explained the rest. */
const ASK_LYRIA =
  'Elena says that if anyone knows what comes next, it is Master ' +
  `${LYRIA}, who sat with her when it began.`

/** The hint while Elena is still too weak for the rest of the cure. */
const NEXT_STRENGTH =
  'First Elena must be made strong, by a deeper healing than ' +
  `${LYRIA}'s own.`

/** The hint once she is strong, before the water. */
const NEXT_WATER =
  'Elena is strong enough now. Next in the order the curse is washed in ' +
  'untouched water, from a spring no bucket has ever gone down.'

/** The hint once she is washed, before the unbinding. */
const NEXT_UNBINDING =
  'The water has done what water can. Last, the curse must be unbound, ' +
  'with the old kind of unbinding.'

/** What the log says once the curse is unbound. */
export const INNKEEPERS_DAUGHTER_COMPLETION =
  'You made Elena strong with greater heal, washed her in water from ' +
  "the nymphs' spring, and unbound the curse with the Wardens' dispel. The " +
  'silver mask on her wrist faded, and she is warm again.'

/**
 * Quest to save Elena, the innkeeper's daughter, from a curse nobody can
 * trace. Its journal records Lyria's cure order and each step of the cure as
 * it is done, in the order the player got there; its hint names the next
 * step of that order, or Lyria while she has not explained it.
 */
export class TheInnkeepersDaughterQuest extends Quest {
  /** Saves made before the engine kept the order: the keys, as first noted. */
  private noted?: string[]

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
    // An older save kept the reached order as a list; the engine keeps a record.
    if (this.noted) {
      for (const key of this.noted) this.reachedKeys()[key] = true
      this.noted = undefined
    }
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

  /** The opening entry, before Lyria has explained the cure. */
  protected override opening(): string {
    return INNKEEPERS_DAUGHTER_DESCRIPTION
  }

  /**
   * The cure's progress: Lyria's explanation, then each step done, in the
   * order the player got there. Each stage's hint is the next step of Lyria's
   * order while it is the first still ahead.
   */
  protected override stages(): QuestStage[] {
    return [
      {
        key: 'diagnosed',
        reached: (gameState) => gameState.getStoryFlag(FLAG_LYRIA_DIAGNOSED),
        log: DIAGNOSED,
        hint: (gameState) =>
          gameState.getStoryFlag(FLAG_ELENA_HEALED) ? ASK_LYRIA : null,
      },
      {
        key: 'healed',
        reached: (gameState) => gameState.getStoryFlag(FLAG_ELENA_HEALED),
        log: HEALED,
        hint: (gameState) =>
          gameState.getStoryFlag(FLAG_LYRIA_DIAGNOSED) ? NEXT_STRENGTH : null,
      },
      {
        key: 'purified',
        reached: (gameState) => this.elena(gameState)?.elenaPurified === true,
        log: PURIFIED,
        hint: (gameState) =>
          gameState.getStoryFlag(FLAG_LYRIA_DIAGNOSED) &&
          gameState.getStoryFlag(FLAG_ELENA_HEALED)
            ? NEXT_WATER
            : null,
      },
    ]
  }

  /** Once the water has washed her, the unbinding is all that is left. */
  protected override closingHint(): string {
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
