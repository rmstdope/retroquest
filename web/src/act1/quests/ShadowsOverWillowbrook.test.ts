import { describe, it, expect } from 'vitest'
import { characterName, Game } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_MERCHANT_NEWS_HEARD,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
  FLAG_VEGETABLE_FIELD_WATERED,
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
    expect(
      quest.description.startsWith(`[dim]${characterName('Elior')} dreams`),
    ).toBe(true)
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

    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    quest.checkUpdate(game.state)

    expect(quest.latestStage).toContain('Villagers speak in hushed tones')
    expect(quest.earlierStages?.join('')).toContain('King Alden lies ill')
  })
})
