import { Quest, type GameState } from '@/engine'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_MAGIC_FULLY_UNLOCKED,
} from '../Act1StoryFlags'

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
        'Mira has tasked you with preparing for your journey. ' +
        'She says you will need: \n' +
        ' - Warm clothing -\n' +
        ' - Magical protection -\n' +
        ' - Food for the road (at least four different types) -\n' +
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

  /** Rebuild the requirement checklist and report whether every item is met. */
  override checkCompletion(gameState: GameState): boolean {
    // Items
    this.hasTravelCloak = gameState.hasItem('travel cloak')
    // Food items
    const hasWildBerries = gameState.hasItem('wild berries')
    const hasApple = gameState.hasItem('apple')
    const hasEgg = gameState.hasItem('egg')
    const hasCarrot = gameState.hasItem('fresh carrot')
    this.allFoodCollected = hasWildBerries && hasApple && hasEgg && hasCarrot

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

    const lines = [
      'Mira has tasked you with preparing for your journey. She says you will need: \n',
    ]
    const requirements: [string, boolean][] = [
      [' * Warm clothing', this.hasTravelCloak],
      [' * Magical protection', this.journeyBlessCompleted],
      [
        ' * Food for the road (at least four different types)',
        this.allFoodCollected,
      ],
      [' * Sturdy footwear', this.hasWanderingBoots],
      [' * A map to find your way', this.hasMap],
      [' * All basic magic learned', this.knowsAllSpells],
    ]
    for (const [req, completed] of requirements) {
      if (completed) {
        lines.push(`[success]${req}[/success]`)
      } else {
        lines.push(`[pending]${req}[/pending]`)
      }
    }
    this.description = lines.join('\n')

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
