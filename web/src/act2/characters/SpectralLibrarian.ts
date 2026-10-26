import {
  Character,
  type GameState,
  characterName,
  speech,
  attributeSpeech,
  dialogue,
  type NameOptions,
} from '@/engine'
import { AncientAmulet } from '../items/AncientAmulet'
import { CrystalFocus } from '../items/CrystalFocus'
import { MendSpell } from '../spells/MendSpell'
import { DispelSpell } from '../spells/DispelSpell'
import {
  FLAG_LIBRARIAN_CONFESSED,
  FLAG_LIBRARIAN_NOTICED_AMULET,
  FLAG_MENDED_LIBRARY_ENCHANTMENTS,
  FLAG_READ_ANCIENT_CHRONICLE,
  FLAG_SPECTRAL_LIBRARIAN_FRIENDLY,
} from '../Act2StoryFlags'

/** The Ancient Amulet's name as the librarian's lines mark it. */
const AMULET_NAME = 'ancient amulet'

/** What the librarian says on first seeing the amulet. */
const GLANCE_WORDS =
  'I have not seen that worn since the last hand wrote in that chronicle.'

/** What the librarian confesses once the wards are mended. */
const CONFESSION_WORDS =
  'I wore that mark once, when I had a body to wear it in. Whose yours ' +
  'was, I cannot tell you; only that the Wardens did not give them away. ' +
  'We taught the unbinding to those we trusted, and wrote it down for the rest.'

/** Marks an item name in narration. */
function itemName(name: string): string {
  return `[item_name]${name}[/item_name]`
}

/**
 * Ghostly guardian NPC who controls access to the library's deeper lore.
 *
 * A Warden of the Dawn in life: glances at the Ancient Amulet on the first
 * greeting while Elior carries it, and confesses after the wards are mended
 * (once, the first time he carries the amulet), saying "we" about the Wardens
 * from then on. Never names the Wardens of Act III.
 *
 * Becomes friendly once FLAG_MENDED_LIBRARY_ENCHANTMENTS is set: points the
 * player to the Wardens' chronicle, places the Crystal Focus in the room, and
 * on later talks nudges back to the chronicle until FLAG_READ_ANCIENT_CHRONICLE
 * is set, then closes the matter.
 */
export class SpectralLibrarian extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'Spectral Librarian',
      description:
        'A ghostly figure in the worn robes of a working scholar, shimmering ' +
        'with a soft blue light. They watch your hands more than your face, ' +
        'the way a librarian watches anyone standing near the books.',
    })
  }

  /**
   * Speak with the librarian. Before the wards are mended they greet Elior (and
   * glance once at the Ancient Amulet if he carries it); the talk that
   * completes the mending adds the confession of having been a Warden; later
   * talks nudge towards the chronicle and, if the confession was missed because
   * the amulet was left behind, play it once when he carries it.
   */
  override talkTo(gameState: GameState): string {
    const carrying = gameState.inventory.some(
      (item) => item instanceof AncientAmulet,
    )
    if (!gameState.getStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY)) {
      if (gameState.getStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS)) {
        return this.mendingTalk(gameState, carrying)
      }
      return this.greeting(gameState, carrying)
    }
    return this.laterTalk(gameState, carrying)
  }

  /** The greeting before mending; the first one with the amulet opens with the glance. */
  private greeting(gameState: GameState, carrying: boolean): string {
    const greeting = dialogue(
      this.name,
      'Mind the shelves. Everything here has been kept a long time, ' +
        'and the wards on the oldest texts are failing. I can keep a book; ' +
        'I cannot mend one. Mend the wards, and I will show you where to ' +
        'look for the mark you carry.',
    )
    if (!carrying || gameState.getStoryFlag(FLAG_LIBRARIAN_NOTICED_AMULET)) {
      return greeting
    }
    gameState.setStoryFlag(FLAG_LIBRARIAN_NOTICED_AMULET, true)
    return (
      'The ' +
      characterName(this.name) +
      ' turns toward you, and stops. Their eyes have found the ' +
      itemName(AMULET_NAME) +
      ' at your throat.\n\n' +
      dialogue(this.name, `${GLANCE_WORDS}`) +
      '\n\n' +
      greeting
    )
  }

  /** The talk that completes the mending: thanks, the confession if the amulet is carried, the reveal. */
  private mendingTalk(gameState: GameState, carrying: boolean): string {
    gameState.setStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY, true)
    // Add Crystal Focus to the room for player to take
    const crystalFocus = new CrystalFocus()
    gameState.currentRoom.addItem(crystalFocus)
    const mendName = new MendSpell().name
    const dispelName = new DispelSpell().name
    const heardGlance = gameState.getStoryFlag(FLAG_LIBRARIAN_NOTICED_AMULET)
    let confession = ''
    if (carrying) {
      gameState.setStoryFlag(FLAG_LIBRARIAN_NOTICED_AMULET, true)
      gameState.setStoryFlag(FLAG_LIBRARIAN_CONFESSED, true)
      confession = heardGlance
        ? ' Their eyes go back to the ' +
          itemName(AMULET_NAME) +
          '. ' +
          speech(`${CONFESSION_WORDS}`)
        : ' Their eyes find the ' +
          itemName(AMULET_NAME) +
          ' at your throat, and stay there. ' +
          speech(`${GLANCE_WORDS} ${CONFESSION_WORDS}`)
    }
    return (
      attributeSpeech(
        this.name,
        '[success]' +
          speech(
            `You mended the wards with your [spell_name]${mendName}[/spell_name] ` +
              'spell. They have been failing longer than I care to count; ' +
              'thank you. Now, what you came for.',
          ),
      ) +
      confession +
      " The spirit's eyes glow brighter as they speak: " +
      speech(
        'I am a keeper, not a teller. The answer you came for is in that ' +
          'chronicle. We wrote it, and our mark is on its cover. Read it, ' +
          `and you will learn the [spell_name]${dispelName}[/spell_name] ` +
          'spell.',
      ) +
      ' They gesture to a crystal resting on the shelf: ' +
      speech(
        `And take this [item_name]${crystalFocus.name.toLowerCase()}[/item_name]. What you ` +
          'do with them is yours to choose.',
      ) +
      '[/success]'
    )
  }

  /** Later talks: the confession once if missed and the amulet is carried, then the chronicle line. */
  private laterTalk(gameState: GameState, carrying: boolean): string {
    const line = dialogue(
      this.name,
      gameState.getStoryFlag(FLAG_READ_ANCIENT_CHRONICLE)
        ? 'You have read what we left. The rest is not written on ' +
            'any shelf of mine. Use this knowledge wisely.'
        : 'The chronicle is waiting on its shelf. We wrote it for ' +
            'whoever would read it; I cannot read it for you.',
    )
    if (!carrying || gameState.getStoryFlag(FLAG_LIBRARIAN_CONFESSED)) {
      return line
    }
    gameState.setStoryFlag(FLAG_LIBRARIAN_NOTICED_AMULET, true)
    gameState.setStoryFlag(FLAG_LIBRARIAN_CONFESSED, true)
    return (
      'The ' +
      characterName(this.name) +
      "'s eyes go to the " +
      itemName(AMULET_NAME) +
      '.\n\n' +
      dialogue(this.name, `${GLANCE_WORDS} ${CONFESSION_WORDS}`) +
      '\n\n' +
      line
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
