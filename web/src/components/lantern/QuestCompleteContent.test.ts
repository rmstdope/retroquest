// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuestCompleteContent from './QuestCompleteContent.vue'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import { POPUP_NARRATION_ID, questPopUpUnits } from '@/lantern/narrationUnits'

describe('QuestCompleteContent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const news = {
    kind: 'completed' as const,
    name: 'Hint of Magic',
    main: false,
    text: 'Your [item_name]journey[/item_name] has begun.',
    progress: { completed: 5, total: 11 },
  }

  it('shows the completion text (its title is in the dialog header)', () => {
    const w = mount(QuestCompleteContent, { props: { news } })

    expect(w.get('.lq-complete-text .theme-item_name').text()).toBe('journey')
    expect(w.find('h2').exists()).toBe(false)
    expect(w.get('.lq-seal').attributes('aria-hidden')).toBe('true')
  })

  it('shows how many quests of the act are done', () => {
    const w = mount(QuestCompleteContent, { props: { news } })

    const bar = w.get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('5')
    expect(bar.attributes('aria-valuemax')).toBe('11')
    expect(bar.attributes('aria-label')).toBe('Quests completed')
    expect(w.get('.lq-complete-count').text()).toBe('5 of 11 quests')
  })

  describe('narrated', () => {
    const text = 'Your journey has begun.'
    const manifest = {
      [narrationKey('narrator', text)]: {
        file: 'a.mp3',
        speaker: 'narrator',
        duration: 3,
        words: narrationWords(text).map((word, i) => ({
          word,
          start: i,
          end: i + 1,
        })),
      },
    }
    let audio: NarrationAudio

    beforeEach(() => {
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

    function start() {
      const w = mount(QuestCompleteContent, {
        props: { news: { ...news, text } },
      })
      useNarrationStore().begin(
        POPUP_NARRATION_ID,
        questPopUpUnits(text, manifest),
        'act1',
      )
      return w
    }

    it('marks the text and lights the spoken word while it is read', async () => {
      const w = start()
      await nextTick()
      expect(w.get('.lq-complete-text').classes()).toContain('lq-speaking')
      audio.currentTime = 1.5
      await new Promise((r) => setTimeout(r, 120))
      await nextTick()
      expect(w.get('.lq-w-now').text()).toBe('journey')
    })

    it('hurries and skips on taps of the text, and keeps the progress visible', async () => {
      const w = start()
      await nextTick()
      await w.get('.lq-complete-text').trigger('click')
      expect(useNarrationStore().isNarrating).toBe(false)
      expect(w.find('.lq-complete-count').exists()).toBe(true)
      expect(w.get('.lq-complete-text').text()).toBe(text)
    })
  })
})
