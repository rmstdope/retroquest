import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { expectDialogueSpeaker } from '@/testing/gameHelpers'
import {
  FLAG_KEPT_MOTHERS_RING,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
} from '../Act1StoryFlags'
import { Act1 } from '../Act1'
import { AncientAmulet } from './AncientAmulet'
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

describe('GameMap act completion', () => {
  it('does not complete the act without the Ancient Amulet', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game)

    const response = map.use(game.state)

    expect(response).toContain('[failure]')
    expect(act.isCompleted(game.state)).toBe(false)
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
    completeSideQuestsExcept(game, 'The Faded Photograph')
    game.state.addItemToInventory(new AncientAmulet())

    const response = map.use(game.state)

    expect(response).toContain('[failure]')
    expect(act.isCompleted(game.state)).toBe(false)
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
      expect(hand).toBeGreaterThan(answer.indexOf('ring'))
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
