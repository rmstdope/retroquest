import { Item, type GameState, characterName, event, speech } from '@/engine'
import {
  FLAG_KEPT_MOTHERS_RING,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED,
} from '../Act1StoryFlags'

/**
 * The revelation in the farewell: grandmother names Elior's parents for the
 * first time, says the amulet was theirs and warns that someone is looking for it.
 */
function revelation(): string {
  return (
    'Her hand finds the [item_name]amulet[/item_name] at your chest and ' +
    'closes around it.\n' +
    speech(
      `This was theirs, you know. ${characterName('Aren')} and ` +
        `${characterName('Lysa')}'s.`,
    ) +
    '\nIn all your years, you have never once heard her say their names.\n' +
    speech(
      `They gave it to ${characterName('Mira')} to keep for you, until you ` +
        'were ready. And someone has come to Willowbrook looking for it. ' +
        'Keep it hidden, child.',
    )
  )
}

/**
 * The farewell on the Road to Greendale that ends Act I: grandmother has
 * walked out to see Elior off, with a word on the ring and on Patches that
 * follows his choices; then the chapel bell rings once by itself.
 */
function farewell(gameState: GameState): string {
  const ringLine = gameState.getStoryFlag(FLAG_KEPT_MOTHERS_RING)
    ? speech('And you kept her ring. Good. Let a little of her go with you.')
    : speech(
        `The ${characterName('merchant')} showed me the ring he had of you. ` +
          "It was your mother's wedding ring, child. No, don't fret; " +
          "she'd have given it for your boots in a heartbeat.",
      )
  let patchesLine = ''
  if (gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)) {
    patchesLine = speech(
      `And don't you worry about ${characterName('Patches')}. ` +
        "She's already claimed your pillow.",
    )
  } else if (gameState.getStoryFlag(FLAG_PATCHES_RETURNED)) {
    patchesLine = speech(
      `Old ${characterName('Hemlock')} is telling the whole square ` +
        `how you found his ${characterName('Patches')}.`,
    )
  }
  return (
    event('Footsteps hurry along the road behind you.') +
    '\n' +
    `Your ${characterName('grandmother')} has walked all the way out from ` +
    'the village. She tugs the [item_name]travel cloak[/item_name] straight ' +
    'on your shoulders. ' +
    speech("Wear your mother's cloak. She'd want you warm.") +
    '\n' +
    ringLine +
    (patchesLine ? '\n' + patchesLine : '') +
    '\n' +
    revelation() +
    '\nShe kisses your brow, and turns for home before you can see her cry.\n' +
    event(
      'As you look back at Willowbrook, the chapel bell rings once, ' +
        'though no hand is on the rope.',
    )
  )
}

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

  /**
   * On the Road to Greendale, once Elior is ready, plays the farewell scene
   * and completes the act; elsewhere, or when not ready, only describes the map.
   */
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
        farewell(gameState) +
        '\n' +
        event(`You use the [item_name]${this.name}[/item_name].`) +
        '\n' +
        `The [item_name]${this.name}[/item_name] aligns with the landscape,` +
        ' revealing a ' +
        'hidden path that shortens the journey to Greendale. ' +
        "You tuck your parents' amulet beneath your mother's cloak, and set forth."
      )
    }
    return event(
      `You study the [item_name]${this.name}[/item_name]. It depicts the ` +
        'local area with surprising detail.',
    )
  }
}
