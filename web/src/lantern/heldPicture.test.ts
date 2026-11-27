import { describe, expect, it } from 'vitest'
import { withHeldAreas } from './heldPicture'
import { emptyPicture, type PictureState } from './pictureState'

/** A picture state of one room with the given things (all items) and patches. */
function picture(
  things: string[],
  patchAreas: Record<string, string>,
  room = 'Cottage',
): PictureState {
  return {
    ...emptyPicture(),
    roomKey: room,
    patchIds: Object.keys(patchAreas),
    patchAreas,
    things: things.map((id) => ({
      areaId: id,
      label: id,
      name: id,
      kind: 'item' as const,
    })),
  }
}

describe('withHeldAreas', () => {
  const before = picture(['bread', 'lamp'], { 'lamp-lit': 'lamp' })
  const after = picture(['lamp'], {
    'lamp-lit': 'lamp',
    'bread-taken': 'bread',
  })

  it('is the latest picture when nothing is held', () => {
    expect(withHeldAreas(after, before, [])).toEqual(after)
  })

  it('keeps a held thing in the picture and its taken patch off', () => {
    const shown = withHeldAreas(after, before, ['bread'])
    expect(shown.things.map((t) => t.areaId).sort()).toEqual(['bread', 'lamp'])
    expect(shown.patchIds).toEqual(['lamp-lit'])
  })

  it('lets every other change through', () => {
    const shown = withHeldAreas(after, before, ['bread'])
    expect(shown.patchIds).toContain('lamp-lit')
  })

  it('puts back a held area whose patch went away', () => {
    const had = picture(['bread'], { 'bread-there': 'bread' })
    const now = picture([], {})
    const shown = withHeldAreas(now, had, ['bread'])
    expect(shown.patchIds).toEqual(['bread-there'])
    expect(shown.things).toHaveLength(1)
  })

  it('is the latest picture in another room or picture', () => {
    const moved = picture([], {}, 'Garden')
    expect(withHeldAreas(moved, before, ['bread'])).toEqual(moved)
    const other = { ...after, variant: 'lit' }
    expect(withHeldAreas(other, before, ['bread'])).toEqual(other)
  })
})
