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
        'A young woman who moves slowly and appears weakened by some ' +
        'affliction. Dark circles under her eyes and a pale complexion ' +
        'suggest she is suffering from a magical curse.',
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
      const name = this.name
      return (
        characterName('Elena') +
        ' beams with health and vitality.' +
        '\n\n' +
        dialogue(
          name,
          'Oh, thank you so much! I feel ' +
            "like I'm alive again! The curse is completely gone, and I owe you " +
            'my life. My father is so grateful - he insists you take our ' +
            "family's sacred charm as a token of our eternal gratitude. You " +
            'are truly a hero!',
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
      const name = this.name
      return (
        characterName('Elena') +
        ' coughs weakly.' +
        '\n\n' +
        dialogue(
          name,
          'Hello, traveler. I apologize for my appearance... ' +
            "I've been cursed by a dark wizard who passed through town weeks " +
            'ago. The curse grows stronger each day, draining my life force. ' +
            'My father searches desperately for a cure, but I fear only ' +
            'someone with powerful magical abilities could break such dark ' +
            'magic.',
        )
      )
    } else {
      return (
        characterName('Elena') +
        ' speaks weakly.' +
        '\n\n' +
        dialogue(
          this.name,
          'Have you found a way to break the curse? I can feel my ' +
            'strength fading more each day...',
        )
      )
    }
  }

  /** Handle receiving the greater heal spell as the first step of the cure. */
  receiveGreaterHeal(gameState: GameState): string {
    if (this.elenaInitialHealing) {
      return '[failure]Elena is already strengthened by your healing magic.[/failure]'
    }

    // Set the flag and update Elena's condition
    this.elenaInitialHealing = true
    gameState.setStoryFlag(FLAG_ELENA_HEALED, true)
    this.markShown = true

    // Update Elena's description to show improvement
    this.description =
      'A young woman who appears to be recovering from a serious affliction. ' +
      'While still pale and bearing signs of magical corruption, the healing ' +
      'magic has restored some of her strength and vitality. Her eyes show ' +
      'hope for the first time in weeks.' +
      ' On the inside of her wrist, a small silver mask shows through her skin.'

    return (
      "[success]Powerful healing energy flows into Elena's weakened form. The golden " +
      'light battles against the dark tendrils of the curse, and while it cannot ' +
      "break the enchantment completely, it significantly strengthens Elena's " +
      'life force. She gasps as color returns to her cheeks and she stands a ' +
      'little straighter.\n\n' +
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
      return '[failure]Elena has already been purified with the crystal-clear water.[/failure]'
    }

    if (!this.elenaInitialHealing) {
      return (
        'Elena is too weak from the curse; the water would run off her ' +
        'like rain off stone. She wants mending first.'
      )
    }

    // Check if player has crystal-clear water
    if (!gameState.hasItem('crystal-clear water')) {
      return 'You need [item_name]crystal-clear water[/item_name] to purify Elena.'
    }

    // Use the crystal-clear water and set the purification flag
    this.elenaPurified = true

    // Update Elena's description to show purification
    this.description =
      'A young woman who radiates a faint, pure light. The blessed water has ' +
      'cleansed away much of the dark corruption, leaving her looking almost ' +
      'healthy. Her skin has a subtle luminous quality and her eyes are bright ' +
      'with hope, though traces of the curse still linger.' +
      (this.markShown
        ? ' The silver mask on her wrist is untouched by the water.'
        : '')

    return (
      "[success]The blessed water sparkles with divine light as it touches Elena's " +
      'skin, and dark shadows begin to steam away like smoke. Elena gasps ' +
      'as the corrupting influence of the curse is washed from her body and ' +
      'soul. The water glows brighter, purifying every drop of dark magic it ' +
      'touches.\n\n' +
      'As the last of the water drips away, Elena stands straighter, her skin ' +
      "glowing with a faint, pure radiance. The curse's hold on her has been " +
      'greatly weakened by the purification.[/success]'
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
      'A vibrant young woman who radiates health and vitality. Her eyes ' +
      'sparkle with life, and her complexion glows with natural beauty. ' +
      'She moves with grace and energy, completely free from the dark curse ' +
      'that once plagued her. She looks at you with deep gratitude and joy.'

    return (
      '[success]Counter-magic floods the remaining curse fragments. ' +
      'The spell tears through the last dark tendrils like lightning, ' +
      'shattering the evil enchantment completely. Elena cries out in relief ' +
      'as the final traces of the curse dissolve into nothingness.\n\n' +
      'She stands tall and straight, her skin glowing with perfect health. ' +
      'The curse that has tormented her for weeks is finally broken! Elena ' +
      'looks at you with tears of joy, completely free at last. The three-step ' +
      'healing process - greater heal, purification, and dispelling - has ' +
      'worked perfectly to save her life.[/success]' +
      '\n\n' +
      'On her wrist the silver mask goes on smiling a moment longer, then ' +
      'fades like breath on a cold window, and is gone.'
    )
  }
}
