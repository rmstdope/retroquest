import {
  Character,
  type GameState,
  characterName,
  event,
  speech,
} from '@/engine'
import { TrainingSword } from '../items/TrainingSword'

/**
 * Hermit NPC who mentors the player and grants the Training Sword.
 *
 * On the first talk the hermit delivers a prophetic warning and hands over the
 * Training Sword; later talks confirm the gift and offer encouragement.
 */
export class MountainHermit extends Character {
  swordGiven = false
  warnedAboutTimes = false

  constructor() {
    super({
      name: 'mountain hermit',
      description:
        'An old man wrapped in weathered robes, with wise eyes that seem to have ' +
        'seen many seasons pass. He sits by a small fire, watching the path ' +
        'between Willowbrook and Greendale with keen interest.',
    })
  }

  /** Warn about the coming darkness and hand over the Training Sword. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    const eventMsg = event('You approach the ' + characterName(name) + '.')

    if (!this.warnedAboutTimes) {
      this.warnedAboutTimes = true
      const warningMsg =
        'The ' +
        characterName(name) +
        ' looks up from his fire with ancient eyes. ' +
        speech(
          "'Ah, a traveler heading to Greendale. I sense great changes " +
            'coming to these lands. Dark forces stir, and heroes will be ' +
            'needed in the days ahead. You have the look of one who might rise ' +
            "to such challenges.'",
        )

      if (!this.swordGiven) {
        // Automatically give the training sword when first spoken to
        return this.giveTrainingSwordWithDialogue(
          gameState,
          eventMsg,
          warningMsg,
        )
      }
      return eventMsg + '\n' + warningMsg
    }
    if (this.swordGiven) {
      const trainingSword = new TrainingSword()
      const swordName = trainingSword.name
      return (
        eventMsg +
        '\nThe ' +
        characterName(name) +
        ' nods sagely. ' +
        speech(
          `'The [item_name]${swordName}[/item_name] I gave you will serve ` +
            'you well in Greendale. Show them your skill, and doors will open. ' +
            "May your journey be blessed with wisdom and courage.'",
        )
      )
    }
    return this.giveTrainingSwordWithDialogue(gameState, eventMsg, '')
  }

  /** Helper method to give training sword with appropriate dialogue. */
  giveTrainingSwordWithDialogue(
    gameState: GameState,
    eventMsg: string,
    warningMsg: string,
  ): string {
    if (this.swordGiven) {
      const name = this.name
      return (
        'The ' +
        characterName(name) +
        ' smiles. ' +
        speech("'I already gave you the sword, young one. Use it wisely.'")
      )
    }

    this.swordGiven = true
    const trainingSword = new TrainingSword()
    gameState.addItemToInventory(trainingSword)

    const swordName = trainingSword.name
    const swordDialogue =
      `He reaches into his pack and pulls out a [item_name]${swordName}` +
      '[/item_name]. ' +
      speech(
        "'Take this. If you mean to help Greendale, you'll need to prove " +
          'your skills to those who matter. This blade has served me well ' +
          "in teaching others.'",
      ) +
      '\n\n' +
      event(`You receive a [item_name]${swordName}[/item_name]!`)

    if (warningMsg) {
      return eventMsg + '\n' + warningMsg + '\n\n' + swordDialogue
    }
    return eventMsg + '\n' + swordDialogue
  }

  /** Gives the player a training sword if it has not already been given. */
  giveTrainingSword(gameState: GameState): string {
    if (this.swordGiven) {
      const name = this.name
      return (
        'The ' +
        characterName(name) +
        ' smiles. ' +
        speech("'I already gave you the sword, young one. Use it wisely.'")
      )
    }

    this.swordGiven = true
    const trainingSword = new TrainingSword()
    gameState.addItemToInventory(trainingSword)

    const eventMsg = event(
      'The ' +
        characterName(this.name) +
        ` hands you the [item_name]${trainingSword.name}[/item_name].`,
    )
    const swordName = trainingSword.name
    const dialogueBlock =
      speech(
        "'This blade has trained many would-be heroes. It may not be sharp " +
          'enough for battle, but it will show your skill to those who need ' +
          "convincing. Use it well in Greendale.'",
      ) + '\n\n'
    const receiveEvent = event(
      `You receive a [item_name]${swordName}[/item_name]!`,
    )
    return eventMsg + '\n' + dialogueBlock + receiveEvent
  }
}
