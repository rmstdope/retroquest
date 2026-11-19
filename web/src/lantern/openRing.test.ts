/** Every item that opens or is read answers the action ring's Open, so a new book cannot be forgotten. */
import { describe, expect, it } from 'vitest'
import { Item } from '@/engine'
import { ACT1_CLASSES } from '@/act1/classes'
import { ACT2_CLASSES } from '@/act2/classes'
import { ACT3_CLASSES } from '@/act3/classes'
import { ACT4_CLASSES } from '@/act4/classes'

/** The part of an item class this test reads. */
interface ItemKind {
  prototype: Item
}

/** Whether a registered class is an item class. */
function isItemKind(kind: unknown): kind is ItemKind {
  return typeof kind === 'function' && kind.prototype instanceof Item
}

/** Every registered class of every act, as the unknown values the registries hold. */
const REGISTERED: Array<[string, unknown]> = Object.entries({
  ...ACT1_CLASSES,
  ...ACT2_CLASSES,
  ...ACT3_CLASSES,
  ...ACT4_CLASSES,
})

/** Every item class of every act. */
const ITEM_CLASSES: Array<[string, ItemKind]> = REGISTERED.filter(
  (entry): entry is [string, ItemKind] => isItemKind(entry[1]),
)

describe('the action ring and Open', () => {
  it('finds the item classes', () => {
    expect(ITEM_CLASSES.length).toBeGreaterThan(50)
  })

  it.each(ITEM_CLASSES)(
    '%s answers Open on its ring when it overrides open',
    (_name, kind) => {
      if (kind.prototype.open === Item.prototype.open) return
      expect(kind.prototype.answersToOpen()).toBe(true)
    },
  )
})
