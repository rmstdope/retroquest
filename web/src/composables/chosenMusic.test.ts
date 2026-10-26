import { describe, expect, it } from 'vitest'
import { chooseTrack, trackIdsAt, type ChosenManifest } from './chosenMusic'

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
