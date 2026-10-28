import {
  Character,
  type GameState,
  characterName,
  speech,
  type NameOptions,
  nameInSentence as nameReading,
} from '@/engine'
import {
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
  FLAG_ACT4_SERVANTS_FREED,
} from '../Act4StoryFlags'

/** What the servants are called once their chains are broken. */
const FREED_SERVANTS_NAME = 'Freed Servants'

/** The king's servants, chained in the Outer Courtyard until a blessing frees them. */
export class TrappedServants extends Character {
  /**
   * Named by what they are, so it reads "the …" and, a group and not a title,
   * stays lower case mid-sentence (see `nameInSentence`).
   */
  override nameInSentence(options?: NameOptions): string {
    return nameReading('character', this.name.toLowerCase(), {
      ...options,
      common: true,
    })
  }

  /** Several of them, so the default replies take plural verbs. */
  override isPlural(): boolean {
    return true
  }

  constructor() {
    super({
      name: 'Trapped Servants',
      description:
        'Grey figures walk the courtyard paths in circles, chains of shadow ' +
        'at their ankles. They wear what is left of kitchen aprons and stable ' +
        'coats. None of them looks up.',
    })
  }

  /** Also answers to "servants", whatever their name is now. */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['servants', 'trapped servants', 'freed servants'].includes(
        name.toLowerCase(),
      )
    )
  }

  /** The servants are freed: they stay in the courtyard under a new name. */
  free(): void {
    this.name = FREED_SERVANTS_NAME
  }

  /** In chains while trapped; once freed, at rest by the fountains. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return this.description
    }
    return (
      'The freed servants sit by the fountains in their kitchen aprons and ' +
      'stable coats, rubbing their ankles where the chains were.'
    )
  }

  /** Return the servants' plea, which changes as their trust and freedom are won. */
  override talkTo(gameState: GameState): string {
    const name = characterName(this.name)
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
      return (
        `The ${name} watch you from the corners of their eyes and keep ` +
        'walking. One whispers, without stopping: ' +
        speech(
          'Others came through that gate. They were all brave, until the ' +
            'guardians. If you were braver than the guardians, you would ' +
            'carry something of theirs.',
        )
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return (
        `The ${name} have stopped walking. They stand close together, ` +
        'watching you. ' +
        speech(
          'We are so tired. No one has said a kind word over us in years. ' +
            'Whatever you can do for us, do it gently.',
        )
      )
    }
    return (
      `The ${name} bow. One of them, an old woman with flour still in the ` +
      'creases of her hands, looks up. ' +
      speech("I was the king's cook. I do not know how long ago.")
    )
  }
}
