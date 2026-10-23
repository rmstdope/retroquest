import { characterName, Quest, type GameState } from '@/engine'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_MERCHANT_NEWS_HEARD,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
  FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED,
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
        'Strange events are plaguing the village: crops are withering, animals are ' +
        'restless, and villagers whisper of a shadowy figure seen at night. ' +
        'Investigate the source of these disturbances.',
      completion:
        `You have confirmed that a dark force is at work in Willowbrook. ${characterName('Mira')} ` +
        'warns you that your magical abilities may be the key to protecting ' +
        'the village.',
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
      `${characterName('Elior')} dreams of a shadowy figure lurking in the fields, its presence felt ` +
      'even in the waking world. The dream is unsettling, leaving him with a sense ' +
      'of foreboding that something is wrong in Willowbrook.'
    const beats: [string, string][] = [
      [
        FLAG_INVESTIGATED_WITHERED_CROPS,
        `${characterName('Elior')} has witnessed the devastation firsthand: once lush rows of crops now ` +
          'stand wilted and brown, their leaves curled and brittle. The earth beneath ' +
          'his feet is cracked and dry, and the air is thick with the scent of decay. ' +
          'Where there was once the promise of a bountiful harvest, there is now only ' +
          'ruin.',
      ],
      [
        FLAG_VILLAGER_TALKED_TO,
        'Villagers speak in hushed tones of strange happenings: animals refusing to ' +
          `leave their shelters, and shadows moving where none should be. ${characterName('Elior')} senses ` +
          'the fear growing among his neighbors, and the mystery deepens.',
      ],
      [
        FLAG_WELL_EXAMINED,
        'Rumors spread of the village well: a foul stench rising from its depths, ' +
          `and water that no one dares to drink. ${characterName('Elior')} wonders if the source of the ` +
          'corruption lies beneath the surface.',
      ],
      [
        FLAG_CONNECT_WITH_NATURE,
        `${characterName('Mira')} has urged ${characterName('Elior')} to connect with the living world and learn from its ` +
          'magic. The path forward is uncertain, but hope stirs in the heart of ' +
          'Willowbrook.',
      ],
      [
        FLAG_MAGIC_FULLY_UNLOCKED,
        `${characterName('Elior')} has proven his magical abilities are real. The villagers will look to ` +
          `him with new hope, and ${characterName('Mira')} believes he may be the key to dispelling the ` +
          `darkness. ${characterName('Mira')} has promised ${characterName('Elior')} the ` +
          '[item_name]Ancient Amulet[/item_name] once he is truly ready for the road ' +
          'ahead.',
      ],
      [
        FLAG_FOUND_RUNE_TOKEN,
        `Fishing the ring from the purified well, ${characterName('Elior')} ` +
          'drew up something else: a [item_name]rune token[/item_name] of black ' +
          'iron, scored with a twisted rune and colder than the water. ' +
          'The well did not sour by itself.',
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
