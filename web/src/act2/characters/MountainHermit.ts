import { Character, type GameState, characterName, speech } from '@/engine'
import { FLAG_DEMONSTRATED_COMBAT_SKILLS } from '../Act2StoryFlags'
import { TrainingSword } from '../items/TrainingSword'

/**
 * The Mountain Hermit: a retired castle sergeant who drilled Sir Cedric as a
 * squire.
 *
 * On the first talk he tells Elior about the uneasy city and hands over
 * Cedric's old practice blade with a message for him. Later talks nudge the
 * player to deliver it, then close his thread once Cedric has recognised it.
 */
export class MountainHermit extends Character {
  swordGiven = false
  warnedAboutTimes = false

  constructor() {
    super({
      name: 'mountain hermit',
      description:
        'A broad old man in a patched grey castle cloak, sitting ' +
        'straight-backed by a small fire. His hands are scarred across the ' +
        'knuckles, and he watches the path between Willowbrook and Greendale ' +
        'the way a sentry watches a gate.',
    })
  }

  /** Greet the player, hand over Cedric's sword, or point them onward. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    if (!this.warnedAboutTimes) {
      this.warnedAboutTimes = true
      const greetingMsg =
        'The ' +
        characterName(name) +
        ' looks you up and down, the way he might inspect a recruit.\n' +
        speech(
          'Greendale, is it? Thirty years I drilled squires in that ' +
            "castle's yard, and I've never heard the city so uneasy. The " +
            'king gone, the guard half-empty. Walk carefully.',
        )

      if (!this.swordGiven) {
        // Automatically give the training sword when first spoken to
        return this.giveTrainingSwordWithDialogue(gameState, greetingMsg)
      }
      return greetingMsg
    }
    if (this.swordGiven) {
      if (gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
        return (
          'The ' +
          characterName(name) +
          ' hears you out and grunts, but there is something softer in his ' +
          'face.\n' +
          speech(
            'Knew the notch, did he? Good. Then he knows. Go on, now. ' +
              'Greendale needs him more than I do.',
          )
        )
      }
      return (
        'The ' +
        characterName(name) +
        ' jerks his chin toward Greendale.\n' +
        speech(
          "You've still got that blade, I see. Get it to " +
            characterName('Cedric') +
            ', and mind you give him my words.',
        )
      )
    }
    return this.giveTrainingSwordWithDialogue(gameState, '')
  }

  /** Helper method to give training sword with appropriate dialogue. */
  giveTrainingSwordWithDialogue(
    gameState: GameState,
    greetingMsg: string,
  ): string {
    if (this.swordGiven) {
      return this.alreadyGaveSword()
    }

    const handOver = this.handOverSword(gameState)

    if (greetingMsg) {
      return greetingMsg + '\n\n' + handOver
    }
    return handOver
  }

  /** Gives the player a training sword if it has not already been given. */
  giveTrainingSword(gameState: GameState): string {
    if (this.swordGiven) {
      return this.alreadyGaveSword()
    }
    const handsOver =
      'The ' + characterName(this.name) + ' hands you a battered sword.'
    return handsOver + '\n' + this.handOverSword(gameState)
  }

  /** The line he says when the sword is already in the player's hands. */
  private alreadyGaveSword(): string {
    return (
      'The ' +
      characterName(this.name) +
      ' smiles. ' +
      speech('I already gave you the sword, young one. Use it wisely.')
    )
  }

  /**
   * Put Cedric's old training sword in the player's inventory and return the
   * hand-over scene, ending with the "You receive" line.
   */
  private handOverSword(gameState: GameState): string {
    this.swordGiven = true
    const trainingSword = new TrainingSword()
    gameState.addItemToInventory(trainingSword)

    const swordName = trainingSword.name
    return (
      `He unwraps a battered [item_name]${swordName}[/item_name] from an ` +
      'old cloth.\n' +
      speech(
        'This was ' +
          characterName('Cedric') +
          "'s. I put it in his hands when he was a squire no taller than " +
          'you. They say he slept on watch the night the king went, and ' +
          'lost his spurs for it. Take it to him in the castle yard. Tell ' +
          'him the sergeant never believed a word of it.',
      ) +
      '\n\n' +
      `You receive a [item_name]${swordName}[/item_name]!`
    )
  }
}
