import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_NYX_TRIALS_COMPLETED,
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
    expect(quest.description).toContain('with the training sword.[/dim]')
    expect(quest.description.endsWith(quest.latestStage ?? '')).toBe(true)
  })

  const ENTRIES = [
    'Greendale is bigger than any place you have seen, but the talk in its ' +
      'streets is low and uneasy. People speak of a darkness gathering beyond ' +
      'the walls. Your grandmother told you to find ' +
      '[character_name]Sir Cedric[/character_name] at the castle; he can help ' +
      'you understand it.',
    '[character_name]Sir Cedric[/character_name] calls it the Gathering ' +
      'Storm. He needs allies who know magic, but he will not trust you on ' +
      'your word alone. He wants to see you fight first, with the training ' +
      'sword.',
    '[character_name]Sir Cedric[/character_name] watched you with the ' +
      'training sword and now trusts you. He wants you to find ' +
      '[character_name]Nyx[/character_name], deep in the Enchanted Forest, ' +
      'because her old wisdom may show what you are truly facing. He gave you ' +
      'a hundred coins for a survival kit, an enhanced lantern and rope from ' +
      'the Market District.',
    'The survival kit, the lantern and the rope are packed. The merchants of ' +
      'Greendale have done what they can for you. The rest of the road leads ' +
      'to the edge of the Enchanted Forest.',
    'Beneath Greendale, the [character_name]Spectral ' +
      'Librarian[/character_name] taught you the dispel spell. The chronicle ' +
      'there was written by the Wardens of the Dawn, and their magic was the ' +
      'unbinding kind. Its last page warns that Malakar seeks the blood of ' +
      'Willowbrook.',
    'At the standing stones you opened the survival kit and studied its map, ' +
      'as the hermit urged. You know now which paths to take and which to ' +
      'avoid. Somewhere inside the forest, [character_name]Nyx[/character_name] ' +
      'is waiting.',
    '[character_name]Nyx[/character_name] judged you worthy and gave you the ' +
      '[spell_name]Prophetic Vision[/spell_name] spell, her token and the ' +
      'Forest Heart Crystal. She left you with the words from the glade ' +
      'stone: power follows purpose; purpose follows truth. When every other ' +
      'task in Greendale is done, cast the vision with ' +
      '[character_name]Sir Cedric[/character_name] beside you, so you can ' +
      'both see what is coming.',
  ]
  const FLAGS = [
    FLAG_SPOKEN_TO_SIR_CEDRIC,
    FLAG_DEMONSTRATED_COMBAT_SKILLS,
    FLAG_SUPPLIES_QUEST_COMPLETED,
    FLAG_ANCIENT_LIBRARY_COMPLETED,
    FLAG_HERMITS_WARNING_COMPLETED,
    FLAG_NYX_TRIALS_COMPLETED,
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
    game.state.setStoryFlag(FLAG_NYX_TRIALS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    quest.checkUpdate(game.state)
    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.latest).toBe(ENTRIES[6])
  })

  it('is plain: at most three sentences, no generic phrases', () => {
    for (const entry of ENTRIES) {
      expect(entry.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(3)
      expect(entry).not.toMatch(/cosmic|otherworldly|encroaching|combat|Elior/i)
    }
  })
})
