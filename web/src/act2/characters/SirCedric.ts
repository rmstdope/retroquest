import { Character, type GameState, characterName, speech } from '@/engine'
import { Coins } from '../items/Coins'
import { NaturesCharm } from '../items/NaturesCharm'
import {
  FLAG_SPOKEN_TO_SIR_CEDRIC,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_NYX_TRIALS_COMPLETED,
} from '../Act2StoryFlags'

/** Noble knight who recruits allies and awards honor-based quests. */
export class SirCedric extends Character {
  receivedNaturesCharm = false
  cedricTrustsElior = false

  constructor() {
    super({
      name: 'sir cedric',
      description:
        'A noble knight in gleaming armor, bearing the scars of many battles. ' +
        'His eyes hold wisdom and determination as he prepares for the ' +
        'challenges ahead.',
    })
  }

  /** Recruit Elior, reward the knight's test and hand over Nature's Charm. */
  override talkTo(gameState: GameState): string {
    // Check if Nyx trials are completed - highest priority response
    if (gameState.getStoryFlag(FLAG_NYX_TRIALS_COMPLETED)) {
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'My friend, I sense something extraordinary has happened. You ' +
            'carry an aura of ancient magic, and your eyes hold depths I had ' +
            'not seen before. Have you succeeded in your quest to find Nyx? ' +
            'The prophetic vision spell you learned is the sort of mystical ' +
            'knowledge we need. With your ability to glimpse possible futures, ' +
            'we can better anticipate threats and develop strategies to ' +
            'counter them. You have become a formidable ally in our fight ' +
            'against the darkness.',
        )
      )
    }

    if (
      gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED) &&
      !this.receivedNaturesCharm
    ) {
      // Honor has been restored, give Nature's Charm
      this.receivedNaturesCharm = true
      const charm = new NaturesCharm()
      gameState.inventory.push(charm)

      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'My friend, I cannot express how grateful I am. You have restored ' +
            'my honor and cleared my name of those terrible accusations. The ' +
            'weight I carried for so long has been lifted from my shoulders.',
        ) +
        '\n\n' +
        characterName('Sir Cedric') +
        ' reaches into his pack and withdraws an ancient wooden charm.' +
        '\n\n' +
        characterName('Sir Cedric') +
        ': ' +
        speech(
          "Please accept this Nature's Charm. It has been in my family for " +
            'generations, blessed by the ancient knights who first made pacts ' +
            'with the forest spirits. The old texts say this is one of three ' +
            'sacred charms needed to summon Nyx. You have proven yourself a ' +
            'true friend, and I believe you will need this for the greater ' +
            'challenges ahead.',
        )
      )
    }

    if (gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)) {
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'Thanks to your efforts, my honor has been restored and the false ' +
            'accusations cleared from my record. I stand ready to face the ' +
            'challenges ahead with renewed purpose and dignity.',
        )
      )
    }

    if (!gameState.getStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC)) {
      // First meeting - explain the main quest and give knight's test
      gameState.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'Greetings, traveler. I am ' +
            characterName('Sir Cedric') +
            '. I have been seeking individuals of courage and skill for a ' +
            'matter of great importance. Dark forces are gathering; I call it ' +
            "the 'Gathering Storm', and I need allies with magical knowledge " +
            'and proven abilities. Before I can trust you with this ' +
            'responsibility, I need proof of your combat skills. Can you ' +
            'demonstrate your martial abilities?',
        )
      )
    } else if (
      gameState.isQuestCompleted("The Knight's Test") &&
      !this.cedricTrustsElior
    ) {
      this.cedricTrustsElior = true

      // Give Elior 100 individual coins using the new batching system
      const coin = new Coins(1) // Create a single coin worth 1 gold
      gameState.addItemToInventory(coin, 100) // Add 100 of them

      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'Excellent demonstration! Your combat skills are impressive. I can ' +
            'see you have the training and discipline needed for the ' +
            'challenges ahead.',
        ) +
        '\n\n' +
        characterName('Sir Cedric') +
        ' reaches into his pouch and hands you a bag of coins.' +
        '\n\n' +
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'Please accept these 100 gold coins. I should have provided them ' +
            "earlier for your supply purchasing. You'll need proper equipment " +
            'for the forest expedition: a survival kit, an enhanced lantern, ' +
            'and quality rope from the Market District. The realm faces a ' +
            'great threat, and we must be prepared.',
        )
      )
    } else if (this.cedricTrustsElior) {
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'How goes your preparation? The gathering storm grows stronger ' +
            'each day. I trust you are making good progress in gathering ' +
            'allies and supplies.',
        )
      )
    }
    return (
      characterName('Sir Cedric') +
      ': ' +
      speech(
        'I await your demonstration of combat skills before we can proceed ' +
          'with more serious matters.',
      )
    )
  }
}
