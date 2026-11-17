import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { DEFAULT_TITLE_ZOOM } from '@/lantern/roomMotion'
import { useGameStore } from './useGameStore'

describe("useGameStore: the title picture's movement", () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is a zoom only until the team has saved settings for the title', () => {
    const store = useGameStore()
    expect(store.titleMotion).toEqual([])
    expect(store.titleZoom).toEqual(DEFAULT_TITLE_ZOOM)
    store.imageManifest = { 'title-screen': { width: 1920, height: 1080 } }
    expect(store.titleMotion).toEqual([])
    expect(store.titleZoom).toEqual(DEFAULT_TITLE_ZOOM)
  })

  it('plays the saved zoom and effects, a spot with the shape that was drawn', () => {
    const store = useGameStore()
    const points = [
      { x: 0.2, y: 0.7 },
      { x: 0.8, y: 0.7 },
      { x: 0.8, y: 0.95 },
    ]
    store.imageManifest = {
      'title-screen': {
        width: 2000,
        height: 1000,
        zoom: { seconds: 12, percent: 4 },
        effects: [
          { type: 'stars', spot: { points: points } },
          { type: 'dust' },
        ],
      },
    }
    expect(store.titleZoom).toEqual({ seconds: 12, percent: 4 })
    expect(store.titleMotion.map((m) => m.kind)).toEqual(['stars', 'dust'])
    expect(store.titlePictureSize).toEqual({ width: 2000, height: 1000 })
  })

  it('has no zoom when the team saved it off', () => {
    const store = useGameStore()
    store.imageManifest = { 'title-screen': { zoom: null } }
    expect(store.titleZoom).toBeNull()
  })
})
