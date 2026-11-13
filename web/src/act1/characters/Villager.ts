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
import { RuneToken } from '../items/RuneToken'

/** The byword for Malakar, said anywhere in the words. */
const MALAKAR = /malakar/i

/** The healer's name, which she answers with gossip. */
const MIRA = /\bmira\b/i

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

  /** Tilda's look: always the current wording, even for an older save. */
  override descriptionFor(_gameState: GameState): string {
    return Villager.DESCRIPTION
  }

  /**
   * Bring a villager from a save made before she was named up to date: she
   * is Tilda now, with her new description and current rumours (her place in the cycle is kept). Safe to run more than once.
   */
  migrateLegacyName(): void {
    this.name = Villager.NAME
    this.dialogueOptions = [...Villager.RUMOURS]
  }

  /**
   * She hands any gift back with a warning; Mira's amulet she will not take
   * with floury hands and bids him hide, and the rune token she will not
   * touch, and knocks on wood. Only those two replies name what they are.
   */
  override giveItem(_gameState: GameState, item: Item): string {
    if (item instanceof AncientAmulet) {
      return attributeSpeech(
        this.name,
        `${characterName(this.name)} keeps her floury hands behind her back. ` +
          speech(
            "Not with these, love. That's Mira's, and it's not for passing " +
              'round the square.',
          ) +
          ' She lowers her voice. ' +
          speech(
            'There was a stranger asking after an old amulet. Keep that one ' +
              'under your shirt.',
          ) +
          ' She glances round the square, as if somebody might be listening.',
      )
    }
    if (item instanceof RuneToken) {
      return attributeSpeech(
        this.name,
        `${characterName(this.name)} snatches her hand back before the ` +
          'token can touch it. ' +
          speech(
            "That's an ill thing, love. My mother would have knocked on wood " +
              'just to look at it.',
          ) +
          ' She knocks on the nearest wood, to be sure. ' +
          speech(
            "Put it away before somebody sees, or it'll be all round the " +
              'village by supper.',
          ),
      )
    }
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
            `Was that you, ${characterName('Elior')}? ` +
            'Go on, love, tell me true.',
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
   * Hush at the byword "Malakar" (knocking on wood, whatever else is
   * going on). Take the truth about the well. Once the well is purified and she has
   * asked, saying "truth" or "yes" tells her it was Elior: her reply and the
   * remembered line, recorded once. Earlier she is lost ("truth") or gives the
   * usual reply (anything else); later she keeps the secret. Other words,
   * while she still waits for an answer, are met with a nudge toward the
   * truth; Mira's name gets her gossip about the healer.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (MALAKAR.test(words)) return this.knock()
    const asked = gameState.getStoryFlag(FLAG_TILDA_ASKED_ABOUT_WELL)
    const isTruth = /\btruth\b/i.test(words)
    const isYes = /\byes\b/i.test(words)
    const stillWaiting =
      asked &&
      !gameState.getStoryFlag(FLAG_TILDA_SPRING_LINE_SAID) &&
      !gameState.hasVirtue(VIRTUE_TRUTH) &&
      !gameState.inventory.some((item) => item instanceof AncientAmulet)
    if (stillWaiting && !isTruth && !isYes) {
      return attributeSpeech(
        this.name,
        speech('Come now, love. Tell me the truth.'),
      )
    }
    if (!isTruth && !(asked && isYes)) {
      if (MIRA.test(words)) return this.miraGossip()
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

  /** Her gossip about the healer, whose name everyone in the square knows. */
  private miraGossip(): string {
    return attributeSpeech(
      this.name,
      `${this.nameInSentence({ atStart: true })} lowers her voice. ` +
        speech(
          `${characterName('Mira')}? My mother swore by her for a cough. ` +
            "Folk say she knows things she oughtn't, love, but nobody's " +
            'ever turned her from their door.',
        ),
    )
  }

  /** Her hush at the byword: the same every time, so it never moves her turn. */
  private knock(): string {
    return attributeSpeech(
      this.name,
      `${this.nameInSentence({ atStart: true })} knocks on the nearest bit of wood, quick, the way her mother did. ` +
        speech(
          'Hush, love. Not out loud, not with the fields the way they are.',
        ),
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

  /** The two answers to a word with no particular reply, given in turn. */
  protected override unknownWordAnswers(): readonly string[] {
    return [
      `${this.nameInSentence({ atStart: true })} cocks her head. ` +
        speech(
          "Go on, love, tell me what that's about and I'll tell you what it means.",
        ),
      `${this.nameInSentence({ atStart: true })} laughs. ` +
        speech(
          "Keep that one to yourself, love, or it'll be round the square by supper.",
        ),
    ]
  }
}
