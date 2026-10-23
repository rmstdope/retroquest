// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useReadAlong } from './useReadAlong'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import { turnUnits } from '@/lantern/narrationUnits'

const TEXT = 'One two three.'

describe('useReadAlong', () => {
  let audio: NarrationAudio

  beforeEach(() => {
    setActivePinia(createPinia())
    useNarrationStore().setAudioFactory(() => {
      audio = {
        play: () => Promise.resolve(),
        pause: () => undefined,
        volume: 1,
        currentTime: 0,
        onended: null,
        onerror: null,
      }
      return audio
    })
  })

  function mountReader() {
    const reader = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        const along = useReadAlong(() => 7, root)
        return () =>
          h('div', { ref: root }, [
            along.shown(0)
              ? h('p', {
                  class: along.isSpeaking(0) ? 'lq-speaking' : '',
                  'data-unit': 0,
                  innerHTML: along.html(TEXT, 0),
                })
              : null,
          ])
      },
    })
    return mount(reader)
  }

  it('shows a unit only when it is revealed and marks it while spoken', async () => {
    const narration = useNarrationStore()
    const manifest = {
      [narrationKey('narrator', TEXT)]: {
        file: 'a.mp3',
        speaker: 'narrator',
        duration: 3,
        words: narrationWords(TEXT).map((word, i) => ({
          word,
          start: i,
          end: i + 1,
        })),
      },
    }
    const w = mountReader()
    expect(w.find('p').exists()).toBe(true)
    narration.begin(
      7,
      turnUnits({ text: TEXT, arrival: null }, false, manifest),
      'act1',
    )
    await nextTick()
    expect(w.find('p.lq-speaking').exists()).toBe(true)
    expect(w.findAll('.lq-w')).toHaveLength(3)
    audio.currentTime = 1.2
    await new Promise((r) => setTimeout(r, 120))
    await nextTick()
    expect(w.find('.lq-w-now').text()).toBe('two')
    narration.skipAll()
    await nextTick()
    expect(w.find('.lq-speaking').exists()).toBe(false)
    expect(w.findAll('.lq-w')).toHaveLength(0)
  })
})
