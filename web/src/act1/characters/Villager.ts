import {
  Character,
  type GameState,
  type Item,
  characterName,
  remembered,
  speech,
  attributeSpeech,
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
 * village rumors (one of them uses Malakar's name as the village does, a
 * byword for bad luck), asks Elior about the well once it runs clean, and
 * knows he is leaving when she sees Mira's amulet. She also answers to `villager`,
 * the name she went by before she had one.
 */
export class Villager extends Character {
  /** Her rumours, in the order she tells them. */
  private static readonly RUMOURS: readonly string[] = [
    'Have you seen the fields? Green on market day, grey by the next ' +
      "morning. My husband says it's the soil. He also said it would rain " +
      'last Tuesday.',
    'Last night, someone spotted a cloaked stranger near the old well, asking after ' +
      'an old amulet, from a family that left. Nobody would tell him a thing, ' +
      'and he took the road to the mill.',
    "The animals are restless. My neighbor's dog howled at nothing for hours, and the " +
      'chickens refuse to leave their coop after dusk. ' +
      "Malakar's weather, my mother would have called it, and knocked on wood.",
    "Somebody's been down at the river bend. Good boots, not from round " +
      "here. The prints go right to the water's edge and just stand there, " +
      'my cousin says, like he waited a long while.',
    'Did you know the chapel bell rang once by itself? Years back, at ' +
      'midnight, with no hand on the rope. My mother knocked on wood for ' +
      'a week.',
    "They say the king's taken to his bed in Greendale, and not one " +
      "physician can name what ails him. And the flour cart didn't come " +
      "Thursday. Eleven years, and it's never once missed a Thursday.",
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
    `${characterName(Villager.NAME)}, the baker's wife, flour to the ` +
    'elbows. She knows what everyone in Willowbrook had for breakfast, and ' +
    'who they ate it with.'

  /**
   * Bring a villager from a save made before she was named up to date: she
   * is Tilda now, with her new description and current rumours (her place in the cycle is kept). Safe to run more than once.
   */
  migrateLegacyName(): void {
    this.name = Villager.NAME
    this.description = Villager.DESCRIPTION
    this.dialogueOptions = [...Villager.RUMOURS]
  }

  /** She hands any gift back with a warning; the reply never names the item. */
  override giveItem(_gameState: GameState, _item: Item): string {
    return attributeSpeech(
      this.name,
      `${characterName(this.name)} looks it over with interest and gives it ` +
        'back. ' +
        speech("Don't go giving your things away, love. People will talk."),
    )
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
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /** What Tilda answers when spoken to, before the speaker is labelled. */
  private talkAnswer(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    if (gameState.inventory.some((item) => item instanceof AncientAmulet)) {
      return speech(
        `${characterName('Mira')}'s amulet... ` +
          "you're leaving, aren't you? " +
          "Well. Don't you dare go without a proper send-off from the bakery. " +
          'And mind you come home, love.',
      )
    }
    if (
      this.wellIsPurified(gameState) &&
      !gameState.getStoryFlag(FLAG_TILDA_ASKED_ABOUT_WELL)
    ) {
      gameState.setStoryFlag(FLAG_TILDA_ASKED_ABOUT_WELL, true)
      return (
        speech(
          "The water's clean! I've not had dough rise so light in a year. " +
            `Was that you, ${characterName('Elior')}?`,
        ) + ' She looks at you, and waits.'
      )
    }
    if (
      gameState.getStoryFlag(FLAG_TILDA_ASKED_ABOUT_WELL) &&
      !gameState.getStoryFlag(FLAG_TILDA_SPRING_LINE_SAID) &&
      !gameState.hasVirtue(VIRTUE_TRUTH)
    ) {
      gameState.setStoryFlag(FLAG_TILDA_SPRING_LINE_SAID, true)
      return speech(
        "Not a word, eh? Then it'll be the old spring clearing itself, " +
          'like my gran always said it would. Funny old world.',
      )
    }
    const rumor = this.dialogueOptions[this.dialogueIndex]
    // Cycle through dialogue
    this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogueOptions.length
    return speech(rumor)
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
      return attributeSpeech(
        this.name,
        speech("The truth about what, love? You've lost me."),
      )
    }
    if (gameState.hasVirtue(VIRTUE_TRUTH)) {
      return attributeSpeech(
        this.name,
        speech("I know, love. Your secret's safe with me, and so's your loaf."),
      )
    }
    gameState.addVirtue(VIRTUE_TRUTH)
    return (
      `You tell ${characterName(this.name)} it was you: ` +
      'a spell, and a little help from the healer.' +
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
