import { describe, it, expect } from 'vitest'
import { Quest } from './Quest'
import { GameState } from './GameState'
import { Room } from './Room'

function gameState(): GameState {
  const start = new Room({ name: 'Start', description: '' })
  return new GameState(start, { Start: start }, [])
}

describe('Quest', () => {
  it('has a default completion text', () => {
    const q = new Quest({ name: 'Find the key', description: 'd' })
    expect(q.completion).toBe("You have completed the quest 'Find the key'.")
    const custom = new Quest({
      name: 'Q',
      description: 'd',
      completion: 'Done.',
    })
    expect(custom.completion).toBe('Done.')
  })

  it('is a side quest that neither triggers nor updates by default', () => {
    const gs = gameState()
    const q = new Quest({ name: 'Q', description: 'd' })
    expect(q.isMain()).toBe(false)
    expect(q.checkTrigger(gs)).toBe(false)
    expect(q.checkUpdate(gs)).toBe(false)
    expect(q.checkCompletion(gs)).toBe(false)
  })

  it('completes when told to', () => {
    const gs = gameState()
    const q = new Quest({ name: 'Q', description: 'd', completion: 'Done.' })
    expect(q.complete(gs)).toBe('Done.')
    expect(q.completed).toBe(true)
    expect(q.checkCompletion(gs)).toBe(true)
  })

  describe('completed flag', () => {
    /** A quest that declares the story flag its completion raises. */
    class Flagged extends Quest {
      override completedFlag(): string {
        return 'flagged_completed'
      }
    }

    it('declares no flag by default and raises none', () => {
      const gs = gameState()
      const q = new Quest({ name: 'Q', description: 'd' })
      expect(q.completedFlag()).toBeNull()
      q.complete(gs)
      expect(gs.storyFlags).toEqual({})
    })

    it('raises its declared flag when completed', () => {
      const gs = gameState()
      const q = new Flagged({ name: 'Q', description: 'd' })
      q.complete(gs)
      expect(gs.getStoryFlag('flagged_completed')).toBe(true)
    })

    it('counts as completed once its flag is raised elsewhere (older saves)', () => {
      const gs = gameState()
      const q = new Flagged({ name: 'Q', description: 'd' })
      expect(q.checkCompletion(gs)).toBe(false)
      gs.setStoryFlag('flagged_completed', true)
      expect(q.checkCompletion(gs)).toBe(true)
    })
  })

  describe('details', () => {
    /** A quest exposing the protected helpers. */
    class Logged extends Quest {
      journal(earlier: string[], latest: string): void {
        this.setJournal(earlier, latest)
      }
      list(): void {
        this.setChecklist(
          {
            intro: 'You need:',
            items: [
              { done: true, text: 'Cloak' },
              { done: false, text: 'Map' },
            ],
          },
          'You need:\n[success]Cloak[/success]\n[pending]Map[/pending]',
        )
      }
    }

    it('is a journal of the description by default', () => {
      const q = new Quest({ name: 'Q', description: ' Look around. ' })
      expect(q.details()).toEqual({
        kind: 'journal',
        latest: 'Look around.',
        earlier: [],
      })
    })

    it('keeps earlier stages and rebuilds the description with them dimmed', () => {
      const q = new Logged({ name: 'Q', description: 'd' })
      q.journal(['One.', '\nTwo.'], '\nThree.')
      expect(q.description).toBe('[dim]One.[/dim][dim]\nTwo.[/dim]\nThree.')
      expect(q.details()).toEqual({
        kind: 'journal',
        latest: 'Three.',
        earlier: ['One.', 'Two.'],
      })
    })

    it('promotes the last stage when nothing follows them', () => {
      const q = new Logged({ name: 'Q', description: 'd' })
      q.journal(['One.', 'Two.'], '')
      expect(q.details()).toEqual({
        kind: 'journal',
        latest: 'Two.',
        earlier: ['One.'],
      })
    })

    it('hints with the newest journal entry, or the checklist lead-in and its first open item', () => {
      const plain = new Quest({ name: 'Plain', description: 'Find the well.' })
      expect(plain.hint(gameState())).toBe('Find the well.')

      class Journal extends Quest {
        constructor() {
          super({ name: 'Journal', description: 'start' })
          this.setJournal(['First you went north.'], 'Now the door is shut.')
        }
      }
      expect(new Journal().hint(gameState())).toBe('Now the door is shut.')

      class List extends Quest {
        constructor() {
          super({ name: 'List', description: 'start' })
          this.setChecklist(
            {
              intro: 'Gather:',
              items: [
                { done: true, text: 'a cloak' },
                { done: false, text: 'a map' },
                { done: false, text: 'boots' },
              ],
            },
            'Gather what the road wants.',
          )
        }
      }
      expect(new List().hint(gameState())).toBe('Gather: a map')
    })

    it('reports a checklist with its done flags', () => {
      const q = new Logged({ name: 'Q', description: 'd' })
      q.list()
      expect(q.details()).toEqual({
        kind: 'checklist',
        intro: 'You need:',
        items: [
          { done: true, text: 'Cloak' },
          { done: false, text: 'Map' },
        ],
      })
      expect(q.description).toContain('[pending]Map[/pending]')
    })
  })
})
