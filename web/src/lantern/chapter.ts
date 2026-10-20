import type { ActStats } from '@/types/bridge'

/** A full-screen chapter page: an act's intro or its completion (Lantern). */
export interface Chapter {
  kind: 'intro' | 'complete'
  /** "Act I". */
  act: string
  /** "The Call to Adventure". */
  title: string
  /** Engine markup: the intro text, or the act-complete text. */
  body: string
  /** The finished act's numbers (complete only). */
  stats?: ActStats
  /** "Act II" — the act that follows (complete only; none after the last). */
  nextAct?: string
  /** The last act's completion: its button finishes the game. */
  final?: boolean
}
