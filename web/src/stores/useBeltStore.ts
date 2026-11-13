import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { BeltList, Hand } from '@/lantern/belt'
import { appStorage } from '@/storage/appStorage'

/**
 * The belt of pictures's own state: which list it shows (Bag or Spells),
 * whether it is put away, and the thing or spell taken in hand. The first two
 * are remembered on this device in the browser's storage (`appStorage`) like the theme and the text
 * size, each validated on load, and are not part of a save; unavailable or
 * corrupt storage just means the defaults for this visit. The hand is never
 * stored: the layout empties it whenever the game moves on.
 */
export const BELT_STORAGE_KEY = 'retroquest_belt'

/** Read the remembered belt, falling back per field to the default. */
function load(): { away: boolean; list: BeltList } {
  const fallback = { away: false, list: 'bag' as BeltList }
  try {
    const parsed: unknown = JSON.parse(
      appStorage.getItem(BELT_STORAGE_KEY) ?? '{}',
    )
    if (!parsed || typeof parsed !== 'object') return fallback
    const stored = parsed as Record<string, unknown>
    return {
      away: typeof stored.away === 'boolean' ? stored.away : fallback.away,
      list:
        stored.list === 'bag' || stored.list === 'spells'
          ? stored.list
          : fallback.list,
    }
  } catch {
    return fallback
  }
}

/** The belt's list, whether it is away, and the hand. */
export const useBeltStore = defineStore('belt', () => {
  const initial = load()
  const away = ref(initial.away)
  const list = ref<BeltList>(initial.list)
  const hand = ref<Hand | null>(null)

  watch([away, list], () => {
    try {
      appStorage.setItem(
        BELT_STORAGE_KEY,
        JSON.stringify({ away: away.value, list: list.value }),
      )
    } catch {
      // Storage that cannot be written: the choice holds for this visit only.
    }
  })

  /** Show `which` list on the belt. */
  function show(which: BeltList): void {
    list.value = which
  }
  /** Put the belt away; the two tiny buttons stay. */
  function putAway(): void {
    away.value = true
  }
  /** Bring the belt back, on `which` list when one is named. */
  function bringBack(which?: BeltList): void {
    away.value = false
    if (which) list.value = which
  }
  /** Take a thing or spell in hand for the next press. */
  function takeInHand(next: Hand): void {
    hand.value = next
  }
  /** Put whatever is in hand down; nothing is sent. */
  function emptyHand(): void {
    hand.value = null
  }

  return { away, list, hand, show, putAway, bringBack, takeInHand, emptyHand }
})
