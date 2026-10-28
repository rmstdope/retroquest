import {
  Character,
  type GameState,
  characterName,
  dialogue,
  speech,
  type NameOptions,
} from '@/engine'
import { EchoStones } from '../items/EchoStones'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_ECHO_HEARD,
  FLAG_ACT3_KEEPER_PHANTOM_LINE_TOLD,
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_PHANTOMS_FREED,
  FLAG_ACT3_POOLS_STILLED,
} from '../Act3StoryFlags'

const TROUBLED_WATER =
  'But a chant will not carry over troubled water, and these pools are not ' +
  'as still as they seem.'
const TRUE_WATER = 'The water lies true now; it will hold your words.'

const PHANTOMS_PRESENT =
  'The figures by the pools? They are not ghosts, not as the villages ' +
  'tell it. They are moments. Someone cut at time, years ago, and what ' +
  'came loose drifts down here, saying the same thing over. Tell them to ' +
  'rest; most of them only want leave to stop.'
const PHANTOMS_GONE =
  'The figures by the pools are gone, then. They were not ghosts, not as ' +
  'the villages tell it. They were moments. Someone cut at time, years ' +
  'ago, and what came loose drifted down here, saying the same thing over. ' +
  'You gave them leave to stop.'

/** Keeper of the hush before the dragon's hall: a former singer who gave up their voice. */
export class SilenceKeeper extends Character {
  /** Whether the player has heard the Keeper's story; saves from before this field was added read it as false. */
  introduced = false

  /** Whether the player has talked to the Keeper before; saves from before this field was added read it as false. */
  talkedBefore = false

  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'silence keeper',
      description:
        "A tall figure in a deep hood stands at the water's edge. Their " +
        'feet make no sound on the stone, and you find you have lowered ' +
        'your voice.',
    })
  }

  /** The Keeper's remark on the pools: a warning until the Phial has stilled them, then that the water lies true. */
  private waterLine(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_ACT3_POOLS_STILLED)
      ? TRUE_WATER
      : TROUBLED_WATER
  }

  /** Whether the echo stones in the Stillness Vestibule have been blessed. */
  private stonesBlessed(gameState: GameState): boolean {
    return (
      gameState.allRooms.StillnessVestibule?.items.some(
        (item) => item instanceof EchoStones && item.areBlessed(),
      ) ?? false
    )
  }

  /**
   * Speak as a person: the usual reply, then, once the echo has been heard and
   * she has already been met, one line on what the phantoms are (told once;
   * past tense if they were freed).
   */
  override talkTo(gameState: GameState): string {
    const met = this.talkedBefore || this.introduced
    this.talkedBefore = true
    const reply = this.usualReply(gameState)
    if (
      !met ||
      !gameState.getStoryFlag(FLAG_ACT3_ECHO_HEARD) ||
      gameState.getStoryFlag(FLAG_ACT3_KEEPER_PHANTOM_LINE_TOLD)
    ) {
      return reply
    }
    gameState.setStoryFlag(FLAG_ACT3_KEEPER_PHANTOM_LINE_TOLD, true)
    const line = gameState.getStoryFlag(FLAG_ACT3_PHANTOMS_FREED)
      ? PHANTOMS_GONE
      : PHANTOMS_PRESENT
    return `${reply}\n\n${dialogue(this.name, line)}`
  }

  /**
   * The whole story and the hint on the first talk, a short reminder on later
   * talks (warm stones once blessed), a send-off once the Oath of Stillness has
   * opened the way, and a closing line once the sleeper has spoken (also on a
   * first talk after either).
   */
  private usualReply(gameState: GameState): string {
    const keeper = characterName('Silence Keeper')
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)) {
      return (
        `The ${keeper} bows their hooded head: ` +
        speech(
          'The sleeper spoke with you, and the stone held. Forty years, ' +
            'and I have never been so glad to have kept a quiet.',
        )
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)) {
      return (
        `The ${keeper} bows their hooded head: ` +
        speech(
          'The stones held. The way is open, and the sleeper knows you are ' +
            'coming. Go quietly.',
        )
      )
    }
    if (this.introduced) {
      const stones = this.stonesBlessed(gameState)
        ? 'They are warm again. Give them the chant.'
        : 'They are cold. Bless the stones; give them the chant.'
      return (
        `The ${keeper} does not turn: ` +
        speech(
          `Forty years I have listened to those stones. ${stones} ` +
            this.waterLine(gameState),
        )
      )
    }
    this.introduced = true
    return (
      `The ${keeper} whispers: ` +
      speech(
        'I have kept this hush for forty years, so the sleeper below can ' +
          'rest. I was a singer once, in the villages above. I sang one ' +
          'night too loud, too near the deep, and something old turned over ' +
          'in its sleep. I put my voice down that night and never picked it ' +
          'up.',
      ) +
      '\n\n' +
      speech(
        'The stones in this room were cut to carry a whisper to the ' +
          'sleeper without waking it. They have gone cold. Bless them, and ' +
          'give them the old chant from the walls of the Echo Chambers, and ' +
          `the way will open. ${this.waterLine(gameState)}`,
      )
    )
  }
}
