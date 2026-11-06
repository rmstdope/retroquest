import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { expectDialogueSpeaker } from '@/testing/gameHelpers'
import {
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_KEPT_MOTHERS_RING,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
} from '../Act1StoryFlags'
import { Act1 } from '../Act1'
import { AncientAmulet } from './AncientAmulet'
import { KnowYourVillageQuest } from '../quests/KnowYourVillage'
import { FishingExpeditionQuest } from '../quests/FishingExpedition'
import { LetThereBeLightQuest } from '../quests/LetThereBeLight'
import { MagnetFishingExpeditionQuest } from '../quests/MagnetFishingExpedition'
import { GameMap } from './GameMap'

function setupGameAtRoad(): {
  act: Act1
  game: Game
  map: GameMap
} {
  const act = new Act1()
  const game = new Game([act])
  const map = new GameMap()
  game.state.currentRoom = act.rooms.RoadToGreendale
  game.state.addItemToInventory(map)
  return { act, game, map }
}

function completeSideQuestsExcept(
  game: Game,
  incompleteQuestName?: string,
): void {
  const sideQuests = [
    ...game.state.nonActivatedQuests,
    ...game.state.activatedQuests,
  ].filter((quest) => !quest.isMain())
  const incompleteQuest = sideQuests.find(
    (quest) => quest.name === incompleteQuestName,
  )

  game.state.completedQuests.push(
    ...sideQuests.filter((quest) => quest !== incompleteQuest),
  )
  game.state.nonActivatedQuests = game.state.nonActivatedQuests.filter(
    (quest) => quest.isMain() || quest === incompleteQuest,
  )
  game.state.activatedQuests = game.state.activatedQuests.filter(
    (quest) => quest.isMain() || quest === incompleteQuest,
  )
}

const LEADS = [
  'Old Man [character_name]Hemlock[/character_name] is still waiting for his cat',
  'the [character_name]fisherman[/character_name] at the river bend still sits with an empty line',
  'the [character_name]priest[/character_name] in the chapel has not had his say',
  'something still glints far down in the village [item_name]well[/item_name]',
  '[character_name]Borin[/character_name] at the forge still has a story about the [room_name]Hidden Glade[/room_name] to tell',
]
const LAST_LEAD = 'a drawer at home still holds something you have not seen'
const WELL_LEAD = LEADS[3]

/** An at-the-road game with the amulet and preparations done. */
function setupReadyExcept(): ReturnType<typeof setupGameAtRoad> {
  const setup = setupGameAtRoad()
  completeSideQuestsExcept(setup.game, 'Preparing for the road')
  setup.game.state.addItemToInventory(new AncientAmulet())
  setup.game.state.completedQuests.push(
    ...setup.game.state.nonActivatedQuests.filter(
      (q) => q.name === 'Preparing for the road',
    ),
  )
  setup.game.state.nonActivatedQuests =
    setup.game.state.nonActivatedQuests.filter((q) => q.isMain())
  return setup
}

describe('GameMap leads at the road', () => {
  it('has a lead for every side quest that is not always begun by the road', () => {
    const alwaysBegun = [
      'Hint of magic',
      'Magic for real',
      'Know your village',
      'Preparing for the road',
    ]
    const { game } = setupGameAtRoad()
    const names = game.state.nonActivatedQuests
      .filter((q) => !q.isMain() && !alwaysBegun.includes(q.name))
      .map((q) => q.name)
    game.state.nonActivatedQuests = game.state.nonActivatedQuests.filter((q) =>
      names.includes(q.name),
    )

    expect(GameMap.unstartedLeads(game.state).map((l) => l.quest)).toEqual(
      names,
    )
    expect(GameMap.hasBegunOpenTask(game.state)).toBe(false)
  })

  it('still holds the road for a never-started quest with no lead', () => {
    const { game, map } = setupReadyExcept()
    game.state.nonActivatedQuests.push(new KnowYourVillageQuest())

    expect(map.use(game.state)).toContain(
      'unfinished: the tasks you began in the village.',
    )
  })

  it('leads to a never-started task instead of calling it begun', () => {
    const { game, map } = setupReadyExcept()
    game.state.nonActivatedQuests.push(new MagnetFishingExpeditionQuest())

    expect(map.use(game.state)).toContain(`unfinished: ${WELL_LEAD}.`)
  })

  it('says begun tasks first, then every lead, in one sentence', () => {
    const { game, map } = setupReadyExcept()
    game.state.nonActivatedQuests.push(
      new FishingExpeditionQuest(),
      new MagnetFishingExpeditionQuest(),
    )
    game.state.activatedQuests.push(new LetThereBeLightQuest())

    expect(map.use(game.state)).toContain(
      'unfinished: the tasks you began in the village, ' +
        `${LEADS[1]} and ${WELL_LEAD}.`,
    )
  })

  it('reads as before when only begun tasks are open', () => {
    const { game, map } = setupReadyExcept()
    game.state.activatedQuests.push(new LetThereBeLightQuest())

    expect(map.use(game.state)).toContain(
      'unfinished: the tasks you began in the village.',
    )
  })

  it('keeps the amulet first', () => {
    const { game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game, 'Magnet fishing expedition')

    expect(map.use(game.state)).toContain(
      'unfinished: the amulet Mira still keeps for you ' + `and ${WELL_LEAD}.`,
    )
  })
})

