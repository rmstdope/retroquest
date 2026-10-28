import {
  Character,
  type GameState,
  characterName,
  dialogue,
  speech,
  normaliseSpokenWord,
  saysAnyOf,
  type NameOptions,
} from '@/engine'
import { CEDRIC_NAME, cedricAdds, cedricSays } from '../CedricLines'
import { FLAG_ACT3_VOW_OF_COURAGE_MADE } from '../Act3StoryFlags'

/** How many steps into the black water the trial takes. */
export const TRIAL_STEPS = 3

/**
 * The Guardian's refusals of the near-miss answers, each with the words that
 * earn it (matched as whole words, first match wins). The last is the answer
 * in the wrong form, so it gets a nudge towards the vow.
 */
const NEAR_MISSES: readonly { words: readonly string[]; reply: string }[] = [
  {
    words: ['mira'],
    reply: 'Mira was not in the water with you. Her voice was. Who walked?',
  },
  {
    words: ['cedric', 'knight'],
    reply:
      'The knight stayed at the door. You could not see him. ' +
      'Who did you still have?',
  },
  {
    words: ['friends', 'friend'],
    reply:
      'Your friends were behind you, in the light. ' +
      'Who was with you in the dark?',
  },
  {
    words: ['king'],
    reply: 'The king is the reason you came. He is not who came through.',
  },
  {
    words: ['parents', 'mother', 'father'],
    reply: 'They did not walk this water with you. Who did?',
  },
  {
    words: ['me', 'elior', 'i did'],
    reply: 'Nearly. Say it the way you would swear it.',
  },
]

/** The crystal as the player sees it named: an item in the room. */
const CRYSTAL = '[item_name]crystal of light[/item_name]'

/**
 * The Tide-Born Guardian: a shape of standing water with ward-sigils in it.
 *
 * It keeps the trial of courage: where Elior stands in the dark water
 * (`trialStep`, 0 at the edge up to the third step) and whether the darkness
 * has fallen before (`trialBegun`). The Sanctum of the Tide drives the walk;
 * the Guardian owns the lines and what it accepts as the vow.
 */
