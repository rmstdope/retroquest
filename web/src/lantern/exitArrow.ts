const ARROWS: Readonly<Record<string, string>> = {
  north: '↑',
  south: '↓',
  east: '→',
  west: '←',
  up: '⤒',
  down: '⤓',
}

/** Arrow shown for an exit direction; other exits (e.g. secret_passage) get a dot. */
export function exitArrow(direction: string): string {
  return ARROWS[direction] ?? '•'
}
