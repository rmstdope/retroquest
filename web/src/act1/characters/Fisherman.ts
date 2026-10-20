import {
  Character,
  type GameState,
  type Item,
  event,
  characterName,
  speech,
} from '@/engine'
import { Fish } from '../items/Fish'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { PurifySpell } from '../spells/PurifySpell'
import {
  FLAG_FISHERMAN_TOLD_OF_TIN,
  FLAG_FOUND_MOTHERS_LETTER,
  FLAG_HEALED_FISHERMAN_ARM,
  FLAG_READ_PHOTO_MESSAGE,
} from '../Act1StoryFlags'

/**
 * Fisherman NPC at the river bend: an old friend of Elior's mother who
 * teaches fishing basics, trades a fish for the purify spell she once taught
 * him, tells of the tin she hid when shown the faded photograph, and can have
 * his arm mended with heal.
 */
export class Fisherman extends Character {
  knowsFishingBasics = false
  receivedFish = false
  dialogueStates: Record<string, string> = {
    initial:
      `The ${characterName('fisherman')} nods at you. ` +
      speech(
        "The river's been a bit strange lately. Not many fish biting, and " +
          "my arm... well, it's seen better days. Oh, I wish I could pull up " +
          'a pike or two!',
      ),
    taught_fishing:
      `The ${characterName('fisherman')} smiles. ` +
      speech('Good to see you trying your luck with the rod. Any luck yet?'),
    received_fish_thanks:
      `The ${characterName('fisherman')}'s eyes light up. ` +
      speech(
        "Ah, a fine catch! Thank you kindly. It's been a while since " +
          "I've had a fresh river fish.",
      ),
    taught_spells:
      `The ${characterName('fisherman')} looks out over the water. ` +
      speech(
        'The river has many moods. Treat it with respect, ' +
          'and it might share its secrets with you.',
      ),
  }
  currentDialogueKey = 'initial'

  constructor() {
    super({
      name: 'fisherman',
      description:
        'A weathered old man who spends his days by the riverbank, ' +
        'fishing and humming quiet tunes. He knows much about the river ' +
        'and its secrets.',
    })
  }

  /** Handle talking to the fisherman and teach fishing basics if eligible. */
  override talkTo(gameState: GameState): string {
    // Set the story flag that the player has talked to the fisherman
    gameState.setStoryFlag('talked_to_fisherman', true)
    // Check if player has a fishing rod in the inventory
    const playerHasRod = gameState.hasItem('fishing rod')

    if (this.currentDialogueKey === 'initial') {
      if (playerHasRod && !gameState.getStoryFlag('learned_fishing_basics')) {
        gameState.setStoryFlag('learned_fishing_basics', true)
        this.knowsFishingBasics = true
        this.currentDialogueKey = 'taught_fishing'
        return (
          `The ${characterName('fisherman')} notices ` +
          'your [item_name]fishing rod[/item_name]. ' +
          speech(this.fishingLesson(gameState)) +
          '\n' +
          'He teaches you the basics of fishing.'
        )
      } else if (gameState.getStoryFlag('learned_fishing_basics')) {
        // If already taught, but currentDialogueKey is still initial, switch
        // to taught_fishing so the dialogue falls through below.
        this.currentDialogueKey = 'taught_fishing'
      } else if (gameState.getStoryFlag(FLAG_HEALED_FISHERMAN_ARM)) {
        return this.healedGreeting()
      } else {
        return this.dialogueStates.initial
      }
    }

    const eventMsg = event(`You speak with the ${characterName(this.name)}.`)
    return eventMsg + '\n' + this.dialogueStates[this.currentDialogueKey]
  }

  /**
   * His greeting once heal has mended his arm. Kept out of `dialogueStates`
   * so saves made before this line existed still greet correctly.
   */
  private healedGreeting(): string {
    return (
      `The ${characterName('fisherman')} nods at you and rolls his mended ` +
      'shoulder. ' +
      speech(
        "The river's been a bit strange lately. Not many fish biting, but " +
          "thanks to you this arm's mended, and I'll have a pike or two out " +
          'of her yet!',
      )
    )
  }

  /**
   * The words he teaches fishing with: before heal he cannot fish with his
   * busted arm, after it he shares his know-how out of gratitude.
   */
  private fishingLesson(gameState: GameState): string {
    const tips =
      "Cast your line near the reeds, that's where they like to hide. " +
      'Patience is key, my friend, patience.'
    if (gameState.getStoryFlag(FLAG_HEALED_FISHERMAN_ARM)) {
      return (
        'Ah, a fellow angler! ' +
        'You mended this old arm, so the least I can do is share what I ' +
        `know. ${tips}`
      )
    }
    return (
      'Ah, a fellow angler! ' +
      "My arm's busted, can't fish myself. But I can tell you a thing " +
      `or two. ${tips}`
    )
  }

