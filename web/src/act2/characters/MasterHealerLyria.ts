import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
} from '@/engine'
import { CrystalFocus } from '../items/CrystalFocus'
import { GreaterHealSpell } from '../spells/GreaterHealSpell'
import {
  FLAG_HEALERS_APPRENTICE_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_ELENA_HEALED,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_LYRIA_DIAGNOSED,
} from '../Act2StoryFlags'

/** NPC mentor who teaches advanced healing and handles the apprenticeship quest. */
export class MasterHealerLyria extends Character {
  constructor() {
    super({
      name: 'Master Healer Lyria',
      description:
        'A wise and nurturing healer with graying hair and gentle eyes that seem to ' +
        'see right through to your magical potential. She wears simple robes adorned ' +
        'with healing herbs, and her hands are steady from years of tending to the ' +
        "sick and wounded. There's an aura of calm competence about her that inspires " +
        'confidence in her abilities.',
    })
  }

  /**
   * Lyria is the one who explains how Elena's curse is lifted: the first talk
   * once the curse is known gives the full diagnosis, later talks until Elena
   * is cured give a one-line reminder, each before her usual reply.
   */
  override talkTo(gameState: GameState): string {
    const usual = this.usualReply(gameState)
    const curseKnown =
      gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE) ||
      gameState.getStoryFlag(FLAG_ELENA_HEALED)
    if (
      !curseKnown ||
      gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)
    ) {
      return usual
    }
    const name = characterName(this.name)
    if (!gameState.getStoryFlag(FLAG_LYRIA_DIAGNOSED)) {
      gameState.setStoryFlag(FLAG_LYRIA_DIAGNOSED, true)
      return (
        characterName('Lyria') +
        ' looks up from her mortar, and something in your face makes her ' +
        'set the pestle down.' +
        '\n\n' +
        name +
        ': ' +
        speech(
          "You've been to the Silver Stag. Marcus's girl, Elena. I have sat " +
            'by her bed myself, and I could do nothing for her. Listen, then, ' +
            'because this is how a curse like hers is lifted, if it can be ' +
            'lifted at all. First she must be made strong, or what comes ' +
            'after will kill her; that wants a deeper healing than I can ' +
            'give alone. Then the mark must be washed in water no shadow has ' +
            'ever touched. You will find none in this city; every well here ' +
            'has seen the dark. And last, the thing must be unbound. Not ' +
            'broken: unbound, with the old kind of unbinding, the kind the ' +
            'scholars wrote down before any of us were born.',
        ) +
        '\n\n' +
        usual
      )
    }
    return (
      name +
      ': ' +
      speech(
        'Elena still? Strengthen her, wash her in untouched water, then ' +
          'unbind it. In that order, or not at all.',
      ) +
      '\n\n' +
      usual
    )
  }

  /** Lyria's reply for the player's current point in the apprenticeship. */
  private usualReply(gameState: GameState): string {
    // The crystal focus is required before Lyria can begin the apprenticeship.
    const hasCrystalFocus = gameState.hasItem('Crystal Focus')
    if (!gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)) {
      if (hasCrystalFocus) {
        return (
          '[success]' +
          characterName('Master Healer Lyria') +
          ' recognizes your magical potential and notices the ' +
          '[item_name]Crystal Focus[/item_name] you carry. ' +
          speech(
            "'That crystal focus! It's exactly what I need to help my patients " +
              "who are on the brink of death. If you're willing to give it to " +
              'me, I can use it to save lives and teach you advanced healing ' +
              "magic in return.'",
          ) +
          ' Her eyes show both desperation and hope.[/success]'
        )
      } else {
        return (
          characterName('Master Healer Lyria') +
          ': ' +
          speech(
            'Welcome to my house of healing. I can sense magical potential in ' +
              'you, but I desperately need help. I have patients on the brink of ' +
              'death who need more powerful healing than I can provide alone. If ' +
              'you could bring me a [item_name]Crystal Focus[/item_name] to ' +
              'amplify my magic, I will teach you advanced healing techniques.',
          )
        )
      }
    } else if (gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)) {
      return (
        characterName('Master Healer Lyria') +
        ': ' +
        speech(
          "It's wonderful to see how far you've come with your healing " +
            "abilities. You're truly a master of the healing arts now. " +
            'Continue to use your gifts to help those in need.',
        )
      )
    } else {
      return (
        characterName('Master Healer Lyria') +
        ': ' +
        speech(
          "I'm looking forward to teaching you advanced healing techniques. " +
            'Please bring me a [item_name]Crystal Focus[/item_name] to help my ' +
            'dying patients, so we can begin your training.',
        )
      )
    }
  }

  /** Handle giving items to Master Healer Lyria. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof CrystalFocus) {
      // Remove Crystal Focus from inventory as it's given to Lyria
      gameState.removeItemFromInventory('Crystal Focus')
      gameState.setStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED, true)
      // Complete the quest and learn greater_heal spell
      gameState.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true)
      // Learn greater_heal spell
      gameState.learnSpell(new GreaterHealSpell())
      return (
        '[success]' +
        characterName('Master Healer Lyria') +
        ' accepts the [item_name]Crystal Focus[/item_name] with great ' +
        'relief. ' +
        speech(
          "'This is exactly what I needed! With this crystal focus, I can " +
            "amplify my healing magic to treat patients on the brink of death.'",
        ) +
        ' She immediately begins using it to help her critically injured ' +
        'patients. ' +
        speech(
          "'Through your compassion and this magical aid, you've shown " +
            "yourself ready for advanced training.'",
        ) +
        ' She teaches you the [spell_name]greater heal[/spell_name] spell! ' +
        speech("'You've truly earned the title of healer.'") +
        "[/success]\n\n[success]Quest Complete: The Healer's " +
        'Apprentice[/success]'
      )
    }
    // Default response for other items
    return (
      characterName('Master Healer Lyria') +
      ' seems to be too busy to receive any gifts from you at the moment.'
    )
  }
}
