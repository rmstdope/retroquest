/**
 * The picture of a thing or spell on the belt, shown only once it is known to
 * load, so the letter (or the bag sign) stands in until then and the square is
 * never blank. Nothing here is saved.
 */
import { ref, watch, type Ref } from 'vue'
import { beltPictureUrl } from '@/lantern/beltPicture'
import { pictureExists } from '@/lantern/roomPicture'

/**
 * The URL of the picture of the thing or spell `name()` of `kind()`, or null
 * while it loads, when it is not made yet and when it fails to load. It
 * follows the name and kind as they change.
 */
export function useBeltPicture(
  kind: () => 'item' | 'spell',
  name: () => string,
): Ref<string | null> {
  const url = ref<string | null>(null)
  watch(
    () => beltPictureUrl(kind(), name()),
    async (wanted) => {
      url.value = null
      if (!wanted) return
      const found = await pictureExists(wanted)
      if (found && wanted === beltPictureUrl(kind(), name())) url.value = wanted
    },
    { immediate: true },
  )
  return url
}
