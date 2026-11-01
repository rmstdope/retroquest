/**
 * The height of the narration paper: its content plus what surrounds the
 * content (`chrome`), but at most half the play area (`area`).
 */
export function paperHeight(
  content: number,
  chrome: number,
  area: number,
): number {
  return Math.min(content + chrome, Math.floor(area / 2))
}
