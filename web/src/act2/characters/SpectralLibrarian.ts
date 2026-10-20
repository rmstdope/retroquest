import { Character, type GameState } from '@/engine'
import { CrystalFocus } from '../items/CrystalFocus'
import { MendSpell } from '../spells/MendSpell'
import { DispelSpell } from '../spells/DispelSpell'
import {
  FLAG_MENDED_LIBRARY_ENCHANTMENTS,
  FLAG_SPECTRAL_LIBRARIAN_FRIENDLY,
} from '../Act2StoryFlags'

/**
 * Ghostly guardian NPC who controls access to the library's deeper lore.
 *
 * Becomes friendly once FLAG_MENDED_LIBRARY_ENCHANTMENTS is set: reveals the
 * player's heritage, places the Crystal Focus in the room and points to the
 * dispel spell.
 */
export class SpectralLibrarian extends Character {
  constructor() {
    super({
      name: 'Spectral Librarian',
      description:
        'A ghostly figure who appears to be the eternal guardian of this ancient library. ' +
        'Their ethereal form shimmers with a soft blue light. Ancient wisdom gleams in ' +
        'their otherworldly eyes. They wear the robes of a scholar from ages past. Their ' +
        'presence emanates both knowledge and protective purpose. This spirit has ' +
        'watched over these texts for countless years, ensuring only the worthy gain ' +
        'access to the deepest secrets.',
    })
  }

  /** Speak with the librarian; reveals heritage once the wards are mended. */
  override talkTo(gameState: GameState): string {
    // Check if player has mended the protective enchantments first
    const mendedEnchantments = gameState.getStoryFlag(
      FLAG_MENDED_LIBRARY_ENCHANTMENTS,
    )
    if (!gameState.getStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY)) {
      if (mendedEnchantments) {
        gameState.setStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY, true)
        // Add Crystal Focus to the room for player to take
        const crystalFocus = new CrystalFocus()
        gameState.currentRoom.addItem(crystalFocus)
        // Get spell names
        const mendSpell = new MendSpell()
        const dispelSpell = new DispelSpell()
        const mendName = mendSpell.name
        const dispelName = dispelSpell.name
        const crystalName = crystalFocus.name
        return (
          `[success][character_name]${this.name}[/character_name]: ` +
          "[dialogue]'Ah, you have repaired the protective enchantments with your " +
          `[spell_name]${mendName}[/spell_name] ` +
          'spell. This shows both magical ability and respect for ancient ' +
          "knowledge. I shall reveal what you seek.'[/dialogue] The spirit's eyes " +
          "glow brighter as they speak: [dialogue]'Your bloodline traces back to " +
          'the ancient mages of Willowbrook, those who were chosen to guard ' +
          "against the rising darkness. Malakar's interest in your village was no " +
          'coincidence - he seeks to corrupt or destroy the magical heritage ' +
          "that flows through your veins.'[/dialogue] They gesture to the ancient " +
          "texts: [dialogue]'Study these tomes " +
          `to learn the [spell_name]${dispelName}[/spell_name] ` +
          `spell, and take this [item_name]${crystalName}[/item_name] to ` +
          'enhance your abilities. Your destiny as one of the Chosen is ' +
          "beginning to unfold.'[/dialogue][/success]"
        )
      }
      return (
        `[character_name]${this.name}[/character_name]: [dialogue]'Welcome, ` +
        'seeker of knowledge. ' +
        'I am the eternal guardian of this repository. The protective enchantments ' +
        'around the most valuable texts have been damaged by time. Prove your ' +
        'worthiness by repairing them, and I shall share the knowledge you ' +
        "seek about your heritage and destiny.'[/dialogue]"
      )
    }
    // Get spell name
    const dispelSpell = new DispelSpell()
    return (
      `[character_name]${this.name}[/character_name]: [dialogue]'You have ` +
      'proven yourself worthy and learned what this library can teach. The ' +
      'knowledge of your ' +
      `bloodline and the [spell_name]${dispelSpell.name}[/spell_name] spell ` +
      'will serve you well in the challenges ahead. Remember: you are part of ' +
      'an ancient lineage chosen to stand against the darkness. Use this ' +
      "knowledge wisely.'[/dialogue]"
    )
  }

  /** Describe the librarian's ghostly scholarly appearance. */
  override examine(_gameState: GameState): string {
    return (
      `The [character_name]${this.name}[/character_name] appears to be a scholar from ` +
      'ancient times, their ethereal form bound to this library by duty and purpose. ' +
      'They radiate wisdom accumulated over centuries of guarding these precious texts. ' +
      "There's something both melancholy and noble about their eternal vigil."
    )
  }
}
