// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref, type VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useReadAlong } from './useReadAlong'
import {
  ARRIVAL_PAUSE_MS,
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

  /** A surface narrated under `id`, drawing `content` with the read-along. */
  function mountReader(
    id = 7,
    content: (along: ReturnType<typeof useReadAlong>) => VNode[] = (along) => [
      along.shown(0)
        ? h('p', {
            class: along.isSpeaking(0) ? 'lq-speaking' : '',
            'data-unit': 0,
            innerHTML: along.html(TEXT, 0),
          })
        : h('i'),
    ],
  ) {
    const reader = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        const along = useReadAlong(() => id, root)
        return () => h('div', { ref: root }, content(along))
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

  it('numbers a unit’s words across its parts, so a heading and its text light in turn', async () => {
    const narration = useNarrationStore()
    const clipOf = (markup: string) => ({
      file: 'a.mp3',
      speaker: 'narrator',
      duration: 3,
      words: narrationWords(markup).map((word, i) => ({
        word,
        start: i,
        end: i + 1,
      })),
    })
    const manifest = {
      [narrationKey('narrator', 'Cellar')]: clipOf('Cellar'),
      [narrationKey('narrator', TEXT)]: clipOf(TEXT),
    }
    const w = mountReader(8, (along) => [
      h('h3', { innerHTML: along.html('Cellar', 0, 0, 1) }),
      h('p', { innerHTML: along.html(TEXT, 0, 1) }),
    ])
    narration.begin(
      8,
      turnUnits(
        { text: '', arrival: { room: 'Cellar', description: TEXT } },
        true,
        manifest,
      ),
      'act1',
    )
    // A room is read after a pause.
    await new Promise((r) => setTimeout(r, ARRIVAL_PAUSE_MS + 50))
    await nextTick()
    expect(w.find('h3 .lq-w').attributes('data-w')).toBe('0')
    expect(w.findAll('p .lq-w').map((s) => s.attributes('data-w'))).toEqual([
      '1',
      '2',
      '3',
    ])
    audio.onended?.()
    await new Promise((r) => setTimeout(r, 1200))
    audio.currentTime = 1.2
    await new Promise((r) => setTimeout(r, 120))
    await nextTick()
    expect(w.find('.lq-w-now').text()).toBe('two')
  })
})
