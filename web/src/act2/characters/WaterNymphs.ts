import {
  Character,
  type GameState,
  characterName,
  dialogue,
  clue,
  speech,
  type NameOptions,
} from '@/engine'
import { CrystalClearWater } from '../items/CrystalClearWater'
import { Moonflowers } from '../items/Moonflowers'
import { QUEST_FOREST_GUARDIANS_RIDDLES } from '../Act2StoryFlags'

/** The grey help line shown under every riddle. */
const RIDDLE_HELP =
  '[dim](Answer them with: say <your answer> to water nymphs.)[/dim]'

/**
 * One of the nymphs' riddles: the question, the accepted answers, what the
 * nymphs do when it is answered (given their marked name), the hint, and the
 * near misses that get a question of their own instead of the plain refusal.
 */
interface Riddle {
  question: string
  answers: string[]
  reaction: (nymphs: string) => string
  hint: string
  nearMisses: Record<string, string>
}

/** The near-miss reply for 'liar', and for 'lie' on the mask riddle. */
const LIAR_MISS =
  "A liar has eyes, hasn't he? And what does he hold up in front of them?"

/** The near-miss reply for 'lie' on the truth riddle. */
const LIE_MISS =
  "Does a lie grow heavier for being hidden? Isn't it glad of the dark?"

/** The near-miss reply for 'ice' and 'snow' on the water riddle. */
const SNOW_MISS =
  'Can snow carve stone in summer? And what is it, once it melts?'

/** The near-miss reply for 'secret' on the truth riddle. */
const SECRET_MISS =
  "A secret is only how a thing is kept, isn't it? What is the thing?"

/** The near-miss reply for 'face' on the mask riddle. */
const FACE_MISS = 'A face? Whose, then? Is it its own?'

/** The near-miss reply for 'mirror' on the mask riddle. */
const MIRROR_MISS = 'Can you put a mirror on? Would it hide you, or show you?'

/**
 * The nymphs' three riddles in the order they are asked: water, mask, truth.
 * The mask seeds the silver mark on Elena's wrist; the truth echoes the
 * refrain on the moss-covered stone. Kept out of the save so that saves
 * always meet the current riddles.
 */
export const RIDDLES: Riddle[] = [
  {
    question:
      "I am the forest's blood that flows without wound, the sky's gift " +
      'that falls without being thrown. I give life yet can take it, ' +
      'am soft yet can carve stone. What am I?',
    answers: ['water', 'the water', 'rain', 'stream', 'river'],
    reaction: (nymphs) =>
      `The stream runs a little faster round your boots. The ${nymphs} nod.`,
    hint:
      "What runs through us while we sit here? Haven't your boots been " +
      'wet since you came in?',
    nearMisses: {
      blood: 'Blood? Does the sky bleed, then, every time it rains?',
      ice: SNOW_MISS,
      snow: SNOW_MISS,
    },
  },
  {
    question:
      'I smile, yet I have no eyes. I have a face, yet it is not my own. ' +
      'Put me on and I hide you; leave me behind and I tell whose work it ' +
      'was. What am I?',
    answers: ['mask', 'masks', 'a mask', 'the mask', 'false face', 'disguise'],
    reaction: (nymphs) =>
      `For a moment every one of the ${nymphs} wears your face. Then they nod.`,
    hint:
      'What do the players at a fair hold up to their faces? Who smiles on ' +
      'the outside and weeps behind it?',
    nearMisses: {
      face: FACE_MISS,
      'a face': FACE_MISS,
      mirror: MIRROR_MISS,
      'a mirror': MIRROR_MISS,
      liar: LIAR_MISS,
      'a liar': LIAR_MISS,
      lie: LIAR_MISS,
    },
  },
  {
    question:
      'Purpose follows me, and power follows purpose. A lie may wear my ' +
      'coat, but it cannot keep it on. I am hard to say and harder to ' +
      'hear, and I grow no lighter for being hidden. What am I?',
    answers: ['truth', 'the truth', 'a truth', 'honesty', 'true'],
    reaction: (nymphs) =>
      `The ${nymphs} laugh, a sound like water over a weir.`,
    hint:
      'What did the old stone in your own woods say comes first, before ' +
      'purpose and before power?',
    nearMisses: {
      purpose: 'Purpose? But what does purpose follow?',
      power:
        "Power? Isn't power at the end of the line? What stands at the " +
        'start of it?',
      lie: LIE_MISS,
      lies: LIE_MISS,
      'a lie': LIE_MISS,
      secret: SECRET_MISS,
      'a secret': SECRET_MISS,
      secrets: SECRET_MISS,
    },
  },
]

