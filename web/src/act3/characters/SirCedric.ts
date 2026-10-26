import {
  Character,
  type GameState,
  characterName,
  normaliseSpokenWord,
} from '@/engine'
import {
  CEDRIC_GATE_TALK,
  CEDRIC_NAME,
  CEDRIC_NOT_NOW,
  cedricDoes,
  cedricSays,
} from '../CedricLines'
import {
  FLAG_ACT3_CEDRIC_GATE_ANSWERED,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
} from '../Act3StoryFlags'

/** The refrain as Elior speaks it at the gate. */
const REFRAIN = 'Power follows purpose; purpose follows truth.'

/** The words of the carved refrain, lower-cased, as Elior may answer him. */
const REFRAIN_LINE = REFRAIN.slice(0, -1).toLowerCase()

/** Rooms of the Sunken Ruins other than the Sanctum, by room key. */
const RUINS_ROOMS = [
  'TidalCauseway',
  'ShorelineMarkers',
  'OuterWards',
  'CollapsedPier',
  'SubmergedAntechamber',
]

/** Rooms of Mount Ember, by room key. */
const EMBER_ROOMS = [
  'LowerSwitchbacks',
  'ObsidianOutcrops',
  'MirrorTerraces',
  'FumarolePassages',
  'EmberGallery',
  'PhoenixCrater',
]

/** Rooms of the Caverns of Shadow, by room key. */
const CAVERN_ROOMS = [
  'CavernMouth',
  'ToolCache',
  'CollapsedGalleries',
  'EchoChambers',
  'StillnessVestibule',
  'DragonsHall',
]

/** A steadfast knight who aids the player in their quest against Malakar. */
export class SirCedric extends Character {
  constructor() {
    super({
      name: CEDRIC_NAME,
      description:
        'Armor tempered, eyes steady—Cedric stands ready for the trials. ' +
        'His presence is a quiet promise.',
    })
  }

  /** He answers to "sir cedric" and to "cedric", however it is cased. */
  override answersTo(name: string): boolean {
    const wanted = name.trim().toLowerCase()
    return wanted === 'sir cedric' || wanted === 'cedric'
  }

  /**
   * Say the one line that fits where the party stands and how far its quest
   * has come: the site (Ruins, Mount Ember, Caverns, the hut, the fortress)
   * and the stage of that site's quest. Before the main quest starts he only
   * sends the player to Mira.
   */
  override talkTo(gameState: GameState): string {
    return this.line(gameState)
  }

  /** The line for the current site and stage. */
  private line(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_MAIN_STARTED)) {
      return cedricSays(
        "If we're to take the fight to Malakar, speak with " +
          characterName('Mira') +
          '. She understands the rites and the way to begin.',
      )
    }
    const key = this.roomKey(gameState)
    const vowMade = gameState.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)
    if (key === 'FortressEntrance') {
      return gameState.getStoryFlag(FLAG_ACT3_CEDRIC_GATE_ANSWERED)
        ? cedricSays(
            'Ready when you are. The gates will not open by looking at them, ' +
              'but look anyway.',
          )
        : CEDRIC_GATE_TALK
    }
    if (key === 'SanctumOfTheTide') {
      return vowMade ? this.afterVow() : this.sanctum()
    }
    if (RUINS_ROOMS.includes(key)) {
      return vowMade
        ? this.afterVow()
        : cedricSays(
            'Salt and old stone. Give me a wall to hold and I would know ' +
              'what to do. Here I just follow you.',
          )
    }
    if (EMBER_ROOMS.includes(key)) {
      return gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)
        ? cedricSays(
            'A bird told us to wait, and we waited. I hope it was worth ' +
              'what it cost him.',
          )
        : cedricSays(
            'We stand about reading vents while he fades. Let me go through ' +
              'that heat first and see what it does.',
          )
    }
    if (CAVERN_ROOMS.includes(key)) {
      return gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)
        ? cedricSays(
            'They are out. The old man was right. I have a king to fetch.',
          )
        : cedricSays(
            'People under the rock. That I understand. Point me at the ' +
              'heavy end.',
          )
    }
    return this.atTheHut(gameState)
  }

  /** The Sanctum before the vow. */
  private sanctum(): string {
    return cedricSays(
      'Water I cannot fight. I will keep the door, then. Better than I ' +
        'kept the last one.',
    )
  }

  /** Anywhere in the Ruins once the vow is made. */
  private afterVow(): string {
    return cedricSays(
      'It asked me, too. You heard my answer. So did the water, and it ' +
        'said nothing.',
    )
  }

  /** In Mira's Hut: before the first circle, with the relics, after the elixir. */
  private atTheHut(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)) {
      return cedricSays(
        'Then it is the fortress. I have been walking toward that door ' +
          'since the night he was taken.',
      )
    }
    const relicsGathered =
      gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED) &&
      gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED) &&
      gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)
    if (relicsGathered) {
      return cedricSays(
        'Do what she needs, Elior. I have waited this long. I can wait one ' +
          'more hour.',
      )
    }
    return cedricSays(
      'Mira knows the way. I know how to stand in front of you. Between ' +
        'us, that will have to do.',
    )
  }

  /** The key of the room the party is in, or '' if it is not in the act. */
  private roomKey(gameState: GameState): string {
    return (
      Object.keys(gameState.allRooms).find(
        (key) => gameState.allRooms[key] === gameState.currentRoom,
      ) ?? ''
    )
  }

  /**
   * At the fortress gates Elior may answer him with the refrain, by its name
   * or in full. Any other words, or the refrain anywhere else, get a gentle
   * "Not now. Not here."; once answered he only says he is ready.
   */
  override sayTo(gameState: GameState, words: string): string {
    const said = normaliseSpokenWord(words)
    const isRefrain = said === 'refrain' || said === REFRAIN_LINE
    const atGate = this.roomKey(gameState) === 'FortressEntrance'
    if (atGate && gameState.getStoryFlag(FLAG_ACT3_CEDRIC_GATE_ANSWERED)) {
      return this.line(gameState)
    }
    if (!isRefrain || !atGate) return CEDRIC_NOT_NOW
    gameState.setStoryFlag(FLAG_ACT3_CEDRIC_GATE_ANSWERED, true)
    return (
      `You: “${REFRAIN}”` +
      '\n' +
      cedricDoes(
        'is quiet a long moment. Then he nods, once, and loosens his sword ' +
          'in its sheath.',
      ) +
      '\n' +
      cedricSays(
        'Truth, then. The truth is I was on the wall. The truth is he is ' +
          'still alive. Let us go and get him.',
      )
    )
  }
}
