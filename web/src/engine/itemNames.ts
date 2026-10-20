import type { Item } from './Item'

/**
 * The one rule for which item a story name refers to: the item's full name or
 * the short name the story uses, compared case-insensitively. Every engine
 * lookup (the parser's verbs, the inventory helpers, a room's items and the
 * UI's name menu) goes through this predicate.
 */
export function isNamed(item: Item, name: string): boolean {
  const wanted = name.toLowerCase()
  return (
    item.name.toLowerCase() === wanted ||
    item.shortName.toLowerCase() === wanted
  )
}
