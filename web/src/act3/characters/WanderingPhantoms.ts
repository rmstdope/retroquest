import { Character, type GameState, remembered } from '@/engine'
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
  constructor() {
    super({
      name: 'wandering phantoms',
      description:
        'Translucent figures drift through the chamber like wisps of mist, their ' +
        'forms barely visible in the dim light. They move with purpose yet seem ' +
        'trapped in an endless cycle, their ethereal voices creating a constant ' +
        'murmur of unintelligible whispers that echo off the ancient stones.',
    })
  }

  /**
   * Phantoms whisper undecipherably, hum the tune (naming the shell if it
   * was heard) and then say the clear word "rest". Hearing them is recorded.
   */
  override talkTo(gameState: GameState): string {
    const whispers = [
      'The phantoms turn toward you, their voices rising in a chorus of whispered ' +
        'syllables that seem to flow like water over stone. The words are just beyond ' +
        'comprehension, as if spoken in a language forgotten by time.',

      'A low murmur ripples through the ghostly figures as they notice your presence. ' +
        'Their whispers grow more urgent, overlapping in harmonies that speak of longing ' +
        'and unfinished purpose, but no clear meaning emerges.',

      'The phantoms drift closer, their ethereal forms shimmering as they attempt to ' +
        'communicate. Their voices blend into a haunting melody of sibilant sounds and ' +
        'half-formed words that dance at the edge of understanding.',

      'Spectral lips move in silent prayer, then burst into urgent whispers that ' +
        'cascade around you like falling leaves. Each voice carries a different tone ' +
        'of desperation, yet none speak words you can fully grasp.',
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
    if (words.trim().toLowerCase() !== 'rest') {
      return "The phantoms' whispers rise and fall, and do not answer that."
    }
    gameState.setStoryFlag(FLAG_ACT3_PHANTOMS_FREED, true)
    gameState.addVirtue(VIRTUE_MERCY)
    const room = gameState.currentRoom
    room.characters = room.characters.filter((c) => c !== this)
    return (
      'The whispering falters. One by one the figures turn toward you, and ' +
      'the urgency drains out of them. They thin like mist in morning sun, ' +
      'and then they are gone. The chamber is quieter for it, but not yet ' +
      'still.\n' +
      remembered('Mercy')
    )
  }
}