/** Guardians of the Whispering Glade who test visitors with riddles, and who answer only with questions. */
export class WaterNymphs extends Character {
  riddlesCompleted = false
  currentRiddle = 0
  /** Wrong answers given to the current riddle; the hint shows from the second. */
  missCount = 0

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
      name: 'water nymphs',
      description:
        'Three of them, or four; it is hard to count water. They sit ' +
        'waist-deep in the stream, and the stream runs through them.',
    })
  }

  /** Convert a number to its ordinal word representation. */
  private getOrdinalWord(number: number): string {
    const ordinals = ['first', 'second', 'third', 'fourth', 'fifth']
    if (number >= 1 && number <= ordinals.length) {
      return ordinals[number - 1]
    }
    return String(number) // fallback for numbers beyond our list
  }

  /**
   * Present the current riddle, or ask what more they could want once all are
   * solved and add the nymphs' remark about the thinning streams (the blight).
   */
  override talkTo(_gameState: GameState): string {
    if (this.riddlesCompleted) {
      // After completing all riddles
      return (
        dialogue(
          this.name,
          "Back again? Wasn't three enough? What more could we ask you?",
        ) +
        '\n\n' +
        dialogue(
          this.name,
          'Have you seen the streams come down thinner from the hills this ' +
            'season? What drinks up there before we do, that the fields ' +
            'below the city taste it first?',
        )
      )
    } else if (this.currentRiddle < RIDDLES.length) {
      // Present the current riddle
      const riddle = RIDDLES[this.currentRiddle]
      const greeting =
        this.currentRiddle === 0
          ? 'The stream rises into shapes.\n' +
            dialogue(
              this.name,
              'Came all this way to stand in our water? Will you answer ' +
                'three questions, then? Shall we start?',
            )
          : dialogue(
              this.name,
              'Back so soon? Do you remember where we were? The ' +
                `${this.getOrdinalWord(this.currentRiddle + 1)} one, wasn't it?`,
            )
      return greeting + '\n\n' + speech(riddle.question) + '\n\n' + RIDDLE_HELP
    }
    // This shouldn't happen, but just in case
    return dialogue(
      this.name,
      "Back again? Wasn't three enough? What more could we ask you?",
    )
  }

  /** Process player speech for riddle answering (overrides base). */
  override sayTo(gameState: GameState, words: string): string {
    if (this.riddlesCompleted) {
      return (
        '[dim]The ' +
        characterName(this.name) +
        ' listen and only smile. They have no more riddles ' +
        'for you.[/dim]'
      )
    }

    if (this.currentRiddle >= RIDDLES.length) {
      return '[failure]There are no more riddles to answer.[/failure]'
    }

    const riddle = RIDDLES[this.currentRiddle]
    const wordLower = words.toLowerCase().trim()

    if (riddle.answers.includes(wordLower)) {
      // Correct answer
      this.missCount = 0
      this.currentRiddle += 1
      gameState.setStoryFlag(
        `water_nymph_riddle_${this.currentRiddle}_completed`,
        true,
      )

      if (this.currentRiddle >= RIDDLES.length) {
        this.riddlesCompleted = true
        gameState.getQuest(QUEST_FOREST_GUARDIANS_RIDDLES)?.complete(gameState)

        gameState.currentRoom.items.push(new CrystalClearWater())
        gameState.currentRoom.items.push(new Moonflowers())

        return (
          riddle.reaction(characterName(this.name)) +
          ' ' +
          speech(
            'Three for three — who taught you to listen like that? Will you ' +
              'take what grows here? Who else would we give it to?',
          ) +
          '\n\n' +
          'They draw back from the bank. The ' +
          '[item_name]crystal-clear water[/item_name] and the ' +
          '[item_name]moonflowers[/item_name] at its edge are there for ' +
          'the taking.'
        )
      }
      const nextRiddle = RIDDLES[this.currentRiddle]
      return (
        riddle.reaction(characterName(this.name)) +
        ' ' +
        speech(
          'Did you know it, or guess it? Does it matter? What about this ' +
            'one?',
        ) +
        '\n\n' +
        speech(`${nextRiddle.question}`)
      )
    }
    this.missCount = (this.missCount || 0) + 1
    const hint = this.missCount >= 2 ? '\n\n' + speech(`${riddle.hint}`) : ''
    return (
      clue('The ' + characterName(this.name) + ' shake their heads gently.') +
      ' ' +
      speech(
        Object.hasOwn(riddle.nearMisses, wordLower)
          ? riddle.nearMisses[wordLower]
          : 'Is that really what you think? Will you hear it again?',
      ) +
      '\n\n' +
      speech(riddle.question) +
      hint
    )
  }

  /** Describe the nymphs and what they do when you lean closer. */
  override examine(_gameState: GameState): string {
    return (
      `${this.description} When you lean closer, every one of them ` +
      'leans closer too.'
    )
  }
}
