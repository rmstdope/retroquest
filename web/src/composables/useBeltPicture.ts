/**
 * The picture of a thing or spell on the belt, shown only once it is known to
 * load, so the letter (or the bag sign) stands in until then and the square is
 * never blank. Nothing here is saved.
 */
import { ref, watch, type Ref } from 'vue'
import { beltPictureUrl, beltStatePictureUrl } from '@/lantern/beltPicture'
import { pictureExists } from '@/lantern/roomPicture'

/**
 * The URL of the picture of the thing or spell `name()` of `kind()`, or null
 * while it loads, when it is not made yet and when it fails to load. A thing in
 * a state that has a picture of its own ("lantern (lit)") shows that picture
 * once it is made and its base picture until then. It follows the name and kind
 * as they change; a change of state keeps the old picture until the new one is
 * known, so the face never blanks between the two.
 */
export function useBeltPicture(
  kind: () => 'item' | 'spell',
  name: () => string,
): Ref<string | null> {
  const url = ref<string | null>(null)
  /** The two pictures the thing may show now: its state's, then its own. */
  const wantedNow = (): readonly [string, string] => [
    beltStatePictureUrl(kind(), name()),
    beltPictureUrl(kind(), name()),
  ]
  let shownBase = ''
  watch(
    () => wantedNow().join('|'),
    async () => {
      const [state, base] = wantedNow()
      if (base !== shownBase) url.value = null
      shownBase = base
      if (!base) return
      const found =
        state && (await pictureExists(state))
          ? state
          : (await pictureExists(base))
            ? base
            : null
      const [stateNow, baseNow] = wantedNow()
      if (stateNow === state && baseNow === base) url.value = found
    },
    { immediate: true },
  )
  return url
}
