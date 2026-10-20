import { Character, type GameState } from '@/engine'

/** Restless spirits that whisper incomprehensibly in the Stillness Vestibule. */
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

  /** Phantoms only respond with undecipherable whispers. */
  override talkTo(_gameState: GameState): string {
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

    return whispers[Math.floor(Math.random() * whispers.length)]
  }
}
