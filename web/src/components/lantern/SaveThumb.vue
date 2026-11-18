<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { continuePictureUrls } from '@/lantern/saveCard'
import { pictureExists } from '@/lantern/roomPicture'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { SaveSlot } from '@/types/bridge'

/**
 * A save's snapshot: a small picture of the room as the player left it (its
 * painting, or its other picture, and the patches drawn over it), as on the
 * title page's Continue card and on the cards of Save and Load. It shows
 * nothing until the picture is known to load, and nothing at all for a save
 * that kept no picture or whose picture has not been made; the room's other
 * picture falls back to its plain one, without the other one's patches, as on
 * the stage. It fades in as it arrives (at once under Reduce motion) and is
 * hidden from a screen reader: the card around it names the save. The class
 * it is given sets its size.
 */
defineOptions({ inheritAttrs: false })
const props = defineProps<{ save: SaveSlot }>()
const reduced = useReducedMotion()

/** The files the save's picture is made of, as one key: a card rebuilt for the same save keeps its picture. */
const files = computed(() => JSON.stringify(continuePictureUrls(props.save)))
/** The picture and the patches over it once the picture is known to load; null until then, and for good when there is none. */
const thumb = ref<{ base: string; patches: string[] } | null>(null)
watch(
  files,
  async (key) => {
    thumb.value = null
    const urls = continuePictureUrls(props.save)
    if (!urls) return
    let base = ''
    let first = false
    for (const [index, url] of urls.base.entries()) {
      if (await pictureExists(url)) {
        base = url
        first = index === 0
        break
      }
    }
    if (!base || files.value !== key) return
    // The patches belong to the picture they were made for, as on the stage:
    // none over the plain picture that stands in for an unmade other one.
    const found = first
      ? await Promise.all(
          urls.patches.map(async (url) =>
            (await pictureExists(url)) ? url : '',
          ),
        )
      : []
    if (files.value !== key) return
    thumb.value = { base, patches: found.filter(Boolean) }
  },
  { immediate: true },
)
</script>

<template>
  <span
    v-if="thumb"
    v-bind="$attrs"
    class="lq-save-thumb"
    :class="{ 'is-still': reduced }"
    aria-hidden="true"
  >
    <img :src="thumb.base" alt="" />
    <img v-for="url in thumb.patches" :key="url" :src="url" alt="" />
  </span>
</template>

<style scoped>
.lq-save-thumb {
  flex: none;
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 9px;
  animation: lq-save-thumb-in 0.25s ease-out;
}
.lq-save-thumb img {
  position: absolute;
  object-fit: cover;
  inset: 0;
  width: 100%;
  height: 100%;
}
.lq-save-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.18);
}
@keyframes lq-save-thumb-in {
  from {
    opacity: 0;
  }
}
.lq-save-thumb.is-still {
  animation: none;
}
</style>
