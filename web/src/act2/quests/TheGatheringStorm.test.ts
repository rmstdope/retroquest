import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act2 } from '../Act2'
import { TrainingSword } from '../items/TrainingSword'
import {
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_CEDRIC_RECOGNISED_SIGIL,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_NYX_TRIALS_PASSED,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
  FLAG_SUPPLIES_QUEST_COMPLETED,
} from '../Act2StoryFlags'
import { TheGatheringStormQuest } from './TheGatheringStorm'

describe('The Gathering Storm log', () => {
  it('is a journal of the arrival until something happens', () => {
    const game = new Game([new Act2()])
    const quest = new TheGatheringStormQuest()

    expect(quest.checkUpdate(game.state)).toBe(false)

    expect(quest.details()).toEqual({
      kind: 'journal',
      latest: quest.description.trim(),
      earlier: [],
    })
  })

  it('moves each finished stage to the earlier entries, dimmed in the prose', () => {
    const game = new Game([new Act2()])
    const quest = new TheGatheringStormQuest()
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.checkUpdate(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS, true)
    expect(quest.checkUpdate(game.state)).toBe(true)

    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier).toHaveLength(2)
    expect(details.latest).toContain('watched you with the training sword')
    expect(quest.description).toContain('[dim]Greendale is bigger')
    expect(quest.description).toContain('you with a blade.[/dim]')
    expect(quest.description.endsWith(quest.latestStage ?? '')).toBe(true)
  })

  const ENTRIES = [
    'Greendale is bigger than any place you have seen, but the talk in its ' +
      'streets is low and uneasy. People speak of a darkness gathering beyond ' +
      'the walls, and say that if anyone at the castle understands it, it is ' +
      '[character_name]Sir Cedric[/character_name].',
    '[character_name]Sir Cedric[/character_name], a knight without his ' +
      'sword, says a storm is gathering over the kingdom and he does not yet ' +
      'know its name. He will not trust you on your word; he wants to see ' +
      'you with a blade.',
    '[character_name]Sir Cedric[/character_name] knew the sigil on your ' +
      'amulet: the sun rising over three linked rings, the mark of the ' +
      'Wardens of the Dawn. Whoever wore it before you was a Warden, he ' +
      'says, and your family is bound to them.',
    '[character_name]Sir Cedric[/character_name] watched you with the ' +
      'training sword and now trusts you. He wants you to find ' +
      '[character_name]Nyx[/character_name], deep in the Enchanted Forest, ' +
      'because her old wisdom may show what you are truly facing. He gave you ' +
      'a hundred and fifty coins for a survival kit, an enhanced lantern and ' +
      'rope from the Market District.',
    'The survival kit, the lantern and the rope are packed. The merchants of ' +
      'Greendale have done what they can for you. The rest of the road leads ' +
      'to the edge of the Enchanted Forest.',
    'Beneath Greendale, the [character_name]Spectral ' +
      'Librarian[/character_name] taught you the dispel spell. The chronicle ' +
      'there was written by the Wardens of the Dawn, and their magic was the ' +
      'unbinding kind. Its last page warns that Malakar seeks the blood of ' +
      'Willowbrook.',
    "The castle archive's register names a man in a grey cloak who asked " +
      'after the families of Willowbrook, on the business of Malakar. You ' +
      'had always thought Malakar a tale. His last visit was the week King ' +
      'Alden vanished.',
    "The papers from Thorne's caravan cleared " +
      '[character_name]Sir Cedric[/character_name]' +
      "'s name. The watch was paid to let the king be taken, by the will of " +
      'Malakar, and he was carried to the bastion on the shattered ridge.',
    "At the standing stones you slept on the forest's doorstep, as the hermit asked, and dreamed of a grey field with someone at its far edge. In the morning the hermit said she had let you. Somewhere inside the forest, [character_name]Nyx[/character_name] is waiting.",
    '[character_name]Nyx[/character_name] judged you worthy and gave you the ' +
      '[spell_name]Prophetic Vision[/spell_name] spell, her token and the ' +
      'forest heart crystal. She left you with the words from the glade ' +
      'stone: power follows purpose; purpose follows truth. When every other ' +
      'task in Greendale is done, cast the vision with ' +
      '[character_name]Sir Cedric[/character_name] beside you, so you can ' +
      'both see what is coming.',
  ]
  const FLAGS = [
    FLAG_SPOKEN_TO_SIR_CEDRIC,
    FLAG_CEDRIC_RECOGNISED_SIGIL,
    FLAG_DEMONSTRATED_COMBAT_SKILLS,
    FLAG_SUPPLIES_QUEST_COMPLETED,
    FLAG_ANCIENT_LIBRARY_COMPLETED,
    FLAG_RESEARCHED_FAMILY_HERITAGE,
    FLAG_CEDRIKS_HONOR_COMPLETED,
    FLAG_HERMITS_WARNING_COMPLETED,
    FLAG_NYX_TRIALS_PASSED,
  ]

  it('opens with the agreed entry, which is also the description', () => {
    const quest = new TheGatheringStormQuest()
    expect(quest.description).toBe(ENTRIES[0])
    quest.checkUpdate(new Game([new Act2()]).state)
    expect(quest.description).toBe(ENTRIES[0])
    expect(quest.description).not.toContain('Elior')
  })

  it.each(FLAGS.map((flag, i) => [i + 2, flag] as const))(
    'shows entry %i as the latest once its moment has come',
    (n, _flag) => {
      const game = new Game([new Act2()])
      const quest = new TheGatheringStormQuest()
      for (const flag of FLAGS.slice(0, n - 1)) {
        game.state.setStoryFlag(flag, true)
      }
      quest.checkUpdate(game.state)

      expect(quest.details()).toEqual({
        kind: 'journal',
        latest: ENTRIES[n - 1],
        earlier: ENTRIES.slice(0, n - 1),
      })
    },
  )

  it('keeps the entries in order even when done out of order', () => {
    const game = new Game([new Act2()])
    const quest = new TheGatheringStormQuest()
    game.state.setStoryFlag(FLAG_NYX_TRIALS_PASSED, true)
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    quest.checkUpdate(game.state)
    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.latest).toBe(ENTRIES[ENTRIES.length - 1])
  })

  it('shows a beat noticed later as the latest, whatever its place in the story', () => {
    const game = new Game([new Act2()])
    const quest = new TheGatheringStormQuest()
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    quest.checkUpdate(game.state)
    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.latest).toBe(ENTRIES[1])
    expect(details.earlier).toEqual([ENTRIES[0], ENTRIES[7]])
  })

  it('is plain: at most three sentences, no generic phrases', () => {
    for (const entry of ENTRIES) {
      expect(entry.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(3)
      expect(entry).not.toMatch(/cosmic|otherworldly|encroaching|combat|Elior/i)
    }
  })
})

