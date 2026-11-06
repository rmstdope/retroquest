import { describe, it, expect } from 'vitest'
import { characterName, Game } from '@/engine'
import { Act1 } from '../Act1'
import { AncientAmulet } from '../items/AncientAmulet'
import { RareFlower } from '../items/RareFlower'
import { Mechanism } from '../items/Mechanism'
import { MillstoneFragment } from '../items/MillstoneFragment'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_DEER_CAN_BE_OBSERVED,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_MERCHANT_NEWS_HEARD,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
  FLAG_STRANGER_SEEN_AT_MILL,
  FLAG_VEGETABLE_FIELD_WATERED,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
  FLAG_WOKE_FROM_DREAM,
} from '../Act1StoryFlags'
import { FishingExpeditionQuest } from './FishingExpedition'
import { MagnetFishingExpeditionQuest } from './MagnetFishingExpedition'
import { ShadowsOverWillowbrookQuest } from './ShadowsOverWillowbrook'
import { ACT1_GOLDEN_PATH } from '../Act1GoldenPath'
import { executeCommands } from '@/testing/gameHelpers'

describe('Shadows over Willowbrook log', () => {
  it('starts as a journal of the dream alone', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()

    expect(quest.checkUpdate(game.state)).toBe(false)

    const details = quest.details()
    expect(details).toMatchObject({ kind: 'journal', earlier: [] })
    expect(quest.description).toBe(
      details.kind === 'journal' ? details.latest : '',
    )
  })

  it('keeps earlier beats apart from the newest and dims them in the prose', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)

    expect(quest.checkUpdate(game.state)).toBe(true)

    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier).toHaveLength(2)
    expect(details.latest).toContain(
      `${characterName('Tilda')} has more rumours than bread`,
    )
    expect(quest.description).toBe(
      (quest.earlierStages ?? [])
        .map((stage) => `[dim]${stage}[/dim]`)
        .join('') + quest.latestStage,
    )
    expect(quest.description.startsWith('[dim]You dreamed')).toBe(true)
  })

  it('shows its log right after loading a save made before logs were data', () => {
    const game = new Game([new Act1()])
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    // Never updated, as in a save from before quests kept their log as data.
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.activatedQuests = [quest]
    expect(quest.earlierStages).toBeUndefined()

    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())

    const loaded = fresh.state.activatedQuests[0]
    const details = loaded.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier).toHaveLength(2)
    expect(details.latest).toContain(
      `${characterName('Tilda')} has more rumours than bread`,
    )
    expect(fresh.state.nextUpdatedQuest()).toBeNull()
  })

  it('tells the dream the player played, and ends on the amulet on the road', () => {
    const quest = new ShadowsOverWillowbrookQuest()
    quest.checkUpdate(new Game([new Act1()]).state)

    expect(quest.description).toContain(
      'You dreamed of a storm, a tune, and a figure in the dark that ' +
        'whispered your name. You woke with three words written down: ' +
        '…let them rest…',
    )
    expect(quest.completion).toContain('The well was poisoned on purpose')
    expect(quest.completion).toContain('on the road to Greendale')
    expect(quest.completion).toContain('You carry that amulet now')
    expect(quest.completion).not.toContain('Elior')
    expect(quest.completion).not.toContain('key to protecting')
  })

  it('logs the stranger at the mill after the rune token', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_FOUND_RUNE_TOKEN, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_STRANGER_SEEN_AT_MILL, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.latestStage).toBe(
      '\nAt the [room_name]Old Mill[/room_name] a man in a grey cloak stood ' +
        'at the far door with his back to you. He left toward the river ' +
        'without turning.',
    )
    expect(quest.earlierStages?.join('')).toContain('rune token')
    expect(quest.checkUpdate(game.state)).toBe(false)
  })

  it('speaks to the player in every beat and never names Elior', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    for (const flag of [
      FLAG_INVESTIGATED_WITHERED_CROPS,
      FLAG_VILLAGER_TALKED_TO,
      FLAG_WELL_EXAMINED,
      FLAG_CONNECT_WITH_NATURE,
      FLAG_MAGIC_FULLY_UNLOCKED,
      FLAG_FOUND_RUNE_TOKEN,
      FLAG_STRANGER_SEEN_AT_MILL,
      FLAG_VEGETABLE_FIELD_WATERED,
      FLAG_MIRA_NAMED_FOULING_SIGIL,
      FLAG_MERCHANT_NEWS_HEARD,
    ]) {
      game.state.setStoryFlag(flag, true)
    }

    quest.checkUpdate(game.state)

    expect(quest.description).not.toContain('Elior')
    expect(quest.description).not.toMatch(/\b(him|he woke)\b/)
    expect(quest.description).toContain('you brought the')
    expect(quest.description).toContain('The flower opened for you')
  })

  it('records the amulet promise rather than a druid once magic is unlocked', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)

    quest.checkUpdate(game.state)

    expect(quest.latestStage).toContain('[item_name]ancient amulet[/item_name]')
    expect(quest.description).not.toContain('druid')
  })

  it('records the rune token from the well as a real discovery', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_FOUND_RUNE_TOKEN, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.latestStage).toContain('[item_name]rune token[/item_name]')

    game.state.setStoryFlag(FLAG_MIRA_NAMED_FOULING_SIGIL, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.latestStage).toContain('fouling sigil')
    expect(quest.latestStage).toContain('on purpose')
    expect(quest.description).not.toContain('Malakar')
  })

  it('acknowledges the watered field', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.latestStage).toContain(
      '[room_name]Vegetable Field[/room_name]',
    )
  })

  it('shows the watered field as the newest beat when it comes last', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_FOUND_RUNE_TOKEN, true)
    game.state.setStoryFlag(FLAG_MIRA_NAMED_FOULING_SIGIL, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.latestStage).toContain(
      '[room_name]Vegetable Field[/room_name]',
    )
  })

  it('shows the rune token as the newest beat when found after watering', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_FOUND_RUNE_TOKEN, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.latestStage).toContain('[item_name]rune token[/item_name]')
    expect(quest.earlierStages).toHaveLength(2)
  })

  it('records the merchant news as the newest entry, then folds it in', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_MERCHANT_NEWS_HEARD, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.latestStage).toContain('King Alden lies ill')
    expect(quest.latestStage).toContain(characterName('merchant'))
    expect(quest.checkUpdate(game.state)).toBe(false)

    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    quest.checkUpdate(game.state)

    expect(quest.latestStage).toContain(
      '[room_name]Vegetable Field[/room_name]',
    )
    expect(quest.earlierStages?.join('')).toContain('King Alden lies ill')
  })

  it('folds the village signs and Mira’s words in before the flower, quietly, when noticed after it', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)

    expect(quest.checkUpdate(game.state)).toBe(false)
    expect(quest.latestStage).toContain('The flower opened for you.')
    const earlier = (quest.earlierStages ?? []).join('')
    expect(earlier.indexOf('rumours than bread')).toBeLessThan(
      earlier.indexOf('smells sour'),
    )
    expect(earlier.indexOf('smells sour')).toBeLessThan(
      earlier.indexOf('one wound'),
    )
  })

  it('does not say Mira wants the flower when she already has it', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    quest.checkUpdate(game.state)

    const earlier = (quest.earlierStages ?? []).join('')
    expect(earlier).toContain('one wound.')
    expect(earlier).not.toContain('She wants a rare flower')
  })

  it('keeps the flower request out of the journal when Mira is given the flower before the signs', () => {
    const game = new Game([new Act1()])
    game.state.setStoryFlag(FLAG_WOKE_FROM_DREAM, true)
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.currentRoom = game.state.allRooms.MirasHut
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['look', 'give rare flower to mira'])
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)
    executeCommands(game, ['talk to mira'])

    const quest = game.state.getQuest('Shadows over Willowbrook')
    const journal = [
      ...(quest?.earlierStages ?? []),
      quest?.latestStage ?? '',
    ].join('')
    expect(journal).toContain('one wound.')
    expect(journal).not.toContain('She wants a rare flower')
  })

  it('still records Mira asking for the flower when the signs come first', () => {
    const game = new Game([new Act1()])
    const quest = new ShadowsOverWillowbrookQuest()
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    quest.checkUpdate(game.state)

    expect((quest.earlierStages ?? []).join('')).toContain(
      'She wants a rare flower',
    )
  })

  it('turns the hint toward the map once everything is done and Elior is on the road', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ACT1_GOLDEN_PATH)
    expect(game.state.currentRoom.name).toBe('Road to Greendale')

    const hint = game.hint()

    expect(hint).toContain('[item_name]map[/item_name]')
    expect(hint).not.toMatch(/\buse\b/i)
  })

  it('keeps the journal hint while a side quest is still open on the road', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ACT1_GOLDEN_PATH)
    const sideQuest = game.state.completedQuests.find(
      (quest) => !quest.isMain(),
    )
    if (!sideQuest) throw new Error('expected a completed side quest')
    game.state.activatedQuests.push(sideQuest)

    expect(game.hint()).not.toContain('The [item_name]map[/item_name] in your')
    expect(game.hint()).toContain('Willowbrook still holds you')
  })

  it('leads to the first never-started task once no begun one is open', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ACT1_GOLDEN_PATH)
    game.state.nonActivatedQuests.push(
      new FishingExpeditionQuest(),
      new MagnetFishingExpeditionQuest(),
    )

    expect(game.hint()).toContain(
      'The amulet is yours, but Willowbrook still holds you: the ' +
        `${characterName('fisherman')} at the river bend still sits with an empty line.`,
    )
    game.state.nonActivatedQuests.shift()
    expect(game.hint()).toContain(
      'The amulet is yours, but Willowbrook still holds you: far down in ' +
        'the [item_name]well[/item_name], something still glints.',
    )
  })

  it('says the begun line before any lead', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ACT1_GOLDEN_PATH)
    game.state.nonActivatedQuests.push(new MagnetFishingExpeditionQuest())
    game.state.activatedQuests.push(new FishingExpeditionQuest())

    expect(game.hint()).toContain(LINE_6)
  })

  it('points to the road, not the map in the pack, away from the road', () => {
    const game = new Game([new Act1()])
    executeCommands(game, [...ACT1_GOLDEN_PATH, 'go west'])

    expect(game.hint()).toContain(LINE_7)
  })
})