describe('GameMap act completion', () => {
  it('does not complete the act without the ancient amulet', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game)

    const response = map.use(game.state)

    expect(response).toContain('[failure]')
    expect(act.isCompleted(game.state)).toBe(false)
  })

  it('names what is unfinished as things, never as orders, with all three missing', () => {
    const { game, map } = setupGameAtRoad()

    const response = map.use(game.state)

    expect(response).toContain(
      'The hidden road will not show itself while something here is ' +
        'unfinished: the amulet Mira still keeps for you, your preparations ' +
        `for the road, the tasks you began in the village, ${LEADS.join(', ')} and ${LAST_LEAD}.`,
    )
    expect(response).not.toMatch(/receive|You must|You need/)
  })

  it('requires the Preparing for the road quest to be complete', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game, 'Preparing for the road')
    game.state.addItemToInventory(new AncientAmulet())

    const response = map.use(game.state)

    expect(response).toContain('[failure]')
    expect(act.isCompleted(game.state)).toBe(false)
  })

  it('requires every other side quest to be complete', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game, 'The faded photograph')
    game.state.addItemToInventory(new AncientAmulet())

    const response = map.use(game.state)

    expect(response).toContain('[failure]')
    expect(act.isCompleted(game.state)).toBe(false)
  })

  it('requires Mira to have read the rune token from the well (rq-7g9c)', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game)
    game.state.addItemToInventory(new AncientAmulet())
    game.state.setStoryFlag(FLAG_FOUND_RUNE_TOKEN, true)

    expect(map.use(game.state)).toContain(
      'while something here is unfinished: the rune token Mira has not yet seen.',
    )
    expect(act.isCompleted(game.state)).toBe(false)

    game.state.setStoryFlag(FLAG_MIRA_NAMED_FOULING_SIGIL, true)
    map.use(game.state)
    expect(act.isCompleted(game.state)).toBe(true)
  })

  it('completes the act after the amulet and all side quests are secured', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game)
    game.state.addItemToInventory(new AncientAmulet())

    map.use(game.state)

    expect(act.isCompleted(game.state)).toBe(true)
  })
})

describe('GameMap farewell on the Road to Greendale', () => {
  /** The answer to the map once Elior is ready to leave, with `flags` set. */
  function farewell(flags: string[] = []): string {
    const { game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game)
    game.state.addItemToInventory(new AncientAmulet())
    for (const flag of flags) game.state.setStoryFlag(flag, true)
    return map.use(game.state)
  }

  it('lets grandmother see Elior off, rings the bell once, then shows the path', () => {
    const answer = farewell([FLAG_PATCHES_RETURNED])

    expect(findMarkupProblems(answer)).toEqual([])
    expectDialogueSpeaker(answer, 'grandmother')
    expect(answer).toContain("Wear your mother's cloak. She'd want you warm.")
    expect(answer).toContain(
      'the chapel bell rings once, with no hand on the rope.',
    )
    const bell = answer.indexOf('chapel bell rings once')
    expect(bell).toBeGreaterThan(answer.indexOf('Wear your mother'))
    expect(answer.indexOf('hidden path')).toBeGreaterThan(bell)
  })

  it('has grandmother name the parents and warn of the stranger, after the ring and Patches and before the kiss', () => {
    for (const flags of [[FLAG_PATCHES_RETURNED], []]) {
      const answer = farewell(flags)
      const hand = answer.indexOf(
        'Her hand finds the [item_name]amulet[/item_name] at your chest and closes around it.',
      )
      expect(hand).toBeGreaterThan(answer.search(/wedding ring|kept her ring/))
      expect(hand).toBeGreaterThan(answer.indexOf('Wear your mother'))
      expect(answer).toContain(
        "This was theirs, you know. [character_name]Aren[/character_name] and [character_name]Lysa[/character_name]'s.",
      )
      expect(answer).toContain(
        'In all your years, you have never once heard her say their names.',
      )
      expect(answer).toContain(
        'They gave it to [character_name]Mira[/character_name] to keep for you, until you were ready. ' +
          'And someone has come to Willowbrook looking for it. Keep it hidden, child.',
      )
      expect(answer.indexOf('Keep it hidden, child.')).toBeLessThan(
        answer.indexOf('She kisses your brow'),
      )
      expect(findMarkupProblems(answer)).toEqual([])
    }
    expect(
      farewell([FLAG_PATCHES_RETURNED]).indexOf('Her hand finds'),
    ).toBeGreaterThan(
      farewell([FLAG_PATCHES_RETURNED]).indexOf('how you found his'),
    )
  })

  it('ends the map line on hiding the amulet, not on accomplishment', () => {
    const answer = farewell()

    expect(answer).toContain(
      "You tuck your parents' amulet beneath your mother's cloak, and set forth.",
    )
    expect(answer).not.toContain('accomplishment')
  })

  it('has grandmother speak of the traded ring by default', () => {
    const answer = farewell()

    expect(answer).toContain('wedding ring')
    expect(answer).not.toContain('you kept her ring')
  })

  it('has grandmother speak of the kept ring', () => {
    const answer = farewell([FLAG_KEPT_MOTHERS_RING])

    expect(answer).toContain('you kept her ring')
    expect(answer).not.toContain('wedding ring')
  })

  it('has grandmother speak of Patches, wherever she went', () => {
    expect(farewell([FLAG_PATCHES_RETURNED])).toContain(
      'how you found his [character_name]Patches',
    )
    expect(farewell([FLAG_PATCHES_STAYED_WITH_GRANDMOTHER])).toContain(
      'claimed your pillow',
    )
    expect(farewell()).not.toContain('Patches')
  })
})
