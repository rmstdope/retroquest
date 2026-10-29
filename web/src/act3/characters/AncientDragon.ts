import {
  Character,
  type GameState,
  characterName,
  dialogue,
  speech,
  normaliseSpokenWord,
  type NameOptions,
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
  FLAG_ACT3_PHANTOMS_HEARD,
  FLAG_ACT3_SHELL_HEARD,
  FLAG_ACT3_SIGILS_MENDED,
} from '../Act3StoryFlags'

/** The ancient dragon who guards the Dragon's Scale and holds memories. */
export class AncientDragon extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'ancient dragon',
      description:
        "A dragon lies coiled around the hall's centre. The scales along " +
        'its flank are worn dull where they have pressed the floor for a very ' +
        'long time. Its golden eyes open slowly, and close slower.',
    })
  }

  /**
   * The dream voice and the Dragon naming it: narration with the whispered
   * words spoken by 'voice' through `dialogue()`, as in Act I, the Dragon's
   * one line and the closing event. Heard once; the caller guards it with the voice flag.
   * Elior recognises the tune from the shell, or else from the phantoms,
   * only if he heard it.
   */
  private voiceMoment(gameState: GameState): string {
    return (
      "Then, beneath the dragon's breathing, another voice: the whisper " +
      'from your dream, at the very edge of hearing.\n' +
      dialogue(
        'voice',
        'Elior… little one. Help me. I cannot hold it shut alone.',
      ) +
      "\n\nAnd after it, almost lost in the dragon's breathing:\n" +
      dialogue('voice', '…be patient where I was not…') +
      '\n\nYou know it the way you know a song someone sang ' +
      'to you before you had words for it.' +
      this.tuneRecognition(gameState) +
      ' Then it is gone.\n\n' +
      'You look up at the ' +
      characterName(this.name) +
      '. Its golden eyes are half closed.\n\n' +
      speech('The friend who stayed behind.') +
      '\n\n' +
      'It says no more.' +
      '\n\n'
    )
  }

  /**
   * The sentence in which Elior recognises the tune: the shell's if heard,
   * else the phantoms'; empty when he heard neither.
   */
  private tuneRecognition(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_SHELL_HEARD)) {
      return (
        ' And under the words, faint as the sea in a shell, runs the tune ' +
        'the woman hummed.'
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_PHANTOMS_HEARD)) {
      return ' And under the words runs the tune the phantoms hummed.'
    }
    return ''
  }

  /**
   * The dragon's message for the healer who waits at the Cavern Mouth,
   * given once, after the voice and before the closing rumble. Mira passes
   * it on at her next talk.
   */
  private messageForMira(): string {
    return (
      'As you turn to go, the great head lowers.' +
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
    let text = ''
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
      text =
        'The ' +
        characterName(name) +
        ' opens one golden eye. Its voice is slow, and very low:\n\n' +
        speech(
          'Young one, I remember your parents. Aren and Lysa, Wardens of ' +
            'the Dawn. They came down here with their friend Malakar for a ' +
            'scale, the three of them laughing. They were making the relics ' +
            'together, as equals.',
        ) +
        '\n\n' +
        speech(
          'When Malakar tore a wound in time, it was they who stood ' +
            'against him. They poured themselves into a ward. It hides you ' +
            'from his sight, and it holds his wound shut. It is anchored in ' +
            'the amulet you carry, and in the bindings of your king, who was ' +
            "their friend and gave his crown's oath to hold it. That " +
            'is why Malakar drains him.',
        ) +
        '\n\n' +
        `The ${characterName(name)} is quiet for a long breath.\n\n` +
        speech('They are warded away, not dead, child.') +
        '\n\n' +
        speech(
          'They had a saying, the three of them, carved wherever they ' +
            'worked: Power follows purpose; purpose follows truth. When he ' +
            'offers you what you want most, say it to him. It was his ' +
            'before it was yours.',
        ) +
        AncientAmulet.glowInBag(gameState, 3) +
        '\n\n'
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGON_VOICE_HEARD)) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_VOICE_HEARD, true)
      text = text + this.voiceMoment(gameState)
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN)) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN, true)
      text = text + this.messageForMira()
    }
    return (
      text +
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
      return 'Go with my blessing, young one. The prison holds.'
    }
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
      return (
        "Go with my blessing. The prison I hold is weaker for the scale's " +
        'going. That is the price, and it is mine to pay, not yours.'
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)) {
      return OATH_ACCEPTED_LINE
    }
    if (gameState.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)) {
      return 'You have read the old words. Then tell me: ' + OATH_QUESTION
    }
    return (
      'The memory has been shared. The scale awaits, but it is not given ' +
      'for the asking. There is an old oath for it. The words are kept in ' +
      'the Echo Chambers.'
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
        speech('Words come after memory, young one. Sit, and hear me first.')
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)) {
      return (
        `The ${name}’s golden eyes narrow. ` +
        speech(
          'An oath is not something you make up, child. The old words ' +
            'are kept in the Echo Chambers. Read them, then come back.',
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
        dialogue('Elior', `I take what is given, and I return ${word}.`) +
        '\n' +
        `The ${name} shifts one coil, and a single scale lies loose on the ` +
        'tiles. ' +
        speech('Your words ring true, young one. It is heavier than it looks.')
      )
    }
    if (TAKING_ANSWERS.includes(answer)) {
      return `The ${name} rumbles: ` + speech('Then you would be taking.')
    }
    return (
      `The ${name} rumbles: ` +
      speech('That is no answer, young one. W' + OATH_QUESTION.slice(1))
    )
  }
}

/** The question the dragon asks once the scrolls are read. */
const OATH_QUESTION = 'what will you give back, for what you take?'

/** The line for the gap between the accepted oath and taking the scale. */
const OATH_ACCEPTED_LINE =
  'You have said it. The scale is there, young one. Take it.'

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
 * Hear an answer as the engine does, after dropping its commas.
 */
function normaliseAnswer(words: string): string {
  return normaliseSpokenWord(words.replace(/,/g, ''))
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
