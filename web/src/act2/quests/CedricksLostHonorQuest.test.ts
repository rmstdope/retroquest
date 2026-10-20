import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_EXAMINED_SECRET_DOCUMENTS,
  FLAG_READ_SQUIRES_DIARY,
} from '../Act2StoryFlags'
import { CedricksLostHonorQuest } from './CedricksLostHonorQuest'

describe("Cedric's Lost Honor log", () => {
  it('is a journal of the accusation until the diary is read', () => {
    const game = new Game([new Act2()])
    const quest = new CedricksLostHonorQuest()

    expect(quest.checkUpdate(game.state)).toBe(false)

    expect(quest.details()).toMatchObject({ kind: 'journal', earlier: [] })
    expect(quest.description).toMatch(/^Sir Cedric has been living/)
  })

  it('dims the accusation once the diary adds the squires information', () => {
    const game = new Game([new Act2()])
    const quest = new CedricksLostHonorQuest()
    game.state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)

    expect(quest.checkUpdate(game.state)).toBe(true)

    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier).toHaveLength(1)
    expect(details.latest).toContain('secret documents')
    expect(quest.description).toBe(
      `[dim]${quest.earlierStages?.[0]}[/dim]${quest.latestStage}`,
    )
    expect(quest.description.startsWith('[dim]Sir Cedric has been')).toBe(true)
  })

  it('has two earlier entries after the documents are examined', () => {
    const game = new Game([new Act2()])
    const quest = new CedricksLostHonorQuest()
    game.state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)
    game.state.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)

    quest.checkUpdate(game.state)

    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier).toHaveLength(2)
    expect(details.latest).toContain('You have found the secret documents')
  })
})
