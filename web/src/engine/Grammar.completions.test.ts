import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import type { Act } from './Act'
import type { CompletionTree } from './Game'
import { Game } from './Game'
import { DIRECTIONS, SHORT_DIRECTIONS, VERB_FORMS } from './Grammar'

/** Whether the words lead somewhere in the tree, one word at a time. */
function offers(tree: CompletionTree, words: string[]): boolean {
  let node: CompletionTree | null = tree
  for (const word of words) {
    if (node === null || !Object.hasOwn(node, word)) return false
    node = node[word]
  }
  return true
}

const ACTS: [string, () => Act][] = [
  ['Act 1', () => new Act1()],
  ['Act 2', () => new Act2()],
  ['Act 3', () => new Act3()],
  ['Act 4', () => new Act4()],
]

describe('the suggestion list holds everything the parser accepts', () => {
  it('offers every verb of the grammar, and every direction letter', () => {
    const tree = new Game([new Act1()]).getCommandCompletions()
    for (const form of VERB_FORMS) {
      for (const verb of form.verbs) {
        expect(offers(tree, verb.split(' ')), verb).toBe(true)
      }
    }
    for (const letter of Object.keys(SHORT_DIRECTIONS)) {
      expect(offers(tree, [letter]), letter).toBe(true)
    }
    expect(DIRECTIONS).toContain('up')
  })

  it('offers only verbs the grammar declares', () => {
    const tree = new Game([new Act1()]).getCommandCompletions()
    const declared = new Set(
      VERB_FORMS.flatMap((form) => form.verbs.map((v) => v.split(' ')[0])),
    )
    for (const letter of Object.keys(SHORT_DIRECTIONS)) declared.add(letter)
    for (const direction of DIRECTIONS) declared.add(direction)
    for (const word of Object.keys(tree)) {
      expect(declared.has(word), word).toBe(true)
    }
  })

  describe.each(ACTS)('%s names', (_name, make) => {
    it('offers every name a thing here answers to, after the verbs that take it', () => {
      const game = new Game([make()])
      const missing: string[] = []
      for (const room of Object.values(game.state.allRooms)) {
        game.state.currentRoom = room
        const tree = game.getCommandCompletions()
        for (const item of room.items) {
          for (const name of item.allNames()) {
            if (!item.answersTo(name)) missing.push(`answersTo ${name}`)
            for (const verb of ['take', 'examine', 'use']) {
              if (!offers(tree, [verb, ...name.split(' ')]))
                missing.push(`${verb} ${name}`)
            }
          }
        }
        for (const character of room.characters) {
          for (const name of character.allNames()) {
            if (!character.answersTo(name)) missing.push(`answersTo ${name}`)
            for (const verb of ['talk to', 'examine']) {
              if (!offers(tree, [...verb.split(' '), ...name.split(' ')]))
                missing.push(`${verb} ${name}`)
            }
          }
        }
      }
      expect(missing).toEqual([])
    })
  })
})