const LINE_1 =
  'Something is wrong in Willowbrook. The fields, the square and the well ' +
  'each hold a part of it.'
const LINE_2 =
  `${characterName('Mira')}, in her hut north of the square, would want to ` +
  'hear what you have seen.'
const LINE_3 =
  `${characterName('Mira')} is waiting for the ` +
  '[item_name]rare flower[/item_name] from the ' +
  '[room_name]Hidden Glade[/room_name], the one that opens only for ' +
  'someone the land trusts.'
const MILL_LEAD =
  ' The land has no reason to trust anyone yet: something in the ' +
  '[room_name]Old Mill[/room_name] is still drawing on it.'
const JAMMED_LEAD =
  ' The [item_name]strange mechanism[/item_name] in the ' +
  '[room_name]Old Mill[/room_name] is still now, and it gave up a ' +
  '[item_name]millstone fragment[/item_name] when it stopped.'
const FRAGMENT_LEAD =
  ' The [item_name]millstone fragment[/item_name] is old stone. ' +
  `${characterName('Borin')} at the forge knows old stone.`
const LINE_4 =
  'The [item_name]rune token[/item_name] from the well is cold, and not ' +
  `from here. ${characterName('Mira')} may know what it is.`
const LINE_5 =
  `${characterName('Mira')} keeps the [item_name]ancient amulet[/item_name] ` +
  'for you until you are ready for the road.'