describe('The Gathering Storm log after Sir Cedric pays', () => {
  it('names the amount of coins he put in the bag', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    game.state.addItemToInventory(new TrainingSword())
    executeCommands(game, [
      'talk to sir cedric',
      'use training sword',
      'say guard to sir cedric',
      'say turn to sir cedric',
      'say strike to sir cedric',
      'talk to sir cedric',
    ])
    expect(game.state.getItemCount('coins')).toBe(150)

    const quest = [
      ...game.state.nonActivatedQuests,
      ...game.state.activatedQuests,
    ].find((q) => q instanceof TheGatheringStormQuest)
    const details = quest?.details()
    if (details?.kind !== 'journal') throw new Error('expected a journal')
    expect(details.latest).toContain('He gave you a hundred and fifty coins')
  })
})

describe('The Gathering Storm log in an older save', () => {
  it('shows the current first entry, not the one the save was made with', () => {
    const game = new Game([new Act2()])
    executeCommands(game, ['look'])
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    game.state.refreshQuestLogs()
    const old =
      'Greendale is bigger than any place you have seen. Your grandmother ' +
      'told you to find Sir Cedric at the castle; he can help you ' +
      'understand it.'
    const saved = game
      .toSaveData()
      .replace(/Greendale is bigger[^"]*?(?=\[\/dim\]|")/g, old)
    expect(saved).toContain('Your grandmother told you')

    const loaded = new Game([new Act2()])
    loaded.loadSaveData(saved)
    const quest = [
      ...loaded.state.nonActivatedQuests,
      ...loaded.state.activatedQuests,
    ].find((q) => q instanceof TheGatheringStormQuest)
    expect(quest?.description).not.toContain('grandmother')
    expect(quest?.description).toContain('[dim]Greendale is bigger')
    expect(quest?.description).toContain('it is [character_name]Sir Cedric')
  })
})
