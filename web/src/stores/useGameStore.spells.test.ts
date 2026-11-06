import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { Act, Item, Room, Spell, type GameState } from '@/engine'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { useGameStore } from './useGameStore'

/** The spell the tome teaches. */
class ReviveTestSpell extends Spell {
  constructor() {
    super({
      id: 'revive',
      name: 'revive',
      description: 'Your father’s word for calling a thing back.',
    })
  }
}

/** An item that teaches its spell the first time it is picked up. */
class Tome extends Item {
  constructor() {
    super({ name: 'tome', description: 'Old.', canBeCarried: true })
  }

  /** Teach the spell, once, and say so the way the engine's characters do. */
  override pickedUp(gameState: GameState): string {
    if (gameState.hasSpell('revive')) return ''
    gameState.learnSpell(new ReviveTestSpell())
    return 'The pages hum.\nYou have learned [spell_name]revive[/spell_name].'
  }
}

/** A second tome teaching the same spell, so it can be picked up once the spell is known. */
class SecondTome extends Tome {
  constructor() {
    super()
    this.name = 'second tome'
  }
}

/** One room and two tomes. */
class TomeAct extends Act {
  constructor() {
    super({
      name: 'Tome Act',
      rooms: {
        Study: new Room({
          name: 'Study',
          description: 'A study.',
          items: [new Tome(), new SecondTome()],
        }),
      },
      quests: [],
      classes: { Tome, SecondTome, ReviveTestSpell },
      musicFile: '',
      musicInfo: '',
    })
  }

  /** Never complete. */
  override isCompleted(): boolean {
    return false
  }
}

/** The store's spell news over the real engine: names and descriptions as the Spells list gives them. */
describe('spell news from the real engine', () => {
  let store: ReturnType<typeof useGameStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useGameStore()
    store.setBridge(useBridge(async (): Promise<ActClass[]> => [TomeAct]))
    await store.initGame()
    store.dismissModal()
  })

  it('gives the turn that taught a spell its news, and strips the learned line once told', () => {
    store.submitCommand('take tome')
    const turn = store.turns.at(-1)!

    expect(turn.spells).toEqual([
      { name: 'Revive', text: 'Your father’s word for calling a thing back.' },
    ])
    store.tellSpellsInMiddle(turn.id)
    expect(turn.text).not.toContain('You have learned')
    expect(turn.text).toContain('The pages hum.')
    expect(turn.fullText).toContain('You have learned')
  })

  it('tells nothing for a spell that is already known', () => {
    store.submitCommand('take tome')
    store.submitCommand('take second tome')

    expect(store.turns.at(-1)?.spells).toBeUndefined()
  })
})
