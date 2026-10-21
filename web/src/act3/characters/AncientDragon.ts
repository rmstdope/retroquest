import {
  Character,
  type GameState,
  characterName,
  event,
  speech,
} from '@/engine'
import { DragonsScale } from '../items/DragonsScale'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGON_OATH_SPOKEN,
  FLAG_ACT3_OATH_SCROLLS_EXAMINED,
} from '../Act3StoryFlags'

/** The ancient dragon who guards the Dragon's Scale and holds memories. */
export class AncientDragon extends Character {
  constructor() {
    super({
      name: 'ancient dragon',
      description:
        'A magnificent dragon of immense age, scales gleaming like polished ' +
        'obsidian in the ember-light. Ancient wisdom burns in golden eyes ' +
        'that have witnessed countless ages. Slow breaths stir the air like ' +
        'distant thunder.',
    })
  }

  /** Provide the Dragon's Memory for the storytelling quest. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    // Check if this is the first conversation
    let dialogue = ''
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
      dialogue =
        'The ' +
        characterName(name) +
        "'s voice resonates through " +
        'your mind like distant thunder:\n\n' +
        speech(
          "'Young one, I remember your parents well. Aren and Lysa, " +
            'Wardens of the Dawn. They came to me with their friend ' +
            "Malakar, the three of them laughing, and made the relics as equals.'",
        ) +
        '\n\n' +
        speech(
          "'When Malakar tore a wound in time, it was they who stood " +
            'against him. They poured themselves into a ward. It hides you ' +
            'from his sight, and it holds his wound shut. It is anchored in ' +
            'the amulet you carry, and in the bindings of your king. That ' +
            "is why Malakar drains him.'",
        ) +
        '\n\n' +
        speech(
          "'They are not gone as the dead are gone, child. They are " +
            "warded away, not dead.'",
        ) +
        '\n\n'
    }
    dialogue =
      dialogue +
      ('The ' +
        characterName(name) +
        ' rumbles softly: ' +
        speech(
          "'The memory has been shared. Your path leads forward now, not " +
            'back. The scale awaits when you are ready to prove your ' +
            "selflessness.'",
        ))
    return dialogue
  }

  /** Handle saying something to the dragon, particularly oaths. */
  override sayTo(gameState: GameState, words: string): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)) {
      return (
        "The dragon's eyes glint with ancient wisdom. You should probably " +
        'listen to what it has to say first.'
      )
    }
    if (words.toLowerCase() === 'oath') {
      if (!gameState.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)) {
        return (
          'The ' +
          characterName(this.name) +
          "'s golden eyes " +
          'narrow slightly. ' +
          speech(
            "'You " +
              'must first understand the weight of the oath you wish to ' +
              'speak. You can not just speak any oath. You must speak one ' +
              "that proves your selflessness.'",
          )
        )
      }
      // Check if the oath has already been spoken
      if (gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)) {
        return (
          'The ' +
          characterName(this.name) +
          ' rumbles: ' +
          speech(
            "'The oath has been given and accepted. The scale is yours " +
              "to claim.'",
          )
        )
      }
      // Accept the oath and make the scale available
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN, true)
      // Add the dragon's scale to the current room
      const dragonsScale = new DragonsScale()
      gameState.currentRoom.addItem(dragonsScale)
      return (
        event(
          'You speak your oath to the ' +
            characterName(this.name) +
            ', pledging ' +
            'your commitment to selflessness and the protection of others.',
        ) +
        '\n' +
        "[success]The dragon's golden eyes regard you with ancient wisdom. " +
        speech(
          "'Your words ring true, young one. The scale is yours to bear. " +
            "May you carry its burden with honor.'",
        ) +
        '[/success]'
      )
    }
    return (
      'The ' +
      characterName(this.name) +
      ' listens but does ' +
      'not respond to those words. Perhaps you need to speak a more meaningful ' +
      'pledge.'
    )
  }
}
