import { Character, type GameState, characterName, speech } from '@/engine'
import { CrystalFocus } from '../items/CrystalFocus'
import { MendSpell } from '../spells/MendSpell'
import { DispelSpell } from '../spells/DispelSpell'
import {
  FLAG_MENDED_LIBRARY_ENCHANTMENTS,
  FLAG_READ_ANCIENT_CHRONICLE,
  FLAG_SPECTRAL_LIBRARIAN_FRIENDLY,
} from '../Act2StoryFlags'

/**
 * Ghostly guardian NPC who controls access to the library's deeper lore.
 *
 * Becomes friendly once FLAG_MENDED_LIBRARY_ENCHANTMENTS is set: points the
 * player to the Wardens' chronicle, places the Crystal Focus in the room, and
 * on later talks nudges back to the chronicle until FLAG_READ_ANCIENT_CHRONICLE
 * is set, then closes the matter.
 */
export class SpectralLibrarian extends Character {
  constructor() {
    super({
      name: 'Spectral Librarian',
      description:
        'A ghostly figure in the worn robes of a working scholar, shimmering ' +
        'with a soft blue light. They watch your hands more than your face, ' +
        'the way a librarian watches anyone standing near the books.',
    })
  }

  /** Speak with the librarian; points to the chronicle once the wards are mended. */
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
          '[success]' +
          characterName(this.name) +
          ': ' +
          speech(
            `'You mended the wards with your [spell_name]${mendName}[/spell_name] ` +
              'spell. They have been failing longer than I care to count; ' +
              "thank you. Now, what you came for.'",
          ) +
          " The spirit's eyes glow brighter as they speak: " +
          speech(
            "'I am a keeper, not a teller. The answer you came for is in that " +
              'chronicle. The Wardens of the Dawn wrote it, and their mark is ' +
              'on its cover, the same mark you wear at your throat. Read it, ' +
              `and you will learn the [spell_name]${dispelName}[/spell_name] ` +
              "spell.'",
          ) +
          ' They gesture to a crystal resting on the shelf: ' +
          speech(
            `'And take this [item_name]${crystalName}[/item_name]. What you ` +
              "do with them is yours to choose.'",
          ) +
          '[/success]'
        )
      }
      return (
        characterName(this.name) +
        ': ' +
        speech(
          "'Mind the shelves. Everything here has been kept a long time, " +
            'and the wards on the oldest texts are failing. I can keep a book; ' +
            'I cannot mend one. Mend the wards, and I will show you where to ' +
            "look for the mark you carry.'",
        )
      )
    }
    if (!gameState.getStoryFlag(FLAG_READ_ANCIENT_CHRONICLE)) {
      return (
        characterName(this.name) +
        ': ' +
        speech(
          "'The chronicle is waiting on its shelf. The Wardens wrote it for " +
            "whoever would read it; I cannot read it for you.'",
        )
      )
    }
    return (
      characterName(this.name) +
      ': ' +
      speech(
        "'You have read what the Wardens left. The rest is not written on " +
          "any shelf of mine. Use this knowledge wisely.'",
      )
    )
  }

  /** Describe the librarian's worn robes and the way they watch hands near the books. */
  override examine(_gameState: GameState): string {
    return (
      'Up close, the ' +
      characterName(this.name) +
      "'s robes are worn thin at the cuffs, the way a working scholar's are. " +
      'They watch your hands more than your face, the way a librarian ' +
      'watches anyone standing near the books.'
    )
  }
}
