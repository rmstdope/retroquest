import { Character, type GameState, type Item } from '@/engine'
import { CrystalFocus } from '../items/CrystalFocus'
import { HealingHerbs } from '../items/HealingHerbs'
import { GreaterHealSpell } from '../spells/GreaterHealSpell'
import {
  FLAG_HEALERS_APPRENTICE_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
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

  /** Handle dialogue based on inventory and apprenticeship story flags. */
  override talkTo(gameState: GameState): string {
    // Check if player has healing herbs or crystal focus to give
    const hasHealingHerbs = gameState.hasItem('Healing Herbs')
    const hasCrystalFocus = gameState.hasItem('Crystal Focus')
    if (!gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)) {
      if (hasCrystalFocus) {
        return (
          '[success][character_name]Master Healer Lyria[/character_name] recognizes ' +
          'your magical potential and notices the [item_name]Crystal Focus[/item_name] ' +
          "you carry. [dialogue]'That crystal focus! It's exactly what I need to " +
          "help my patients who are on the brink of death. If you're willing to give " +
          'it to me, I can use it to save lives and teach you advanced healing magic ' +
          "in return.'[/dialogue] Her eyes show both desperation and hope.[/success]"
        )
      } else if (hasHealingHerbs) {
        // First set the accepted flag to trigger the quest
        return (
          '[success][character_name]Master Healer Lyria[/character_name] recognizes ' +
          "your magical potential and says: [dialogue]'I can see you have a natural " +
          "gift for healing magic. If you're willing to give me those " +
          '[item_name]Healing Herbs[/item_name] as proof of your commitment to the ' +
          "healing arts, I will teach you advanced techniques.'[/dialogue] She " +
          'gestures to her collection of healing supplies.[/success]'
        )
      } else {
        return (
          '[character_name]Master Healer Lyria[/character_name]: [dialogue]Welcome to ' +
          'my house of healing. I can sense magical potential in you, but I ' +
          'desperately need help. I have patients on the brink of death who need ' +
          'more powerful healing than I can provide alone. If you could bring me a ' +
          '[item_name]Crystal Focus[/item_name] to amplify my magic, or some ' +
          '[item_name]Healing Herbs[/item_name] to show your commitment to healing, I ' +
          'will teach you advanced techniques.[/dialogue]'
        )
      }
    } else if (gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)) {
      return (
        "[character_name]Master Healer Lyria[/character_name]: [dialogue]It's " +
        "wonderful to see how far you've come with your healing abilities. You're " +
        'truly a master of the healing arts now. Continue to use your gifts to help ' +
        'those in need.[/dialogue]'
      )
    } else {
      return (
        "[character_name]Master Healer Lyria[/character_name]: [dialogue]I'm looking " +
        'forward to teaching you advanced healing techniques. Please bring me a ' +
        '[item_name]Crystal Focus[/item_name] to help my dying patients, or some ' +
        '[item_name]Healing Herbs[/item_name] to show your commitment, so we can begin ' +
        'your training.[/dialogue]'
      )
    }
  }

  /** Handle giving items to Master Healer Lyria. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof CrystalFocus) {
      // Remove Crystal Focus from inventory as it's given to Lyria
      gameState.removeItemFromInventory('Crystal Focus')
      // Complete the quest and learn greater_heal spell
      gameState.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true)
      // Learn greater_heal spell
      gameState.learnSpell(new GreaterHealSpell())
      return (
        '[success][character_name]Master Healer Lyria[/character_name] accepts the ' +
        "[item_name]Crystal Focus[/item_name] with great relief. [dialogue]'This is " +
        'exactly what I needed! With this crystal focus, I can amplify my healing ' +
        "magic to treat patients on the brink of death.'[/dialogue] She immediately " +
        "begins using it to help her critically injured patients. [dialogue]'Through " +
        "your compassion and this magical aid, you've shown yourself ready for " +
        "advanced training.'[/dialogue] She teaches you the " +
        "[spell_name]greater_heal[/spell_name] spell! [dialogue]'You've truly earned " +
        "the title of healer.'[/dialogue][/success]\n\n" +
        "[success]Quest Complete: The Healer's Apprentice[/success]"
      )
    } else if (item instanceof HealingHerbs) {
      // Check if apprentice quest is accepted but not completed
      gameState.setStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED, true)
      // Remove healing herbs from inventory as they're given to Lyria
      gameState.removeItemFromInventory('Healing Herbs')
      return (
        '[success][character_name]Master Healer Lyria[/character_name] accepts the ' +
        "[item_name]Healing Herbs[/item_name] with approval. [dialogue]'Excellent! " +
        "Your commitment shows you're ready to learn.'[/dialogue] Through careful " +
        'instruction, you master the [spell_name]greater_heal[/spell_name] spell! ' +
        "[dialogue]'Use this knowledge wisely, young healer. You've successfully " +
        "completed your apprenticeship.'[/dialogue][/success]"
      )
    }
    // Default response for other items
    return (
      '[character_name]Master Healer Lyria[/character_name] seems to be too busy to ' +
      'receive any gifts from you at the moment.'
    )
  }
}
