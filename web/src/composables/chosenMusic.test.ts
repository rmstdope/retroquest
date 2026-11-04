import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACT_FILE,
  chooseTrack,
  loadChosenManifest,
  sceneMusic,
  trackIdsAt,
  type ChosenManifest,
} from './chosenMusic'

const manifest: ChosenManifest = {
  market: { file: 'market.mp3', duration: 90 },
  'act1-village-square': { file: 'square.mp3', duration: 60 },
}

describe('trackIdsAt', () => {
  it("lists the room's track before the act's loop", () => {
    expect(
      trackIdsAt(
        { actName: 'Act1', roomKey: 'VillageSquare' },
        'Conquest - Market (freetouse.com).mp3',
      ),
    ).toEqual(['act1-village-square', 'market'])
  })

  it('lists nothing where no music plays', () => {
    expect(trackIdsAt({ actName: '', roomKey: '' }, '')).toEqual([])
  })
})

describe('trackIdsAt without a room', () => {
  it("lists only the act's loop", () => {
    expect(
      trackIdsAt(
        { actName: 'Act1', roomKey: '' },
        'Conquest - Market (freetouse.com).mp3',
      ),
    ).toEqual(['market'])
  })
})

describe('loadChosenManifest', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reads the manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(manifest) }),
      ),
    )
    expect(await loadChosenManifest()).toEqual(manifest)
  })

  it('takes a manifest that is not an object as none', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(null) }),
      ),
    )
    expect(await loadChosenManifest()).toEqual({})
  })

  it('takes a failing fetch as none', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    )
    expect(await loadChosenManifest()).toEqual({})
  })
})

describe('chooseTrack', () => {
  it("prefers the room's take to the act's", () => {
    expect(chooseTrack(manifest, ['act1-village-square', 'market'])).toEqual({
      file: 'square.mp3',
      duration: 60,
    })
  })

  it("falls back to the act's take for a room with none", () => {
    expect(chooseTrack(manifest, ['act1-forest-path', 'market'])?.file).toBe(
      'market.mp3',
    )
  })

  it('chooses nothing when no take was made', () => {
    expect(chooseTrack({}, ['act1-forest-path', 'market'])).toBeNull()
  })
})

describe('sceneMusic', () => {
  const square = { actName: 'Act1', roomKey: 'VillageSquare' }
  const shed = { actName: 'Act1', roomKey: 'AbandonedShed' }
  const actFile = 'Conquest - Market (freetouse.com).mp3'

  it("plays what the game chooses at 1 where the mix gives no music: the room's take, the act loop's, the act's file", () => {
    expect(sceneMusic(square, actFile, manifest, undefined)).toEqual({
      music: manifest['act1-village-square'],
      level: 1,
    })
    expect(sceneMusic(shed, actFile, manifest, { effects: [] })).toEqual({
      music: manifest.market,
      level: 1,
    })
    expect(sceneMusic(shed, actFile, {}, undefined)).toEqual({
      music: ACT_FILE,
      level: 1,
    })
  })

  it('plays the track the mix names at its level', () => {
    expect(
      sceneMusic(shed, actFile, manifest, {
        music: { track: 'act1-village-square', level: 2.5 },
        effects: [],
      }),
    ).toEqual({ music: manifest['act1-village-square'], level: 2.5 })
  })

  it("plays the act's own file at the mix's level for the act loop with no take", () => {
    expect(
      sceneMusic(
        shed,
        actFile,
        {},
        {
          music: { track: 'market', level: 0.8 },
          effects: [],
        },
      ),
    ).toEqual({ music: ACT_FILE, level: 0.8 })
  })

  it('plays no music for no track, or for a track with no chosen take', () => {
    expect(
      sceneMusic(square, actFile, manifest, {
        music: { track: null, level: 1 },
        effects: [],
      }),
    ).toEqual({ music: null, level: 1 })
    expect(
      sceneMusic(square, actFile, manifest, {
        music: { track: 'act1-the-dream', level: 0.5 },
        effects: [],
      }),
    ).toEqual({ music: null, level: 0.5 })
  })
})
