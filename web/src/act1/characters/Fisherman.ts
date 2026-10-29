import {
  Character,
  type GameState,
  type Item,
  type NameOptions,
  characterName,
  speech,
  attributeSpeech,
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
  currentDialogueKey = 'initial'

  constructor() {
    super({
      name: 'fisherman',
      description:
        'An old man on an upturned crate at the bend, his line in the ' +
        'water and his bad arm held close to his side.',
    })
  }

  /**
   * His line for each stage (`currentDialogueKey`). Built on demand rather
   * than kept in a field, so a save always hears the current wording.
   */
  private dialogue(key: string): string {
    const fisherman = characterName('fisherman')
    switch (key) {
      case 'taught_fishing':
        return (
          `The ${fisherman} smiles. ` +
          speech('Anything biting? Reeds, lad. Always the reeds.')
        )
      case 'received_fish_thanks':
        return (
          `The ${fisherman}'s eyes light up. ` +
          speech("Now that's a fish. Haven't tasted fresh since the arm went.")
        )
      case 'taught_spells':
        return (
          `The ${fisherman} looks out over the water. ` +
          speech(
            "She used to sit right where you're standing, your mother. " +
              'Feet in the water, even in spring. Said it helped her think.',
          )
        )
      default:
        return (
          `The ${fisherman} nods at you. ` +
          speech(
            "River's off this season. Fish are sulking, and this arm's " +
              "gone stiff on me, so I couldn't land one if they weren't.",
          ) +
          ' He looks at the water. ' +
          speech("I'd give a good deal for a fresh fish.")
        )
    }
  }

  /** Named by what it is, so it reads "the fisherman" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /** Handle talking to the fisherman and teach fishing basics if eligible. */
  override talkTo(gameState: GameState): string {
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /** What the fisherman answers when spoken to, before the speaker is labelled. */
  private talkAnswer(gameState: GameState): string {
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
          ' ' +
          speech(
            "By the reeds. That's where they hide. Then you wait, lad. " +
              "Fish don't come to them as hurry.",
          ) +
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
        return this.dialogue('initial')
      }
    }

    return this.dialogue(this.currentDialogueKey)
  }

  /** His greeting once heal has mended his arm. */
  private healedGreeting(): string {
    return (
      `The ${characterName('fisherman')} rolls his mended shoulder at you. ` +
      speech(
        "River's still sulking. But this arm's good as new, and I'll have " +
          'a pike out of her yet.',
      )
    )
  }

  /**
   * What he says on seeing the rod, which was Elior's father's: before heal
   * he cannot fish with his stiff arm, after it he teaches out of gratitude.
   */
  private fishingLesson(gameState: GameState): string {
    const rod = "That was your father's rod, or I'm a trout."
    if (gameState.getStoryFlag(FLAG_HEALED_FISHERMAN_ARM)) {
      return `${rod} You mended this old arm; the least I can do is show you.`
    }
    return `${rod} I can't cast with this arm, but I can show you. Here.`
  }

  /** Handle items offered to the fisherman and teach spells if appropriate. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof Fish && !this.receivedFish) {
      this.receivedFish = true
      gameState.removeItemFromInventory(item.name)
      // Teach spell
      gameState.learnSpell(new PurifySpell())
      this.currentDialogueKey = 'taught_spells'
      return (
        this.dialogue('received_fish_thanks') +
        '\nHe wraps it in a dock leaf and sets it by his crate. Then he is ' +
        'quiet a while. ' +
        speech(
          "Water's not been right. You'll have smelled the well. Your " +
            'mother taught me a thing for that, here at the bend, years ' +
            'back. I reckon it was always more hers than mine.',
        ) +
        '\nHe shows you, slowly.\n' +
        'You have learned [spell_name]purify[/spell_name].'
      )
    } else if (item instanceof Fish && this.receivedFish) {
      return (
        `The ${characterName('fisherman')} pats his belly. ` +
        speech("One's a feast, lad. Two's showing off. Keep it for the road.")
      )
    }

    if (item instanceof FadedPhotograph) {
      return this.showPhotograph(gameState)
    }

    return attributeSpeech(
      this.name,
      `The ${characterName('fisherman')} eyes it, then shrugs. ` +
        speech("Won't catch anything with that, lad."),
    )
  }

  /**
   * Show the faded photograph: he recognises Elior's mother, and once its
   * message has been read he tells of the tin she hid under the smooth stone.
   * The photograph stays with Elior.
   */
  private showPhotograph(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_READ_PHOTO_MESSAGE)) {
      return (
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
        `The ${characterName('fisherman')} nods slowly. ` +
        speech('You found it, then.') +
        ' He looks at the stone a while. ' +
        speech(
          "I've watched that stone a long time, lad. I reckon I can stop now.",
        )
      )
    }
    if (gameState.getStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN)) {
      return (
        `The ${characterName('fisherman')} points to the water's edge. ` +
        speech(
          'Under the [item_name]smooth stone[/item_name], lad, ' +
            "where the water turns. I've not touched it. I promised.",
        )
      )
    }
    gameState.setStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN, true)
    return (
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
