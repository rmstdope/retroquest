import {
  Character,
  type GameState,
  characterName,
  event,
  remembered,
  speech,
} from '@/engine'
import {
  FLAG_SPOKEN_TO_CARAVAN_MASTER,
  FLAG_FOUND_LOST_CARAVAN,
  FLAG_LOST_CARAVAN_COMPLETED,
  FLAG_BRENN_FORGIVEN,
  FLAG_MERCHANTS_HEALED,
  FLAG_THORNE_HEALING_TOLD,
  VIRTUE_MERCY,
} from '../Act2StoryFlags'
import { SecretDocuments } from '../items/SecretDocuments'

/**
 * Merchant NPC who triggers and rewards the lost caravan side quest. He names
 * his guard Brenn in the first talk and, after the rescue, ends every talk
 * with his verdict on him until Elior speaks for Brenn: the optional mercy
 * moment.
 */
export class CaravanMasterThorne extends Character {
  hasGivenDocuments = false

  constructor() {
    super({
      name: 'caravan master thorne',
      description:
        'A weather-beaten man with worried eyes who oversees merchant caravans. ' +
        'He paces anxiously, clearly distressed about some urgent matter.',
    })
  }

  /** Also answers to his short name, which the `say forgive to thorne` command uses. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'thorne'
  }

  /**
   * Speak for Brenn. Once Elior has returned with the caravan found (the documents talk), saying "forgive" gives Thorne's reply
   * and the remembered line, recorded once. Before it he asks to be asked
   * again; afterwards he keeps his word. Any other words get the usual reply.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (words.trim().toLowerCase() !== 'forgive') {
      return super.sayTo(gameState, words)
    }
    const speaker = characterName(this.name)
    const greeting = event(`You speak with ${speaker}.`)
    if (!this.hasGivenDocuments) {
      return (
        greeting +
        '\n' +
        speech(
          `Forgive ${characterName('Brenn')}? Ask me again when my people are home and breathing.`,
        )
      )
    }
    if (gameState.getStoryFlag(FLAG_BRENN_FORGIVEN)) {
      return (
        greeting +
        '\n' +
        speech("I said one more road, and I meant it. Don't make me regret it.")
      )
    }
    gameState.setStoryFlag(FLAG_BRENN_FORGIVEN, true)
    gameState.addVirtue(VIRTUE_MERCY)
    return (
      event(
        `You speak for ${characterName('Brenn')}: the path gave way under him too, and fear is ` +
          'not the same as cowardice. He came back to tell you, when he ' +
          'could have kept running.',
      ) +
      '\n' +
      speaker +
      ': ' +
      speech(
        "… He did come back, didn't he. … All right. One more road. " +
          'If he runs again, he walks home.',
      ) +
      '\n' +
      remembered('Mercy')
    )
  }

  /**
   * Offer the lost caravan quest, nag about it, or hand over the reward. The
   * first talk after the merchants were healed ends with one line about it.
   */
  override talkTo(gameState: GameState): string {
    const reply = this.usualReply(gameState)
    if (
      gameState.getStoryFlag(FLAG_MERCHANTS_HEALED) &&
      !gameState.getStoryFlag(FLAG_THORNE_HEALING_TOLD)
    ) {
      gameState.setStoryFlag(FLAG_THORNE_HEALING_TOLD, true)
      return (
        reply +
        '\n\n' +
        characterName(this.name) +
        ': ' +
        speech(
          "And my people tell me you didn't just haul them out of that hole " +
            '— you mended them where they sat. One of the spice traders says ' +
            "her hand's never been better. I don't know how a man repays a " +
            'debt twice over.',
        )
      )
    }
    return reply
  }

  /** Thorne's reply for the current point of the lost caravan quest. */
  private usualReply(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_FOUND_LOST_CARAVAN)) {
      if (!this.hasGivenDocuments) {
        // Give Secret Documents as reward
        const secretDocs = new SecretDocuments()
        gameState.inventory.push(secretDocs)
        this.hasGivenDocuments = true
        // Set the flag indicating the lost caravan quest is completed
        gameState.setStoryFlag(FLAG_LOST_CARAVAN_COMPLETED, true)
        const prefix = "You've found them! "
        const middle =
          'I cannot express my gratitude enough for bringing my people back safely. ' +
          'As promised, here is your reward, but this is more than just payment. ' +
          'My wagon-master says a frightened man in Heavensforth paid him to ' +
          'carry these to Greendale, and begged him to put them in no hands but ' +
          "a knight's. I believe they contain evidence that could clear a good " +
          "man's name. Perhaps you'll know what to do with them.\n\n"
        return (
          characterName(this.name) +
          ': ' +
          speech(
            prefix +
              middle +
              `Thorne hands you a stack of [item_name]${secretDocs.name}[/item_name].`,
          )
        )
      } else {
        const usual =
          characterName(this.name) +
          ': ' +
          speech(
            "I'm still processing the relief of having my caravan safely " +
              'returned. Those documents I gave you - I hope they prove useful. ' +
              'Sometimes the right evidence can restore honor where it was ' +
              'unjustly lost.',
          )
        if (gameState.getStoryFlag(FLAG_BRENN_FORGIVEN)) return usual
        return (
          usual +
          '\n\n' +
          characterName(this.name) +
          ': ' +
          speech(
            `Which leaves ${characterName('Brenn')}. A guard who runs is no ` +
              "guard. He's sitting outside the warehouse waiting for his " +
              "wages, and wages are all he'll get from me.",
          )
        )
      }
    } else if (!gameState.getStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER)) {
      gameState.setStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER, true)
      return (
        characterName(this.name) +
        ': ' +
        speech(
          'Thank the gods, someone who looks capable! I desperately need ' +
            'help - one of my most valuable caravans has gone missing in the ' +
            'Enchanted Forest. It was carrying rare goods and several ' +
            'merchants. I fear the worst, but I must know their fate. Would ' +
            'you be willing to search for them? I would be forever in your ' +
            'debt.',
        ) +
        '\n\n' +
        characterName(this.name) +
        ': ' +
        speech(
          'That forest road was safe enough a month ago. Nobody patrols it ' +
            'since the king went; every rider the castle has is out looking ' +
            'for him.',
        ) +
        '\n\n' +
        characterName(this.name) +
        ': ' +
        speech(
          `${characterName('Brenn')}, my guard, came stumbling back alone ` +
            'two nights ago. Says the ravine path gave way and he ran. Ran! ' +
            "I'll deal with him once my people are home.",
        )
      )
    } else {
      return (
        characterName(this.name) +
        ': ' +
        speech(
          'Any word on my missing caravan? Every day that passes makes me ' +
            'fear the worst for those poor souls.',
        )
      )
    }
  }
}
