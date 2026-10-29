import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from './Act2'
import { FLYER_DESCRIPTION, MerchantsFlyer } from './items/MerchantsFlyer'
import {
  MountainHermit,
  MOUNTAIN_HERMIT_DESCRIPTION,
} from './characters/MountainHermit'
import {
  INNKEEPERS_DAUGHTER_COMPLETION,
  INNKEEPERS_DAUGHTER_DESCRIPTION,
  TheInnkeepersDaughterQuest,
} from './quests/TheInnkeepersDaughter'

describe('Act2.afterLoad clue wording', () => {
  it('brings the hermit and the Elena quest up to date in older saves', () => {
    const game = new Game([new Act2()])
    const hermit = Object.values(game.state.allRooms)
      .flatMap((room) => room.characters)
      .find((c) => c instanceof MountainHermit)
    const quest = [
      ...game.state.nonActivatedQuests,
      ...game.state.activatedQuests,
      ...game.state.completedQuests,
    ].find((q) => q instanceof TheInnkeepersDaughterQuest)
    expect(hermit).toBeDefined()
    expect(quest).toBeDefined()
    if (!hermit || !quest) return
    hermit.description = 'A broad old man in a patched grey castle cloak.'
    quest.description = 'cursed by a dark wizard'
    quest.completion = "free from the wizard's curse!"

    new Act2().afterLoad(game.state)

    expect(hermit.description).toBe(MOUNTAIN_HERMIT_DESCRIPTION)
    expect(quest.description).toBe(INNKEEPERS_DAUGHTER_DESCRIPTION)
    expect(quest.completion).toBe(INNKEEPERS_DAUGHTER_COMPLETION)
    expect(quest.completion).toContain('unbound the curse')
    expect(quest.completion).not.toMatch(/wizard|shatter/)
  })
})

describe('Act2.afterLoad flyer wording', () => {
  it('gives the merchant flyer its current description in older saves', () => {
    const game = new Game([new Act2()])
    const flyer = new MerchantsFlyer()
    flyer.description = 'A colorful handbill with premium goods.'
    game.state.inventory.push(flyer)

    new Act2().afterLoad(game.state)

    expect(flyer.description).toBe(FLYER_DESCRIPTION)
    expect(flyer.description).toContain('Bring this, and be welcome.')
    expect(flyer.description).not.toContain('premium')
  })
})
