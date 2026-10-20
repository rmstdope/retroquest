import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_VILLAGER_TALKED_TO,
} from '../Act1StoryFlags'
import { ShadowsOverWillowbrookQuest } from './ShadowsOverWillowbrook'

describe('Shadows Over Willowbrook log', () => {
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
    expect(details.latest).toContain('Villagers speak in hushed tones')
    expect(quest.description).toBe(
      (quest.earlierStages ?? [])
        .map((stage) => `[dim]${stage}[/dim]`)
        .join('') + quest.latestStage,
    )
    expect(quest.description.startsWith('[dim]Elior dreams')).toBe(true)
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
    expect(details.latest).toContain('Villagers speak in hushed tones')
    expect(fresh.state.nextUpdatedQuest()).toBeNull()
  })
})
