import { characterName, Quest, type GameState } from '@/engine'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_MAGIC_FULLY_UNLOCKED,
} from '../Act1StoryFlags'

/**
 * The kinds of food that count for the road, each by the item names that
 * stand for it (the cottage loaf or grandmother's fresh one are both bread);
 * the quest wants any four.
 */
const FOOD_KINDS = [
  ['bread', 'fresh bread'],
  ['apple'],
  ['egg'],
  ['fresh carrot'],
  ['wild berries'],
  ['fish'],
]
const FOOD_KINDS_NEEDED = 4

/** Checklist quest: done requirements are [success], unmet ones are [pending]. */
export class PreparingForTheRoadQuest extends Quest {
  hasTravelCloak = false
  allFoodCollected = false
  hasWanderingBoots = false
  hasMap = false
  knowsAllSpells = false
  journeyBlessCompleted = false

  constructor() {
    super({
      name: 'Preparing for the road',
      description:
        `${characterName('Mira')} has tasked you with preparing for your journey. ` +
        'She says you will need: \n' +
        ' - Warm clothing -\n' +
        ' - Magical protection -\n' +
        ' - Food for the road (any four kinds: bread, apple, egg, carrot, ' +
        'berries or fish) -\n' +
        ' - Sturdy footwear -\n' +
        ' - A map to find your way, and to have learned all the basic magic ' +
        'the village elders can teach you -\n' +
        ' - To have learned all the basic magic the village elders can teach you -\n',
      completion:
        'You have gathered all the items needed for your journey. With your ' +
        'preparations complete, you are ready to face whatever lies beyond ' +
        'Willowbrook.',
    })
  }

  /** Activate once all of Willowbrook's basic magic has been unlocked. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)
  }

  /** Keep the checklist current; it never counts as news, so always false. */
  override checkUpdate(gameState: GameState): boolean {
    this.refreshChecklist(gameState)
    return false
  }

  /** Rebuild the requirement checklist and report whether every item is met. */
  override checkCompletion(gameState: GameState): boolean {
    return this.refreshChecklist(gameState)
  }

  /** Read the requirements from the game, set the checklist, tell if all are met. */
  private refreshChecklist(gameState: GameState): boolean {
    // Items
    this.hasTravelCloak = gameState.hasItem('travel cloak')
    // Food: any four of the six kinds
    const foodKinds = FOOD_KINDS.filter((names) =>
      names.some((name) => gameState.hasItem(name)),
    )
    this.allFoodCollected = foodKinds.length >= FOOD_KINDS_NEEDED

    this.hasWanderingBoots = gameState.hasItem('wandering boots')
    this.hasMap = gameState.hasItem('map')

    // Spells
    const requiredSpells = [
      'revive',
      'purify',
      'bless',
      'heal',
      'unlock',
      'light',
      'grow',
    ]
    this.knowsAllSpells = requiredSpells.every((spellName) =>
      gameState.hasSpell(spellName),
    )

    // Action: Bless cast for the journey (flag set when the player blesses themselves)
    this.journeyBlessCompleted = gameState.getStoryFlag(
      FLAG_JOURNEY_BLESS_COMPLETED,
    )

    const intro =
      `${characterName('Mira')} has tasked you with preparing for your journey. ` +
      'She says you will need:'
    const requirements: [string, boolean][] = [
      ['Warm clothing', this.hasTravelCloak],
      ['Magical protection', this.journeyBlessCompleted],
      [
        `Food for the road (${foodKinds.length} of ${FOOD_KINDS.length} ` +
          `kinds gathered, any ${FOOD_KINDS_NEEDED} will do)`,
        this.allFoodCollected,
      ],
      ['Sturdy footwear', this.hasWanderingBoots],
      ['A map to find your way', this.hasMap],
      ['All basic magic learned', this.knowsAllSpells],
    ]
    // The prose form keeps the old text layout for readers of the description.
    const lines = [`${intro} \n`]
    for (const [req, completed] of requirements) {
      const tag = completed ? 'success' : 'pending'
      lines.push(`[${tag}] * ${req}[/${tag}]`)
    }
    this.setChecklist(
      {
        intro,
        items: requirements.map(([text, done]) => ({ done, text })),
      },
      lines.join('\n'),
    )

    return (
      this.hasTravelCloak &&
      this.allFoodCollected &&
      this.hasWanderingBoots &&
      this.hasMap &&
      this.knowsAllSpells &&
      this.journeyBlessCompleted
    )
  }
}
