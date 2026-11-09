/**
 * The pointer over an open way out in the picture: a lantern-coloured arrow
 * aimed that way. North, east, south and west aim that way; up and down carry
 * their sign (an arrow to a bar, ⤒ and ⤓) and any other named way a dot (•),
 * the same signs `exitArrow` gives their names. Drawn as small SVG pictures,
 * so no font is needed.
 */

/** The 32 × 32 picture of each cursor: the lantern amber with a dark edge. */
const ARROW = 'M16 4 L26 18 H19 V28 H13 V18 H6 Z'
const PICTURES: Readonly<Record<string, string>> = {
  north: `<path d="${ARROW}"/>`,
  south: `<path d="${ARROW}" transform="rotate(180 16 16)"/>`,
  east: `<path d="${ARROW}" transform="rotate(90 16 16)"/>`,
  west: `<path d="${ARROW}" transform="rotate(-90 16 16)"/>`,
  up: `<path d="${ARROW}" transform="translate(0 3) scale(1 .85)"/><rect x="6" y="2" width="20" height="4"/>`,
  down: `<path d="${ARROW}" transform="rotate(180 16 16) translate(0 3) scale(1 .85)"/><rect x="6" y="26" width="20" height="4"/>`,
}
const DOT = '<circle cx="16" cy="16" r="8"/>'

/** The CSS `cursor` value for an open way in `direction`. */
export function wayCursor(direction: string): string {
  const picture = Object.hasOwn(PICTURES, direction) ? PICTURES[direction] : DOT
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
    `<g fill="#ffc14d" stroke="#3b2400" stroke-width="2" stroke-linejoin="round">${picture}</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, pointer`
}
