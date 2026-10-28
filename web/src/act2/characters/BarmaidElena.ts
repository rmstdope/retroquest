import {
  Character,
  type GameState,
  characterName,
  clue,
  dialogue,
} from '@/engine'
import {
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_ELENA_HEALED,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_MARCUS_TOLD_TRUTH,
  QUEST_INNKEEPERS_DAUGHTER,
} from '../Act2StoryFlags'

/**
 * Afflicted NPC central to the Innkeeper's Daughter quest and multi-step cure.
 *
 * Recovery sequence: `receiveGreaterHeal` (stabilization), then
 * `receiveCrystalWaterPurification` (cleansing), then `receiveDispelFinalCure`
 * (sets the quest completion flag). Each phase updates the description.
 *
 * From the greater heal until the dispel the Sorceress of Lies' silver mask
 * shows on her wrist: it is in her description, and she remarks on it once.
 *
 * Once she is cured and Elior has told Marcus the truth, her next talk opens
 * with one remark about her father; it never repeats.
 */
export class BarmaidElena extends Character {
  elenaInitialHealing = false
  elenaPurified = false
  /** True from the greater heal until the dispel: the silver mask shows on her wrist. */
  markShown = false
  /** True once Elena has spoken her lines about the mark. */
  markSpoken = false
  /** True once Elena has remarked on her father after he was told the truth. */
  truthRemarkSpoken = false

  constructor() {
    super({
      name: 'barmaid elena',
      description:
        'A young woman who moves slowly, as if every tray weighs twice what ' +
        'it should. Her lips are grey, and the cup she sets down rattles.',
    })
  }

