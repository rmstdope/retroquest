/** Which chosen effect clips play with which music file. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChosenManifest } from './chosenMusic'
import {
  ambientClipsFor,
  loadChosenEffects,
  trackOfTake,
} from './chosenEffects'

const music: ChosenManifest = {
  'act1-the-dream': { file: 'act1-the-dream.mp3', duration: 60 },
  market: { file: 'market.mp3', duration: 60 },
}
const effects: ChosenManifest = {
  rain: { file: 'rain.mp3', duration: 20 },
  lightning: { file: 'lightning.mp3', duration: 4.2 },
}

describe('ambientClipsFor', () => {
  it("plays The Dream's rain and lightning with The Dream's chosen take", () => {
    expect(
      ambientClipsFor('generated/act1-the-dream.mp3', music, effects),
    ).toEqual([
      {
        id: 'rain',
        url: '/audio/soundeffects/generated/rain.mp3',
        loops: true,
      },
      {
        id: 'lightning',
        url: '/audio/soundeffects/generated/lightning.mp3',
        loops: false,
        everySeconds: [3, 8],
      },
    ])
  })

  it('leaves out an effect with no chosen take', () => {
    expect(
      ambientClipsFor('generated/act1-the-dream.mp3', music, {
        rain: effects.rain,
      }),
    ).toEqual([
      {
        id: 'rain',
        url: '/audio/soundeffects/generated/rain.mp3',
        loops: true,
      },
    ])
  })

  it('plays nothing with a track that has no effects', () => {
    expect(ambientClipsFor('generated/market.mp3', music, effects)).toEqual([])
  })

  it("plays nothing with the game's own files, where no take was chosen", () => {
    expect(
      ambientClipsFor('Conquest - Market (freetouse.com).mp3', music, effects),
    ).toEqual([])
  })
})

describe('trackOfTake', () => {
  it('names the track whose chosen take a music file is', () => {
    expect(trackOfTake('generated/act1-the-dream.mp3', music)).toBe(
      'act1-the-dream',
    )
  })

  it("is null for the game's own files", () => {
    expect(trackOfTake('Conquest - Market (freetouse.com).mp3', music)).toBe(
      null,
    )
  })
})

describe('loadChosenEffects', () => {
  afterEach(() => vi.unstubAllGlobals())

  it("reads the effects' manifest", async () => {
    const fetched = vi.fn((_url: string) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(effects) }),
    )
    vi.stubGlobal('fetch', fetched)
    expect(await loadChosenEffects()).toEqual(effects)
    expect(fetched.mock.calls[0][0]).toBe(
      '/audio/soundeffects/generated/manifest.json',
    )
  })

  it('takes a manifest that cannot be read as none', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    )
    expect(await loadChosenEffects()).toEqual({})
  })
})
