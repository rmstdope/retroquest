import { describe, it, expect } from 'vitest'
import { roomPictureUrl } from './roomPicture'
import { roomTrackId } from './musicLists'

describe('roomPictureUrl', () => {
  it("is the generated picture named by the room's image id", () => {
    expect(roomPictureUrl('Act1', 'ElioCottage')).toBe(
      `${import.meta.env.BASE_URL}images/generated/${roomTrackId('Act1', 'ElioCottage')}.png`,
    )
  })

  it('is empty while no room is known', () => {
    expect(roomPictureUrl('', '')).toBe('')
    expect(roomPictureUrl('Act1', '')).toBe('')
  })
})