  /** Handle items offered to the fisherman and teach spells if appropriate. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof Fish && !this.receivedFish) {
      this.receivedFish = true
      gameState.removeItemFromInventory(item.name)
      // Teach spell
      gameState.learnSpell(new PurifySpell())
      this.currentDialogueKey = 'taught_spells'
      const eventMsg = event(
        `You give the [item_name]${item.name}[/item_name] to the ` +
          `${characterName('Fisherman')}.`,
      )
      return (
        eventMsg +
        '\n' +
        this.dialogueStates.received_fish_thanks +
        ' ' +
        speech(
          "The river's water... it's not been right. Murky. " +
            'Your mother taught me this, by the bend. ' +
            "I reckon it's yours more than mine. With this, you can cleanse " +
            'water,',
        ) +
        ' ' +
        '\n' +
        'You have learned [spell_name]purify[/spell_name]!'
      )
    } else if (item instanceof Fish && this.receivedFish) {
      const eventMsg = event(
        `You offer the [item_name]${item.name}[/item_name] to the ` +
          `${characterName('Fisherman')}.`,
      )
      return (
        eventMsg +
        '\n' +
        `The ${characterName('fisherman')} smiles. ` +
        speech("Thank you, but I've already eaten. Save it for yourself!")
      )
    }

    if (item instanceof FadedPhotograph) {
      return this.showPhotograph(gameState, item)
    }

    const eventMsg = event(
      `You offer the [item_name]${item.name}[/item_name] to the ` +
        `${characterName('Fisherman')}.`,
    )
    return (
      eventMsg +
      '\n' +
      `The ${characterName('fisherman')} looks at the ` +
      '[item_name]' +
      item.name +
      "[/item_name] curiously but doesn't seem to need it."
    )
  }

  /**
   * Show the faded photograph: he recognises Elior's mother, and once its
   * message has been read he tells of the tin she hid under the smooth stone.
   * The photograph stays with Elior.
   */
  private showPhotograph(gameState: GameState, item: Item): string {
    const eventMsg = event(
      `You show the [item_name]${item.name}[/item_name] to the ` +
        `${characterName(this.name)}.`,
    )
    if (!gameState.getStoryFlag(FLAG_READ_PHOTO_MESSAGE)) {
      return (
        eventMsg +
        '\n' +
        `The ${characterName('fisherman')} squints at the photograph, ` +
        'and his face softens. ' +
        speech(
          "That's your mother, sure as the river runs. She was a dear " +
            'friend to me. Turn it over sometime, lad. She never wrote a word ' +
            'without a reason.',
        ) +
        '\nHe hands the photograph back.'
      )
    }
    if (gameState.getStoryFlag(FLAG_FOUND_MOTHERS_LETTER)) {
      return (
        eventMsg +
        '\n' +
        `The ${characterName('fisherman')} nods slowly. ` +
        speech("She'd be proud of you, lad. Keep her words close.")
      )
    }
    if (gameState.getStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN)) {
      return (
        eventMsg +
        '\n' +
        `The ${characterName('fisherman')} points to the water's edge. ` +
        speech(
          'Under the [item_name]smooth stone[/item_name], lad, ' +
            'where the water turns. Go on, search there.',
        )
      )
    }
    gameState.setStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN, true)
    return (
      eventMsg +
      '\n' +
      `The ${characterName('fisherman')} turns the photograph over and reads ` +
      'the back. For a long while he says nothing. ' +
      speech(
        "Where the river bends... that's here, lad. This very spot. " +
          'Your mother came to the bend near every evening. Said the water ' +
          'here was old, older than the village, and it had things to teach.',
      ) +
      '\nHe hands the photograph back. ' +
      speech(
        'The night before she went away, she pressed a little tin into the ' +
          'mud under that [item_name]smooth stone[/item_name] yonder, and made ' +
          'me promise to watch over it. Said if her boy ever came asking, ' +
          "he'd know where to look. I reckon you've come asking.",
      )
    )
  }

  /** Mend his busted arm with heal; he thanks Elior the first time. */
  healArm(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_HEALED_FISHERMAN_ARM)) {
      return (
        `The warm light settles over the ${characterName('fisherman')}, ` +
        'but there is nothing left to mend. ' +
        speech("Arm's as good as new, lad. Save your magic.")
      )
    }
    gameState.setStoryFlag(FLAG_HEALED_FISHERMAN_ARM, true)
    return (
      `A warm light gathers around the ${characterName('fisherman')}'s arm. ` +
      'He flexes his fingers, then lifts the arm above his head and laughs. ' +
      speech(
        'Well, would you look at that! Not a twinge. Your mother mended my ' +
          'scrapes the same way, down by the bend. Thank you, lad. ' +
          "Tomorrow I'll cast my own line again.",
      )
    )
  }
}
