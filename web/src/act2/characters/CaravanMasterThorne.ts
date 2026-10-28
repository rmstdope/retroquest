import {
  Character,
  type GameState,
  characterName,
  remembered,
  dialogue,
} from '@/engine'
import {
  FLAG_SPOKEN_TO_CARAVAN_MASTER,
  FLAG_FOUND_LOST_CARAVAN,
  FLAG_BRENN_FORGIVEN,
  FLAG_MERCHANTS_HEALED,
  FLAG_THORNE_HEALING_TOLD,
  VIRTUE_MERCY,
  QUEST_LOST_CARAVAN,
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
        'A weather-beaten caravan master with a ledger under his arm and ' +
        'road dust in the creases of his coat.',
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
    if (!this.hasGivenDocuments) {
      return dialogue(
        this.name,
        `Forgive ${characterName('Brenn')}? Ask me again when my people are home and breathing.`,
      )
    }
    if (gameState.getStoryFlag(FLAG_BRENN_FORGIVEN)) {
      return dialogue(
        this.name,
        "I said one more road, and I meant it. Don't make me regret it.",
      )
    }
    gameState.setStoryFlag(FLAG_BRENN_FORGIVEN, true)
    gameState.addVirtue(VIRTUE_MERCY)
    return (
      `You speak for ${characterName('Brenn')}: the path gave way under him too, and fear is ` +
      'not the same as cowardice. He came back to tell you, when he ' +
      'could have kept running.' +
      '\n' +
      dialogue(
        this.name,
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
        dialogue(
          this.name,
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
        gameState.getQuest(QUEST_LOST_CARAVAN)?.complete(gameState)
        return (
          dialogue(
            this.name,
            'You found them. All of them. … I owe you more than I can pay, ' +
              'so take these instead. My wagon-master says a frightened man ' +
              'in Heavensforth paid him to carry them to Greendale, and begged ' +
              "him to put them in no hands but a knight's. I believe they " +
              "could clear a good man's name.",
          ) +
          '\n' +
          `Thorne hands you a stack of [item_name]${secretDocs.name}[/item_name].`
        )
      } else {
        const usual = dialogue(
          this.name,
          'My people are home, and I still wake up counting them. Those ' +
            'papers I gave you: I hope they find the knight they were meant ' +
            'for.',
        )
        if (gameState.getStoryFlag(FLAG_BRENN_FORGIVEN)) return usual
        return (
          usual +
          '\n\n' +
          dialogue(
            this.name,
            `Which leaves ${characterName('Brenn')}. A guard who runs is no ` +
              "guard. He's sitting in the warehouse waiting for his " +
              "wages, and wages are all he'll get from me.",
          )
        )
      }
    } else if (!gameState.getStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER)) {
      gameState.setStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER, true)
      return (
        dialogue(
          this.name,
          "You've the look of someone who isn't afraid of trees. My caravan " +
            'to Heavensforth never came through: spice, cloth, and my people ' +
            'with it, lost somewhere in the Enchanted Forest. Goods I can ' +
            "write off. People I can't. Would you be willing to search for " +
            "them? I'd be forever in your debt.",
        ) +
        '\n\n' +
        dialogue(
          this.name,
          "Our road to Heavensforth runs along the forest's edge. It was " +
            "safe enough a month ago, while the king's riders patrolled it. " +
            'Nobody patrols it since the king went; every rider the castle ' +
            'has is out looking for him.',
        ) +
        '\n\n' +
        dialogue(
          this.name,
          `${characterName('Brenn')}, my guard, came stumbling back alone ` +
            'two nights ago. Says the ravine path gave way and he ran. Ran! ' +
            "He's skulking in the warehouse now. " +
            "I'll deal with him once my people are home.",
        )
      )
    } else {
      return dialogue(
        this.name,
        "Any word? … No. I've stopped counting the goods. I count the days.",
      )
    }
  }
}
