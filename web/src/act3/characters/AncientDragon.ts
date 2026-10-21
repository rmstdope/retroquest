import {
  Character,
  type GameState,
  characterName,
  event,
  speech,
} from '@/engine'
import { AncientAmulet } from '../items/AncientAmulet'
import { DragonsScale } from '../items/DragonsScale'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGON_OATH_SPOKEN,
  FLAG_ACT3_DRAGON_VOICE_HEARD,
  FLAG_ACT3_DRAGON_MESSAGE_GIVEN,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_OATH_SCROLLS_EXAMINED,
  FLAG_ACT3_SIGILS_MENDED,
} from '../Act3StoryFlags'

/** The ancient dragon who guards the Dragon's Scale and holds memories. */
export class AncientDragon extends Character {
  constructor() {
    super({
      name: 'ancient dragon',
      description:
        'A magnificent dragon of immense age, scales gleaming like polished ' +
        'obsidian in the ember-light. Ancient wisdom burns in golden eyes ' +
        'that have witnessed countless ages. Slow breaths stir the air like ' +
        'distant thunder.',
    })
  }

  /**
   * The dream voice and the Dragon naming it: narration with the whispered
   * words in italics (no speaker label), the Dragon's one line and the
   * closing event. Heard once; the caller guards it with the voice flag.
   */
  private voiceMoment(): string {
    return (
      "Then, beneath the dragon's breathing, another voice: the whisper " +
      'from your dream, at the very edge of hearing. ' +
      '[italic]“Elior… little one. Help me. I cannot hold it shut ' +
      'alone.”[/italic] You know it the way you know a song someone sang ' +
      'to you before you had words for it. Then it is gone.\n\n' +
      'You look up at the ' +
      characterName(this.name) +
      '. Its golden eyes are half closed.\n\n' +
      speech('The friend who stayed behind.') +
      '\n\n' +
      event('It says no more.') +
      '\n\n'
    )
  }

  /**
   * The dragon's message for the healer who waits at the Cavern Mouth,
   * given once, after the voice and before the closing rumble. Mira passes
   * it on at her next talk.
   */
  private messageForMira(): string {
    return (
      event('As you turn to go, the great head lowers.') +
      '\n\n' +
      speech(
        'And the healer who waits at the cavern mouth. Little Mira. Tell ' +
          'her she has grown old.',
      ) +
      '\n\n'
    )
  }

