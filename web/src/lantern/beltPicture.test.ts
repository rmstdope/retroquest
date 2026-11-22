/** Where a thing's or a spell's picture is served from. */
import { describe, expect, it } from 'vitest'
import { beltPictureUrl, beltStatePictureUrl } from './beltPicture'

describe('beltPictureUrl', () => {
  it('points at the file named by the picture id', () => {
    expect(beltPictureUrl('item', "mother's letter")).toBe(
      `${import.meta.env.BASE_URL}images/generated/item-mothers-letter.png`,
    )
    expect(beltPictureUrl('spell', 'light')).toMatch(
      /images\/generated\/spell-light\.png$/,
    )
  })

  it('has none for a name that is empty', () => {
    expect(beltPictureUrl('item', '')).toBe('')
  })
})

describe('beltStatePictureUrl', () => {
  it('points at the picture of the state a name is in', () => {
    expect(beltStatePictureUrl('item', 'lantern (lit)')).toMatch(
      /images\/generated\/item-lantern-lit\.png$/,
    )
    expect(beltStatePictureUrl('item', 'bucket (full)')).toMatch(
      /images\/generated\/item-bucket-full\.png$/,
    )
  })

  it('has none for a name with no state picture', () => {
    expect(beltStatePictureUrl('item', 'lantern')).toBe('')
    expect(beltStatePictureUrl('item', 'horseshoe')).toBe('')
  })
})
