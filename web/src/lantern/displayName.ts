/**
 * Display form of an engine name: the engine tags many names in lowercase
 * ("innkeeper marcus") and spells by id ("greater_heal"). Shown as
 * "Innkeeper Marcus" / "Greater Heal" (user decision, step 8–9 reviews).
 */
export function displayName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-'),
    )
    .join(' ')
}
