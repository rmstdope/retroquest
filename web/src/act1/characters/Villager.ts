import {
  Character,
  type GameState,
  event,
  characterName,
  remembered,
  speech,
} from '@/engine'
import {
  FLAG_TILDA_ASKED_ABOUT_WELL,
  FLAG_TILDA_SPRING_LINE_SAID,
  FLAG_VILLAGER_TALKED_TO,
  VIRTUE_TRUTH,
} from '../Act1StoryFlags'
import { AncientAmulet } from '../items/AncientAmulet'
import { Well } from '../items/Well'

/**
 * Tilda, the baker's wife: a friendly Willowbrook local who cycles through
 * village rumors, asks Elior about the well once it runs clean, and knows he
 * is leaving when she sees Mira's amulet. She also answers to `villager`,
 * the name she went by before she had one.
 */
export class Villager extends Character {
  /** Her rumours, in the order she tells them. */
  private static readonly RUMOURS: readonly string[] = [
    'Have you seen the fields lately? The crops are withering overnight, and no one ' +
      "knows why. It's like the land itself is sick...",
    'Last night, someone spotted a cloaked stranger near the old well, asking after ' +
      'an old amulet, from a family that left. Nobody would tell him a thing, ' +
      'and he took the road to the mill.',
    "The animals are restless. My neighbor's dog howled at nothing for hours, and the " +
      'chickens refuse to leave their coop after dusk.',
    'Strange footprints appeared by the riverbank this morning—too large for any ' +
      'villager, and they led straight into the woods.',
    `${characterName('Mira')} says the air feels heavy with magic, and the chapel bell rang by itself at ` +
      "midnight. Something's not right in Willowbrook.",
  ]

  dialogueOptions: string[] = [...Villager.RUMOURS]
  dialogueIndex = 0

  constructor() {
    super({
      name: Villager.NAME,
      description: Villager.DESCRIPTION,
    })
  }

  private static readonly NAME = 'Tilda'
  private static readonly DESCRIPTION =
    `${characterName(Villager.NAME)}, the baker's wife: a friendly ` +
    'Willowbrook local, always eager to share the latest gossip or rumors ' +
    'about the village.'

  /**
   * Bring a villager from a save made before she was named up to date: she
   * is Tilda now, with her new description and current rumours (her place in the cycle is kept). Safe to run more than once.
   */
  migrateLegacyName(): void {
    this.name = Villager.NAME
    this.description = Villager.DESCRIPTION
    this.dialogueOptions = [...Villager.RUMOURS]
  }

  /** She answers to her name, Tilda, and still to villager. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'villager'
  }

  /**
   * Say goodbye once Elior carries the amulet; ask about the well once it
   * runs clean; otherwise share the next rumor. Records that a villager has
   * been talked to.
   */
  override talkTo(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    const eventMsg = event(
      `You speak with ${characterName(this.name)}, the baker's wife.`,
    )
    if (gameState.inventory.some((item) => item instanceof AncientAmulet)) {
      return (
        eventMsg +
        '\n' +
        speech(
          `${characterName('Mira')}'s amulet... ` +
            "you're leaving, aren't you? " +
            "Well. Don't you dare go without a proper send-off from the bakery. " +
            'And mind you come home, love.',
        )
      )
    }
    if (
      this.wellIsPurified(gameState) &&
      !gameState.getStoryFlag(FLAG_TILDA_ASKED_ABOUT_WELL)
    ) {
      gameState.setStoryFlag(FLAG_TILDA_ASKED_ABOUT_WELL, true)
      return (
        eventMsg +
        '\n' +
        speech(
          `The water's clean! Was that you, ${characterName('Elior')}? ` +
            "No — don't tell me, you've that look about you. " +
            "I've not had dough rise so light in a year.",
        )
      )
    }
    if (
      gameState.getStoryFlag(FLAG_TILDA_ASKED_ABOUT_WELL) &&
      !gameState.getStoryFlag(FLAG_TILDA_SPRING_LINE_SAID) &&
      !gameState.hasVirtue(VIRTUE_TRUTH)
    ) {
      gameState.setStoryFlag(FLAG_TILDA_SPRING_LINE_SAID, true)
      return (
        eventMsg +
        '\n' +
        speech(
          "Not a word, eh? Then it'll be the old spring clearing itself, " +
            'like my gran always said it would. Funny old world.',
        )
      )
    }
    const rumor = this.dialogueOptions[this.dialogueIndex]
    // Cycle through dialogue
    this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogueOptions.length
    return eventMsg + '\n' + speech(rumor)
  }

  /**
   * Take the truth about the well. Once the well is purified and she has
   * asked, saying "truth" tells her it was Elior: her reply and the
   * remembered line, recorded once. Earlier she is lost; later she keeps the
   * secret. Any other words get the usual reply.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (words.trim().toLowerCase() !== 'truth') {
      return super.sayTo(gameState, words)
    }
    if (!gameState.getStoryFlag(FLAG_TILDA_ASKED_ABOUT_WELL)) {
      return (
        event(`You speak with ${characterName(this.name)}.`) +
        '\n' +
        speech("The truth about what, love? You've lost me.")
      )
    }
    if (gameState.hasVirtue(VIRTUE_TRUTH)) {
      return (
        event(`You speak with ${characterName(this.name)}.`) +
        '\n' +
        speech("I know, love. Your secret's safe with me, and so's your loaf.")
      )
    }
    gameState.addVirtue(VIRTUE_TRUTH)
    return (
      event(
        `You tell ${characterName(this.name)} it was you: ` +
          'a spell, and a little help from the healer.',
      ) +
      '\n' +
      speech(
        'Magic? In Willowbrook? ... Well. ' +
          "I'll not tell a soul if you'd rather I didn't. " +
          "But I'll know, and I'll be saving you the first loaf every morning.",
      ) +
      '\n' +
      remembered('Truth')
    )
  }

  /** Whether the village well has been purified. */
  private wellIsPurified(gameState: GameState): boolean {
    return (
      gameState.allRooms.VillageWell?.items.some(
        (item) => item instanceof Well && item.isPurified,
      ) ?? false
    )
  }
}
