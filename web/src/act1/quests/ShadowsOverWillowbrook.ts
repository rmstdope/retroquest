import { characterName, Quest, type GameState } from '@/engine'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_MERCHANT_NEWS_HEARD,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
  FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED,
  FLAG_STRANGER_SEEN_AT_MILL,
  FLAG_VEGETABLE_FIELD_WATERED,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
  FLAG_WOKE_FROM_DREAM,
} from '../Act1StoryFlags'

/**
 * Main Act I quest tracking the unfolding village corruption mystery.
 *
 * Rebuilds `description` on update, dimming prior segments and highlighting
 * the newest narrative beat. Uses an internal `flagState` record to avoid
 * repeating the same revelation more than once.
 */
export class ShadowsOverWillowbrookQuest extends Quest {
  private flagState: Record<string, boolean> = {}

  constructor() {
    super({
      name: 'Shadows Over Willowbrook',
      description:
        'Something is wrong in Willowbrook. The crops are failing, the well ' +
        'smells sour, and the village keeps its voice down.',
      completion:
        'The well was poisoned on purpose, and whoever did it came to ' +
        `Willowbrook looking for an amulet. ${characterName('Elior')} carries ` +
        'that amulet now, on the road to Greendale.',
    })
  }

  /** Given when Elior wakes from the dream in his cottage. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_WOKE_FROM_DREAM)
  }

  /** Record a flag the first time it is seen; true when it was new. */
  private noteFlag(flag: string): boolean {
    if (this.flagState[flag]) return false
    this.flagState[flag] = true
    return true
  }

  /**
   * Rebuild the journal: the dream first, then every beat whose flag is
   * set, in the order the flags were first noticed (`flagState` keeps its
   * insertion order, in saves too), so the newest beat is always the latest.
   */
  override checkUpdate(gameState: GameState): boolean {
    const dream =
      `${characterName('Elior')} dreamed of a storm, a tune, and a figure in ` +
      'the dark that whispered his name. He woke with three words written ' +
      'down: …and let them rest…'
    const beats: [string, string][] = [
      [
        FLAG_INVESTIGATED_WITHERED_CROPS,
        'The [room_name]Vegetable Field[/room_name] has withered under a grey ' +
          'sky: brittle leaves, cracked earth, and only a few stubborn carrots ' +
          'left.',
      ],
      [
        FLAG_VILLAGER_TALKED_TO,
        `In the square, ${characterName('Tilda')} has more rumours than bread, ` +
          'and the people around her keep their voices down.',
      ],
      [
        FLAG_WELL_EXAMINED,
        'The village well smells sour, and far down in the dark water ' +
          'something glints.',
      ],
      [
        FLAG_CONNECT_WITH_NATURE,
        `${characterName('Mira')} says the sickness in the fields and the ` +
          'sickness of the king feel like one wound. She wants a rare flower ' +
          'from the Hidden Glade, one that opens only for someone the land ' +
          'trusts.',
      ],
      [
        FLAG_MAGIC_FULLY_UNLOCKED,
        `The flower opened for ${characterName('Elior')}. ` +
          `${characterName('Mira')} showed him how to mend, how to open and ` +
          'how to make a light, and promised him the ' +
          '[item_name]ancient amulet[/item_name] once he is ready for the road.',
      ],
      [
        FLAG_FOUND_RUNE_TOKEN,
        `Fishing the ring from the purified well, ${characterName('Elior')} ` +
          'drew up something else: a [item_name]rune token[/item_name] of black ' +
          'iron, scored with a twisted rune and colder than the water. ' +
          'The well did not sour by itself.',
      ],
      [
        FLAG_STRANGER_SEEN_AT_MILL,
        'At the [room_name]Old Mill[/room_name] a man in a grey cloak stood at ' +
          `the far door with his back to ${characterName('Elior')}. He left ` +
          'toward the river without turning.',
      ],
      [
        FLAG_VEGETABLE_FIELD_WATERED,
        `With clean water from the well, ${characterName('Elior')} brought ` +
          'the [room_name]Vegetable Field[/room_name] back to life. ' +
          'Where the blight is lifted, the land remembers how to grow.',
      ],
      [
        FLAG_MIRA_NAMED_FOULING_SIGIL,
        `${characterName('Mira')} named the token a fouling sigil: someone ` +
          'poisoned the well on purpose. Whoever carried it, perhaps the cloaked ' +
          'stranger the villagers whisper about, was searching Willowbrook for ' +
          'something, or for someone.',
      ],
      [
        FLAG_MERCHANT_NEWS_HEARD,
        `On the road to Greendale, the ${characterName('merchant')} brought ` +
          'grim news from the capital: King Alden lies ill, and no physician ' +
          'can name his sickness. The roads have turned dangerous, and crops ' +
          'are failing in every valley between. Whatever troubles Willowbrook ' +
          'may be part of something larger.',
      ],
    ]
    let updated = false
    const shown = beats.filter(([flag]) => gameState.getStoryFlag(flag))
    for (const [flag] of shown) if (this.noteFlag(flag)) updated = true
    const noticed = Object.keys(this.flagState)
    shown.sort(([a], [b]) => noticed.indexOf(a) - noticed.indexOf(b))
    const stages = [dream, ...shown.map(([, text]) => `\n${text}`)]
    this.setJournal(stages.slice(0, -1), stages[stages.length - 1])
    return updated
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED)
  }

  override isMain(): boolean {
    return true
  }
}
