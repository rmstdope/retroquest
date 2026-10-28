import {
  Character,
  type GameState,
  characterName,
  remembered,
  normaliseSpokenWord,
  type NameOptions,
} from '@/engine'
import {
  FLAG_ACT3_PHANTOMS_FREED,
  FLAG_ACT3_PHANTOMS_HEARD,
  FLAG_ACT3_SHELL_HEARD,
  VIRTUE_MERCY,
} from '../Act3StoryFlags'

/** The one clear word under every whisper. */
const REST_LINE =
  '\nThrough the murmur, one word comes clear, over and over: ' +
  '[italic]rest … rest …[/italic]'

/** The tune the phantoms hum under their whispers. */
const HUMMING_LINE =
  '\n\nBeneath the whispers, a few of them are humming: a slow tune that ' +
  'climbs three notes and settles home again.'

/** Added to the humming once Elior has heard the shell. */
const SHELL_SENTENCE = ' It is the tune from the shell.'

/**
 * Restless spirits that whisper in the Stillness Vestibule. Every whisper
 * ends on the clear word "rest"; saying it frees them, an optional mercy.
 */
export class WanderingPhantoms extends Character {
  /** Named by what they are, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /** Several of them, so the default replies take plural verbs. */
  override isPlural(): boolean {
    return true
  }

  constructor() {
    super({
      name: 'wandering phantoms',
      description:
        'Grey figures, thin as breath on glass, move among the pools. Each ' +
        'does one thing over and over: lifts a hand, turns, reaches for a ' +
        'door that is not there. They whisper all the time.',
    })
  }

  /**
   * Phantoms whisper undecipherably, hum the tune (naming the shell if it
   * was heard) and then say the clear word "rest". Hearing them is recorded.
   */
  override talkTo(gameState: GameState): string {
    const phantoms = characterName('phantoms')
    const whispers = [
      `The ${phantoms} turn toward you all at once. Their whispers run ` +
        'together, too many voices to pick one out.',

      `One of the ${phantoms} stops in front of you and says something ` +
        'very fast, the same few words three times over. You do not catch ' +
        'them. It moves on and starts again.',

      `The ${phantoms} drift closer. Their mouths move a moment behind ` +
        'their whispers, like an echo running the wrong way.',

      `One of the ${phantoms} reaches for a door that is not there, opens ` +
        'it, and reaches for it again. The others whisper on around it.',
    ]

    gameState.setStoryFlag(FLAG_ACT3_PHANTOMS_HEARD, true)
    const humming = gameState.getStoryFlag(FLAG_ACT3_SHELL_HEARD)
      ? HUMMING_LINE + SHELL_SENTENCE
      : HUMMING_LINE
    return (
      whispers[Math.floor(Math.random() * whispers.length)] +
      humming +
      REST_LINE
    )
  }

  /**
   * Saying "rest" frees them: the event, their fading and the remembered
   * line, recorded once; they leave the room. Other words are not answered.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (normaliseSpokenWord(words) !== 'rest') {
      return (
        `The whispers of the ${characterName('phantoms')} rise and fall, ` +
        'and do not answer that.'
      )
    }
    gameState.setStoryFlag(FLAG_ACT3_PHANTOMS_FREED, true)
    gameState.addVirtue(VIRTUE_MERCY)
    const room = gameState.currentRoom
    room.characters = room.characters.filter((c) => c !== this)
    return (
      'The whispering falters. One by one the figures turn toward you, and ' +
      'the hurry goes out of them. They thin until you can see the far wall ' +
      'through them, and then they are gone. The chamber is quieter for it, ' +
      'but not yet still.\n' +
      remembered('Mercy')
    )
  }
}
