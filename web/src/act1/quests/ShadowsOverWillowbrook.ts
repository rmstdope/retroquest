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
import { GameMap } from '../items/GameMap'
import { RoadToGreendale } from '../rooms/RoadToGreendale'

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
      name: 'Shadows over Willowbrook',
      description:
        'Something is wrong in Willowbrook. The crops are failing, the well ' +
        'smells sour, and the village keeps its voice down.',
      completion:
        'The well was poisoned on purpose, and whoever did it came to ' +
        'Willowbrook looking for an amulet. ' +
        'You carry that amulet now, on the road to Greendale.',
    })
  }

  /** Give a save made with the title-case name the current name and completion. */
  override refreshSavedText(): void {
    const current = new ShadowsOverWillowbrookQuest()
    this.name = current.name
    this.completion = current.completion
  }

  /** Given when the player wakes from the dream in the cottage. */
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
   * insertion order, in saves too), so the newest beat is usually the latest.
   * The village's signs and Mira's words on them always come before the
   * flower, even when noticed after it, so the log never steps backwards;
   * her words carry her request for the flower only when she did not have
   * it yet.
   * True only when the newest entry changed: a beat folded in among the
   * earlier ones is not news, or the story would repeat the newest entry.
   */
  override checkUpdate(gameState: GameState): boolean {
    const dream =
      'You dreamed of a storm, a tune, and a figure in the dark that ' +
      'whispered your name. You woke with three words written down: ' +
      '…let them rest…'
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
          'sickness of the king feel like one wound.',
      ],
      [
        FLAG_MAGIC_FULLY_UNLOCKED,
        'The flower opened for you. ' +
          `${characterName('Mira')} showed you how to mend, how to open and ` +
          'how to make a light, and promised you the ' +
          '[item_name]ancient amulet[/item_name] once you are ready for the road.',
      ],
      [
        FLAG_FOUND_RUNE_TOKEN,
        'Fishing the ring from the purified well, you ' +
          'drew up something else: a [item_name]rune token[/item_name] of black ' +
          'iron, scored with a twisted rune and colder than the water. ' +
          'The well did not sour by itself.',
      ],
      [
        FLAG_STRANGER_SEEN_AT_MILL,
        'At the [room_name]Old Mill[/room_name] a man in a grey cloak stood at ' +
          'the far door with his back to you. He left ' +
          'toward the river without turning.',
      ],
      [
        FLAG_VEGETABLE_FIELD_WATERED,
        'With clean water from the well, you brought ' +
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
    const flowerAt = beats.findIndex(
      ([flag]) => flag === FLAG_MAGIC_FULLY_UNLOCKED,
    )
    const chapter = (flag: string): number =>
      beats.findIndex(([beat]) => beat === flag) < flowerAt ? 0 : 1
    shown.sort(
      ([a], [b]) =>
        chapter(a) - chapter(b) || noticed.indexOf(a) - noticed.indexOf(b),
    )
    // Her request for the flower is news only while she does not have it.
    const flowerFirst =
      noticed.includes(FLAG_MAGIC_FULLY_UNLOCKED) &&
      noticed.indexOf(FLAG_MAGIC_FULLY_UNLOCKED) <
        noticed.indexOf(FLAG_CONNECT_WITH_NATURE)
    const request =
      ' She wants a rare flower from the Hidden Glade, one that opens only ' +
      'for someone the land trusts.'
    const stages = [
      dream,
      ...shown.map(
        ([flag, text]) =>
          `\n${text}` +
          (flag === FLAG_CONNECT_WITH_NATURE && !flowerFirst ? request : ''),
      ),
    ]
    const latestBefore = this.latestStage
    this.setJournal(stages.slice(0, -1), stages[stages.length - 1])
    return updated && this.latestStage !== latestBefore
  }

  /**
   * One short line saying what to do next, chosen from the furthest point of
   * the story reached (flags, the amulet and `GameMap.unfinishedBeforeTheRoad`),
   * never the newest journal entry. It reads only game state, so it is the same
   * after a reload. An unread rune token is named before the amulet, since
   * it alone keeps Elior here once the amulet is his.
   */
  override hint(gameState: GameState): string | null {
    const flag = (name: string): boolean => gameState.getStoryFlag(name)
    const mira = characterName('Mira')
    if (GameMap.unfinishedBeforeTheRoad(gameState).length === 0) {
      if (
        gameState.currentRoom instanceof RoadToGreendale &&
        gameState.hasItem('map')
      ) {
        return (
          'Nothing is left undone in Willowbrook. ' +
          'The [item_name]map[/item_name] in your pack may know the way on ' +
          'from here.'
        )
      }
      return (
        'Nothing is left undone in Willowbrook. ' +
        'The [room_name]Road to Greendale[/room_name] starts past the ' +
        'chapel, and the [item_name]map[/item_name] may know the way on.'
      )
    }
    if (flag(FLAG_FOUND_RUNE_TOKEN) && !flag(FLAG_MIRA_NAMED_FOULING_SIGIL)) {
      return (
        'The [item_name]rune token[/item_name] from the well is cold, and ' +
        `not from here. ${mira} may know what it is.`
      )
    }
    if (gameState.hasItem('ancient amulet')) {
      return (
        'The amulet is yours, but Willowbrook still holds you: something ' +
        'you began here is unfinished.'
      )
    }
    if (flag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return (
        `${mira} keeps the [item_name]ancient amulet[/item_name] for you ` +
        'until you are ready for the road.'
      )
    }
    if (flag(FLAG_CONNECT_WITH_NATURE)) {
      return (
        `${mira} is waiting for the [item_name]rare flower[/item_name] ` +
        'from the [room_name]Hidden Glade[/room_name], the one that opens ' +
        'only for someone the land trusts.'
      )
    }
    if (
      flag(FLAG_INVESTIGATED_WITHERED_CROPS) &&
      flag(FLAG_VILLAGER_TALKED_TO) &&
      flag(FLAG_WELL_EXAMINED)
    ) {
      return (
        `${mira}, in her hut north of the square, would want to hear what ` +
        'you have seen.'
      )
    }
    return (
      'Something is wrong in Willowbrook. ' +
      'The fields, the square and the well each hold a part of it.'
    )
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED)
  }

  override isMain(): boolean {
    return true
  }
}
