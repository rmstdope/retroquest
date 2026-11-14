/** Where a thing's or a spell's picture is served from. */
import { describe, expect, it } from 'vitest'
import { beltPictureUrl } from './beltPicture'

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
