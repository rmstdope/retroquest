import { describe, expect, it } from 'vitest'
import {
  emptyPicture,
  readSavedPicture,
  savedPictureOf,
  type PictureState,
  type SavePicture,
} from './pictureState'

/** A picture with something in every field. */
function filled(): PictureState {
  return {
    ...emptyPicture(),
    roomKey: 'Cottage',
    variant: 'night',
    patchIds: ['lamp'],
    patchAreas: { lamp: 'lantern' },
    things: [
      { areaId: 'lantern', label: 'lantern', name: 'lantern', kind: 'item' },
    ],
  }
}

describe('emptyPicture', () => {
  it('names no room, and is a fresh copy each time', () => {
    const first = emptyPicture()
    first.patchIds.push('lamp')
    first.patchAreas.lamp = 'lantern'
    expect(emptyPicture()).toEqual({
      roomKey: '',
      variant: '',
      patchIds: [],
      patchAreas: {},
      things: [],
    })
  })
})

describe('savedPictureOf', () => {
  it('keeps every field but the ones a loaded game reads again', () => {
    const picture = filled()
    const saved = savedPictureOf('Act1', picture)
    const readAgain = ['patchAreas', 'things']
    expect(Object.keys(saved).sort()).toEqual(
      ['actName', ...Object.keys(picture)]
        .filter((key) => !readAgain.includes(key))
        .sort(),
    )
    expect(saved).toEqual({
      actName: 'Act1',
      roomKey: 'Cottage',
      variant: 'night',
      patchIds: ['lamp'],
    })
  })
})

describe('readSavedPicture', () => {
  it('reads a field a save was made before as empty', () => {
    const old = { actName: 'Act1', roomKey: 'Cottage' } as SavePicture
    expect(readSavedPicture(old)).toEqual({
      actName: 'Act1',
      roomKey: 'Cottage',
      variant: '',
      patchIds: [],
    })
  })
})