  /** She answers to her name, Elena, as well as to barmaid elena. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'elena'
  }

  /** Dialogue for the current stage of her recovery, with one-off remarks first. */
  override talkTo(gameState: GameState): string {
    const reply = this.stageReply(gameState)
    if (
      this.markShown &&
      !this.markSpoken &&
      !gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)
    ) {
      this.markSpoken = true
      return (
        characterName('Elena') +
        ' sees you looking at her wrist and tugs her sleeve down over the ' +
        'silver mark.' +
        '\n\n' +
        dialogue(
          this.name,
          'It came the same night as the curse. Since then I dream of a ' +
            'smiling face with no eyes, and it never says a true word.',
        ) +
        '\n\n' +
        reply
      )
    }
    if (
      gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED) &&
      gameState.getStoryFlag(FLAG_MARCUS_TOLD_TRUTH) &&
      !this.truthRemarkSpoken
    ) {
      this.truthRemarkSpoken = true
      return (
        characterName('Elena') +
        ' glances toward the taproom.' +
        '\n\n' +
        dialogue(
          this.name,
          'Father has bolted every shutter in the house, and he sleeps down ' +
            'in the taproom now with the poker across his knees. ' +
            "I'm glad you told him. He'd have gone on blaming the wind.",
        ) +
        '\n\n' +
        reply
      )
    }
    return reply
  }

  /** Elena's reply for her current stage of recovery. */
  private stageReply(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)) {
      return (
        characterName('Elena') +
        ' sets her tray down and takes both your hands.' +
        '\n\n' +
        dialogue(
          this.name,
          "Oh, thank you so much! I'm warm. I'd forgotten what that was " +
            'like. Father says the charm over our door is yours now, and he ' +
            "won't hear a word against it.",
        )
      )
    } else if (this.elenaPurified) {
      return (
        characterName('Elena') +
        ' rubs at the inside of her wrist.' +
        '\n\n' +
        dialogue(
          this.name,
          'The water stung, and then it was gone, and some of the cold went ' +
            'with it. But it is still holding on. I can feel it, here.',
        )
      )
    } else if (this.elenaInitialHealing) {
      return (
        characterName('Elena') +
        ' turns her hand over and looks at it as if it belonged to someone ' +
        'else.' +
        '\n\n' +
        dialogue(
          this.name,
          "It didn't take. I felt it go in, warm as a hearth, and then the " +
            'cold closed over it again.',
        ) +
        '\n\n' +
        dialogue(
          this.name,
          'Master Lyria sat with me once, when it began. If anyone knows ' +
            'what comes next, she does.',
        )
      )
    } else if (!gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE)) {
      gameState.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)
      return (
        characterName('Elena') +
        ' coughs, and turns it into a smile.' +
        '\n\n' +
        dialogue(
          this.name,
          "Sorry. I'm slow today. I'm slow every day now. It's a curse, the " +
            'healers say. It came on me in the night, three weeks back, and ' +
            'every morning I wake a little colder. Father asks anyone who ' +
            "comes in with a staff. I think he's run out of people to ask.",
        )
      )
    } else {
      return (
        characterName('Elena') +
        ' pulls her shawl tighter.' +
        '\n\n' +
        dialogue(
          this.name,
          "Still here. Still cold. … Don't look like that. You're the first " +
            'in weeks who came back to ask.',
        )
      )
    }
  }

  /** Handle receiving the greater heal spell as the first step of the cure. */
  receiveGreaterHeal(gameState: GameState): string {
    if (this.elenaInitialHealing) {
      return '[failure]Elena is as strong as healing will make her.[/failure]'
    }

    // Set the flag and update Elena's condition
    this.elenaInitialHealing = true
    gameState.setStoryFlag(FLAG_ELENA_HEALED, true)
    this.markShown = true

    // Update Elena's description to show improvement
    this.description =
      'A young woman with a little colour back in her face. She still moves ' +
      'carefully, like someone waiting for the cold to come back.' +
      ' On the inside of her wrist, a small silver mask shows through her skin.'

    return (
      '[success]Golden light goes into Elena from your hands. She gasps as ' +
      'colour comes back to her cheeks, and she stands a little straighter.' +
      '\n\n' +
      'The healing has made her stronger, but the curse still clings to ' +
      'her.[/success]' +
      '\n\n' +
      'As the golden light fades, something surfaces on the inside of ' +
      "Elena's wrist: a small silver mark in the shape of a mask, smooth and " +
      'smiling, with no eyes behind it. The curse is wearing a face. You ' +
      'have never seen its like, and you cannot say whose it is.'
    )
  }

  /** Handle using crystal-clear water on Elena as the second step of the cure. */
  receiveCrystalWaterPurification(gameState: GameState): string {
    if (this.elenaPurified) {
      return (
        '[failure]The water has done what water can. Whatever is left in ' +
        'her, it will not wash out.[/failure]'
      )
    }

    if (!this.elenaInitialHealing) {
      return (
        'Elena is too weak from the curse; the water would run off her ' +
        'like rain off stone. She must be made strong first.'
      )
    }

    // Check if player has crystal-clear water
    if (!gameState.hasItem('crystal-clear water')) {
      return 'There is no water in your hands to wash her with.'
    }

    // Use the crystal-clear water and set the purification flag
    this.elenaPurified = true

    // Update Elena's description to show purification
    this.description =
      'A young woman, steadier now, with the grey gone from her skin. She ' +
      'keeps rubbing the inside of her wrist.' +
      (this.markShown
        ? ' The silver mask on her wrist is untouched by the water.'
        : '')

    return (
      "[success]The water runs over Elena's wrist and down her fingers, and " +
      'where it runs the grey goes out of her skin. She gasps, then breathes ' +
      'easier than she has in weeks.' +
      '\n\n' +
      "Elena stands straighter. The curse's hold on her has been greatly " +
      'weakened by the purification.[/success]'
    )
  }

  /** Handle casting dispel spell on Elena as the final step to complete the cure. */
  receiveDispelFinalCure(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)) {
      return '[failure]Elena has already been completely cured of her curse.[/failure]'
    }

    if (!this.elenaPurified) {
      return this.elenaInitialHealing
        ? clue(
            'The counter-magic breaks against the silver mask ' +
              'on her wrist like water on glass, and the mask smiles wider. ' +
              'Whatever it wears over itself must be washed away before it can ' +
              'be broken.',
          )
        : clue(
            'The counter-magic finds nothing to take hold of: ' +
              'whatever holds her is buried too deep to show itself. ' +
              'Something must draw it to the surface first.',
          )
    }

    this.markShown = false

    // Complete the cure and set the quest completion flag
    gameState.getQuest(QUEST_INNKEEPERS_DAUGHTER)?.complete(gameState)

    // Update Elena's description to show complete healing
    this.description =
      'Elena, quick on her feet again, with a tray on each arm. When she ' +
      'catches your eye she lifts one to you, like a toast.'

    return (
      '[success]The unbinding takes hold, and Elena cries out, once. Then ' +
      'she straightens, and breathes, and looks at her hands as if she had ' +
      'only now got them back.[/success]' +
      '\n\n' +
      'On her wrist the silver mask goes on smiling a moment longer, then ' +
      'fades like breath on a cold window, and is gone.'
    )
  }
}