  /**
   * Provide the Dragon's Memory for the storytelling quest. The first talk
   * ends the memory with the refrain, the amulet's third glow, the dream
   * voice and the Dragon naming it; a save that heard the memory before the
   * voice existed hears the voice and the naming once on its next talk.
   */
  override talkTo(gameState: GameState): string {
    const name = this.name
    // Check if this is the first conversation
    let dialogue = ''
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
      dialogue =
        'The ' +
        characterName(name) +
        "'s voice resonates through " +
        'your mind like distant thunder:\n\n' +
        speech(
          'Young one, I remember your parents well. Aren and Lysa, ' +
            'Wardens of the Dawn. They came to me with their friend ' +
            'Malakar, the three of them laughing, and made the relics as equals.',
        ) +
        '\n\n' +
        speech(
          'When Malakar tore a wound in time, it was they who stood ' +
            'against him. They poured themselves into a ward. It hides you ' +
            'from his sight, and it holds his wound shut. It is anchored in ' +
            'the amulet you carry, and in the bindings of your king. That ' +
            'is why Malakar drains him.',
        ) +
        '\n\n' +
        speech(
          'They are not gone as the dead are gone, child. They are ' +
            'warded away, not dead.',
        ) +
        '\n\n' +
        speech(
          'They had a saying, the three of them, carved wherever they ' +
            'worked: Power follows purpose; purpose follows truth.',
        ) +
        AncientAmulet.glowInBag(gameState, 3) +
        '\n\n'
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGON_VOICE_HEARD)) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_VOICE_HEARD, true)
      dialogue = dialogue + this.voiceMoment()
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN)) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN, true)
      dialogue = dialogue + this.messageForMira()
    }
    return (
      dialogue +
      'The ' +
      characterName(name) +
      ' rumbles softly: ' +
      speech(this.closingLine(gameState))
    )
  }

  /**
   * The line that ends every talk: the scale awaits (or, once the scrolls
   * are read, the question), the accepted oath until the scale is taken, then
   * the price of its going, then (once the sigils are mended) that the
   * prison holds.
   */
  private closingLine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_SIGILS_MENDED)) {
      return "'Go with my blessing, young one. The prison holds.'"
    }
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
      return (
        "'Go with my blessing. The prison I hold is weaker for the scale's " +
        "going. That is the price, and it is mine to pay, not yours.'"
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)) {
      return OATH_ACCEPTED_LINE
    }
    if (gameState.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)) {
      return (
        "'You have read the old words. Then tell me: " + OATH_QUESTION + "'"
      )
    }
    return (
      "'The memory has been shared. Your path leads forward now, not " +
      'back. The scale awaits when you are ready to prove your ' +
      "selflessness.'"
    )
  }

  /**
   * Handle saying something to the dragon. Only an answer that fills the
   * blank of the old oath wins the scale, and only once the memory is heard
   * and the scrolls are read.
   */
  override sayTo(gameState: GameState, words: string): string {
    const name = characterName(this.name)
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)) {
      return (
        `The ${name} rumbles: ` +
        speech("'Words come after memory, young one. Sit, and hear me first.'")
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)) {
      return (
        `The ${name}’s golden eyes narrow. ` +
        speech(
          "'An oath is not something you make up, child. The old words " +
            'are kept in the Echo Chambers. Read them, then come back.' +
            "'",
        )
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)) {
      return `The ${name} rumbles: ` + speech(OATH_ACCEPTED_LINE)
    }
    const answer = normaliseAnswer(words)
    const word = GIVING_WORDS.get(oathBlank(answer))
    if (word !== undefined) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN, true)
      gameState.currentRoom.addItem(new DragonsScale())
      return (
        event(
          `You speak the old words to the ${name}: ` +
            `“I take what is given, and I return ${word}.”`,
        ) +
        '\n' +
        '[success]' +
        speech(
          "'Your words ring true, young one. The scale is yours to bear. " +
            "May you carry its burden with honor.'",
        ) +
        '[/success]'
      )
    }
    if (TAKING_ANSWERS.includes(answer)) {
      return `The ${name} rumbles: ` + speech("'Then you would be taking.'")
    }
    return (
      `The ${name} rumbles: ` +
      speech("'That is no answer, young one. W" + OATH_QUESTION.slice(1) + "'")
    )
  }
}

/** The question the dragon asks once the scrolls are read. */
const OATH_QUESTION = 'what will you give back, for what you take?'

/** The line for the gap between the accepted oath and taking the scale. */
const OATH_ACCEPTED_LINE =
  "'The oath has been given and accepted. The scale is yours to claim.'"

/** The words that fill the blank, normalised, with how the echo spells them. */
const GIVING_WORDS: ReadonlyMap<string, string> = new Map([
  ['everything', 'everything'],
  ['it', 'it'],
  ['myself', 'myself'],
  ['what i take', 'what I take'],
])

/** Answers that name a payment rather than a giving back. */
const TAKING_ANSWERS: readonly string[] = [
  'gold',
  'silver',
  'coin',
  'coins',
  'money',
  'nothing',
  'thanks',
  'thank you',
]

/**
 * Lower-case an answer, drop commas, collapse spaces and strip one final
 * "." or "!".
 */
function normaliseAnswer(words: string): string {
  return words
    .toLowerCase()
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!]$/, '')
    .trim()
}

/**
 * The part of a normalised answer that fills the blank: the whole answer, or
 * what follows "i return" or "i take what is given and i return".
 */
function oathBlank(answer: string): string {
  for (const prefix of ['i take what is given and i return ', 'i return ']) {
    if (answer.startsWith(prefix)) return answer.slice(prefix.length)
  }
  return answer
}
