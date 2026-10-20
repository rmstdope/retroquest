import { Item, type GameState } from '@/engine'
import { FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED } from '../Act1StoryFlags'

/**
 * Player-held world map enabling Act I completion in the correct context.
 * (Python class `Map`; named `GameMap` here so it does not shadow the global `Map`.)
 */
export class GameMap extends Item {
  constructor() {
    super({
      name: 'map',
      description:
        'A detailed map of Willowbrook and the surrounding areas. It shows various ' +
        'landmarks and paths, some of which are not immediately obvious.',
      canBeCarried: true,
    })
  }

  /** Returns a contextual description; may set the act completion flag. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom.name.toLowerCase() === 'road to greendale') {
      const preparationQuestName = 'Preparing for the road'
      const incompleteSideQuests = [
        ...gameState.nonActivatedQuests,
        ...gameState.activatedQuests,
      ].filter(
        (quest) => !quest.isMain() && quest.name !== preparationQuestName,
      )
      const missingRequirements: string[] = []
      if (!gameState.hasItem('ancient amulet')) {
        missingRequirements.push('receive the Ancient Amulet')
      }
      if (!gameState.isQuestCompleted(preparationQuestName)) {
        missingRequirements.push('complete your journey preparations')
      }
      if (incompleteSideQuests.length > 0) {
        missingRequirements.push('complete every other side quest')
      }
      if (missingRequirements.length > 0) {
        return (
          '[failure]You are not ready to leave Willowbrook yet. You must ' +
          `${missingRequirements.join(', ')} first.[/failure]`
        )
      }

      gameState.setStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED, true)
      return (
        `[event]You use the [item_name]${this.name}[/item_name].[/event]\n` +
        `The [item_name]${this.name}[/item_name] aligns with the landscape,` +
        ' revealing a ' +
        'hidden path that shortens the journey to Greendale. You feel a sense of ' +
        'accomplishment as you set forth.'
      )
    }
    return (
      `[event]You study the [item_name]${this.name}[/item_name]. It depicts the ` +
      'local area with surprising detail.[/event]'
    )
  }
}