export class TideBornGuardian extends Character {
  /**
   * Steps taken into the water; undefined only in saves made before the
   * trial existed, which read as the edge.
   */
  trialStep: number | undefined = 0
  /** True once the lights have gone out for Elior; undefined in old saves. */
  trialBegun: boolean | undefined = false

  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'Tide-Born Guardian',
      description:
        'A shape of standing water the height of a man. Ward-sigils drift ' +
        'in it like weed in a current.',
    })
  }

  /** The steps taken into the water; 0 is the edge. */
  step(): number {
    return this.trialStep ?? 0
  }

  /**
   * The text played when Elior walks into the Sanctum: the darkness on the
   * first arrival, the short return line on later ones before the vow, and
   * nothing once the vow is made. Always puts him at the edge.
   */
  enterLine(gameState: GameState): string {
    this.trialStep = 0
    if (gameState.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)) return ''
    if (this.trialBegun ?? false) {
      return (
        'The lights go out again as you cross the threshold.' +
        '\n' +
        dialogue(this.name, 'Walk.')
      )
    }
    this.trialBegun = true
    return (
      'Then every light goes out at once — the sigils, the motes, the ' +
      'glow at your back. The ' +
      characterName(this.name) +
      ' speaks from the black: ' +
      speech(
        'The lanterns brought you here. They will not take you further. ' +
          'Walk.',
      )
    )
  }

  /** The Guardian turns to Sir Cedric, who answers; the water does not. */
  private turnsToCedric(): string {
    return (
      `The ${characterName(this.name)} turns its rippling face to ` +
      `${characterName(CEDRIC_NAME)}.` +
      '\n' +
      dialogue(this.name, 'Name what you will not abandon.') +
      '\n' +
      cedricSays('My king.') +
      ' ' +
      'A breath.' +
      ' ' +
      speech('I did once.') +
      '\n' +
      'The water does not answer him.'
    )
  }

  /** The line `look` gives for the current position in the dark. */
  lookLine(_gameState: GameState): string {
    switch (this.step()) {
      case 0:
        return (
          'You stand at the edge of the black water. Somewhere ahead, the ' +
          `${characterName(this.name)} waits.`
        )
      case 1:
        return 'Black water to your knees. You cannot see your own hands.'
      case 2:
        return 'Black water to your waist. You cannot see your own hands.'
      default:
        return (
          `The water stands parted around you. The ${CRYSTAL} burns ` +
          'in its basin, the only light in the world.'
        )
    }
  }

  /**
   * Take one step east into the water and return its line. On the third step
   * the water parts and the Guardian asks its question; a further `east`
   * only shows where Elior stands.
   */
  walkEast(gameState: GameState): string {
    const step = this.step()
    if (step >= TRIAL_STEPS) return this.lookLine(gameState)
    this.trialStep = step + 1
    switch (step + 1) {
      case 1:
        return (
          'You step down into the black water. It is cold to the knees, ' +
          'and you cannot see your own hands.'
        )
      case 2:
        return (
          'The water climbs to your waist. Then a voice like ' +
          characterName('Mira') +
          "'s, close behind you: " +
          speech('Turn back, Elior. There is nothing out there.')
        )
      default:
        return (
          'The water is at your chest. You call for ' +
          `${characterName(CEDRIC_NAME)}. Nothing comes back. ` +
          'You take the step anyway.' +
          '\n' +
          ('The water parts around you. In the hollow it leaves, the ' +
            `${CRYSTAL} burns in its basin, the only light in the ` +
            'world.') +
          '\n' +
          dialogue(this.name, 'You came through. What did you not abandon?')
        )
    }
  }

  /** The Guardian's answer to a light spell cast in the dark. */
  refuseLight(): string {
    return dialogue(this.name, 'Not here. Here you go without it.')
  }

  /** Wade back to the edge from wherever Elior stands. */
  turnBack(): string {
    this.trialStep = 0
    return (
      'You wade back to the edge of the basin. The water closes behind you ' +
      'without a sound.'
    )
  }

  /**
   * Talking to the Guardian: the Aren line once the vow is made, the question
   * again at the third step, otherwise the instruction to walk east.
   */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)) {
      return dialogue(
        this.name,
        'One came before you, long ago. Aren. He asked me to test whoever ' +
          'came after him the way he was tested.',
      )
    }
    if (this.step() >= TRIAL_STEPS) {
      return dialogue(this.name, 'You came through. What did you not abandon?')
    }
    return dialogue(
      this.name,
      'Walk east into the water. When you come through, I will ask you one ' +
        'thing.',
    )
  }

  /**
   * Answer what Elior says: before the third step it asks him to walk first;
   * at the third step "myself" is the vow, a near miss gets its own gentle
   * refusal and anything else the generic one.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (gameState.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)) {
      return this.talkTo(gameState)
    }
    if (this.step() < TRIAL_STEPS) {
      return dialogue(this.name, 'Words are easy on the shore. Walk first.')
    }
    const w = normaliseSpokenWord(words)
    if (w === 'myself') {
      gameState.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
      return (
        '[success]The water draws back from you, all the way to the walls. ' +
        'The [item_name]crystal of light[/item_name] sits loose in its ' +
        'basin.[/success]\n' +
        dialogue(
          this.name,
          'Most name a person, and leave themselves behind in the dark. ' +
            'You walked in whole, and you walked out whole.',
        ) +
        '\n' +
        ('One by one the sigils kindle again across the water, and the ' +
          'chamber is lit as you first saw it.') +
        cedricAdds(gameState, this.turnsToCedric())
      )
    }
    const nearMiss = NEAR_MISSES.find((miss) => saysAnyOf(words, miss.words))
    return dialogue(
      this.name,
      nearMiss?.reply ??
        'The tide listens, then falls quiet. That is not what you carried ' +
          'through the water.',
    )
  }
}
