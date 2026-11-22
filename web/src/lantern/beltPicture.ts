/**
 * Where the picture of a thing or a spell is served from: the image Content
 * Studio made for it, named by the same id as its entry in the act's image
 * list (`beltImageId`), one file for a name in every act.
 */
import { beltImageId, beltStateImageId } from './imageLists'

/**
 * The URL of the picture of the thing (`item`) or spell (`spell`) called
 * `name`, or '' for no name. The file may not exist yet (pictures are made by
 * hand after the entry is listed); the belt then keeps the first letter.
 */
export function beltPictureUrl(kind: 'item' | 'spell', name: string): string {
  if (!name) return ''
  return `${import.meta.env.BASE_URL}images/generated/${beltImageId(kind, name)}.png`
}

/**
 * The URL of the picture the thing called `name` has for its state ("lantern
 * (lit)"), or '' when the list holds none for that name. Like the base picture
 * it may not be made yet.
 */
export function beltStatePictureUrl(
  kind: 'item' | 'spell',
  name: string,
): string {
  const id = beltStateImageId(kind, name)
  return id === null
    ? ''
    : `${import.meta.env.BASE_URL}images/generated/${id}.png`
}