const LINE_6 =
  'The amulet is yours, but Willowbrook still holds you: something you ' +
  'began here is unfinished.'
const LINE_7 =
  'Nothing is left undone in Willowbrook. The ' +
  '[room_name]Road to Greendale[/room_name] starts past the chapel, and ' +
  'the [item_name]map[/item_name] may know the way on.'
const LINE_8 =
  'Nothing is left undone in Willowbrook. The [item_name]map[/item_name] ' +
  'in your pack may know the way on from here.'

/** The hint of a fresh game with the given flags set. */
function hintWith(flags: string[], amulet = false): string | null {
  const game = gameWith(flags)
  if (amulet) game.state.addItemToInventory(new AncientAmulet())
  return new ShadowsOverWillowbrookQuest().hint(game.state)
}

/** A fresh Act I game with the given flags set. */
function gameWith(flags: string[]): Game {
  const game = new Game([new Act1()])
  for (const flag of flags) game.state.setStoryFlag(flag, true)
  return game
}

/** Jam the stranger's mechanism in the Old Mill, as the rope does. */
function jamMechanism(game: Game): void {
  const mechanism = game.state.allRooms.OldMill.items.find(
    (item) => item instanceof Mechanism,
  )
  if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
  mechanism.repaired = true
}

describe('Shadows over Willowbrook hint', () => {
  const looked = [
    FLAG_INVESTIGATED_WITHERED_CROPS,
    FLAG_VILLAGER_TALKED_TO,
    FLAG_WELL_EXAMINED,
  ]

  it('says something is wrong at the start', () => {
    expect(hintWith([])).toBe(LINE_1)
    expect(hintWith([FLAG_VILLAGER_TALKED_TO])).toBe(LINE_1)
  })

  it('sends Elior to Mira once he has looked at all three', () => {
    expect(hintWith(looked)).toBe(LINE_2)
  })

  it('waits for the flower once Mira has asked, not the merchant news', () => {
    const flags = [
      ...looked,
      FLAG_CONNECT_WITH_NATURE,
      FLAG_MERCHANT_NEWS_HEARD,
    ]
    expect(hintWith(flags)).toBe(LINE_3 + MILL_LEAD)
  })

  describe('with the flower missing from the glade (rq-srn6)', () => {
    const asked = [...looked, FLAG_CONNECT_WITH_NATURE]

    it('points at the mill while the mechanism still runs', () => {
      expect(hintWith(asked)).toBe(LINE_3 + MILL_LEAD)
    })

    it('points at the fragment once the mechanism is jammed', () => {
      const game = gameWith(asked)
      jamMechanism(game)
      expect(new ShadowsOverWillowbrookQuest().hint(game.state)).toBe(
        LINE_3 + JAMMED_LEAD,
      )
    })

    it('points the fragment in hand at Borin', () => {
      const game = gameWith(asked)
      jamMechanism(game)
      game.state.addItemToInventory(new MillstoneFragment())
      expect(new ShadowsOverWillowbrookQuest().hint(game.state)).toBe(
        LINE_3 + FRAGMENT_LEAD,
      )
    })

    it('waits for the flower alone once Borin has told of the deer', () => {
      const game = gameWith([...asked, FLAG_DEER_CAN_BE_OBSERVED])
      jamMechanism(game)
      expect(new ShadowsOverWillowbrookQuest().hint(game.state)).toBe(LINE_3)
    })

    it('waits for the flower alone once it is in hand', () => {
      const game = gameWith(asked)
      game.state.addItemToInventory(new RareFlower())
      expect(new ShadowsOverWillowbrookQuest().hint(game.state)).toBe(LINE_3)
    })

    it('never names a command', () => {
      const game = gameWith(asked)
      const hints = [new ShadowsOverWillowbrookQuest().hint(game.state)]
      jamMechanism(game)
      hints.push(new ShadowsOverWillowbrookQuest().hint(game.state))
      game.state.addItemToInventory(new MillstoneFragment())
      hints.push(new ShadowsOverWillowbrookQuest().hint(game.state))
      for (const hint of hints) {
        expect(hint).not.toMatch(
          /\b(go|move|talk|speak|say|give|hand|buy|look|examine|inspect|search|take|grab|use|open|cast|rest|jam)\b/i,
        )
      }
    })
  })

  it('points the unread rune token to Mira, also after the mill sighting', () => {
    const flags = [
      ...looked,
      FLAG_CONNECT_WITH_NATURE,
      FLAG_MAGIC_FULLY_UNLOCKED,
      FLAG_FOUND_RUNE_TOKEN,
      FLAG_STRANGER_SEEN_AT_MILL,
    ]
    expect(hintWith(flags)).toBe(LINE_4)
  })

  it('waits for the amulet once the flower is given', () => {
    const given = [
      ...looked,
      FLAG_CONNECT_WITH_NATURE,
      FLAG_MAGIC_FULLY_UNLOCKED,
    ]
    expect(hintWith(given)).toBe(LINE_5)
    expect(
      hintWith([
        ...given,
        FLAG_FOUND_RUNE_TOKEN,
        FLAG_MIRA_NAMED_FOULING_SIGIL,
      ]),
    ).toBe(LINE_5)
  })

  it('says the village still holds Elior once the amulet is in hand', () => {
    const flags = [
      ...looked,
      FLAG_CONNECT_WITH_NATURE,
      FLAG_MAGIC_FULLY_UNLOCKED,
      FLAG_FOUND_RUNE_TOKEN,
      FLAG_MIRA_NAMED_FOULING_SIGIL,
    ]
    expect(hintWith(flags, true)).toBe(LINE_6)
  })

  it('sends Elior to Mira with the token before the amulet holds him (rq-7g9c)', () => {
    const flags = [
      ...looked,
      FLAG_CONNECT_WITH_NATURE,
      FLAG_MAGIC_FULLY_UNLOCKED,
      FLAG_FOUND_RUNE_TOKEN,
    ]
    expect(hintWith(flags, true)).toBe(LINE_4)
  })

  it('reads the same after a save is loaded', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ACT1_GOLDEN_PATH)
    const before = game.hint()
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())

    expect(before).toContain(LINE_8)
    expect(fresh.hint()).toBe(before)
  })
})
