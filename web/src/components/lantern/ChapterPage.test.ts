// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { SCENE_PAUSE_MS } from '@/lantern/narrationUnits'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import { POPUP_NARRATION_ID, chapterUnits } from '@/lantern/narrationUnits'
import ChapterPage from './ChapterPage.vue'
import type { Chapter } from '@/lantern/chapter'

const INTRO: Chapter = {
  kind: 'intro',
  act: 'Act I',
  title: 'The Call to Adventure',
  body: 'You are [character_name]Elior[/character_name].',
}

const COMPLETE: Chapter = {
  kind: 'complete',
  act: 'Act I',
  title: 'The Call to Adventure',
  body: 'Congratulations — you have completed Act 1!',
  stats: { questsCompleted: 10, questsTotal: 11, spells: 4, places: 15 },
  nextAct: 'Act II',
}

describe('ChapterPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
  })

  it('opens an act with its title, text and Begin', async () => {
    const w = mount(ChapterPage, { props: { chapter: INTRO, titleId: 't' } })

    expect(w.get('.lq-chapter-kicker').text()).toBe('Act I')
    expect(w.get('h2').text()).toBe('The Call to Adventure')
    expect(w.get('h2').attributes('id')).toBe('t')
    expect(w.get('.lq-chapter-body .theme-character_name').text()).toBe('Elior')
    await w.get('button').trigger('click')
    expect(w.get('button').text()).toBe('Begin')
    expect(w.emitted('continue')).toHaveLength(1)
  })

  it('closes an act with its numbers and the way on', () => {
    const w = mount(ChapterPage, { props: { chapter: COMPLETE, titleId: 't' } })

    expect(w.get('.lq-chapter-kicker').text()).toBe('Act I complete')
    const stats = w.findAll('.lq-stat').map((s) => s.text())
    expect(stats).toEqual([
      '10 / 11Quests completed',
      '4Spells known',
      '15Places visited',
    ])
    expect(w.get('button').text()).toBe('Continue to Act II')
  })

  it('ends the game without a next act', () => {
    const w = mount(ChapterPage, {
      props: { chapter: { ...COMPLETE, nextAct: undefined }, titleId: 't' },
    })

    expect(w.get('button').text()).toBe('Continue')
  })

  it('finishes the game from the last act', async () => {
    const w = mount(ChapterPage, {
      props: {
        chapter: { ...COMPLETE, nextAct: undefined, final: true },
        titleId: 't',
      },
    })

    expect(w.get('.lq-chapter-kicker').text()).toBe('Act I complete')
    expect(w.get('button').text()).toBe('Finish the game')
    await w.get('button').trigger('click')
    expect(w.emitted('continue')).toHaveLength(1)
  })

  it('can put focus on its button', () => {
    const w = mount(ChapterPage, {
      props: { chapter: INTRO, titleId: 't' },
      attachTo: document.body,
    })

    ;(w.vm as unknown as { focus: () => void }).focus()

    expect(document.activeElement).toBe(w.get('button').element)
    w.unmount()
  })

  it('keeps the page at its title when focusing the button', () => {
    const w = mount(ChapterPage, { props: { chapter: INTRO, titleId: 't' } })
    const focus = vi.spyOn(w.get('button').element, 'focus')

    ;(w.vm as unknown as { focus: () => void }).focus()

    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('keeps speakers, quotes, events and checklists in the body', () => {
    const body =
      'Farewells.\n[character_name]Mira[/character_name]\n' +
      '[dialogue]Go well.[/dialogue]\n[event]A bell.[/event]\n' +
      '[failure]No.[/failure]\n* [success]Done[/success]\n* [pending]Not yet[/pending]'
    const w = mount(ChapterPage, {
      props: { chapter: { ...INTRO, body }, titleId: 't' },
    })

    expect(w.get('.lq-chapter-speaker').text()).toBe('Mira')
    expect(w.get('.lq-chapter-body .theme-dialogue').text()).toBe('Go well.')
    expect(w.find('.lq-chapter-body .theme-event').exists()).toBe(true)
    expect(w.find('.lq-chapter-body .theme-failure').exists()).toBe(true)
    expect(w.get('.lq-chapter-body').text()).toContain('Done')
    expect(w.get('.lq-chapter-body').text()).toContain('Not yet')
  })

  describe('narrated', () => {
    const chapter: Chapter = {
      kind: 'intro',
      act: 'Act I',
      title: 'The Call',
      body: 'The wind rises.\n[event]Help.[/event]\nA door opens.',
    }
    const manifest: Record<string, unknown> = {}
    for (const text of ['Act I: The Call', 'The wind rises.', 'A door opens.'])
      manifest[narrationKey('narrator', text)] = {
        file: `${text.length}.mp3`,
        speaker: 'narrator',
        duration: 3,
        words: narrationWords(text).map((word, i) => ({
          word,
          start: i,
          end: i + 1,
        })),
      }
    const audios: NarrationAudio[] = []

    beforeEach(() => {
      audios.length = 0
      useNarrationStore().setAudioFactory(() => {
        const audio: NarrationAudio = {
          play: () => Promise.resolve(),
          pause: vi.fn(),
          volume: 1,
          currentTime: 0,
          onended: null,
          onerror: null,
        }
        audios.push(audio)
        return audio
      })
    })

    function start() {
      const w = mount(ChapterPage, { props: { chapter, titleId: 't' } })
      useNarrationStore().begin(
        POPUP_NARRATION_ID,
        chapterUnits(chapter, manifest as never),
        'act1',
      )
      return w
    }

    it('reads the title first, then after a breath shows each paragraph as it is spoken', async () => {
      const w = start()
      await nextTick()
      expect(w.get('h2').classes()).toContain('lq-speaking')
      expect(w.findAll('.lq-chapter-block')).toHaveLength(0)
      audios[0].onended?.()
      await new Promise((r) => setTimeout(r, 400))
      await nextTick()
      expect(w.findAll('.lq-chapter-block')).toHaveLength(0)
      await new Promise((r) => setTimeout(r, SCENE_PAUSE_MS))
      await nextTick()
      expect(w.findAll('.lq-chapter-block').map((b) => b.text())).toEqual([
        'The wind rises.',
      ])
      expect(w.get('.lq-chapter-block').classes()).toContain('lq-speaking')
      expect(w.find('.lq-w').exists()).toBe(true)
    })

    it('shows a line with no recording at once and keeps the button visible throughout', async () => {
      const w = start()
      await nextTick()
      expect(w.get('button').isVisible()).toBe(true)
      useNarrationStore().skipAll()
      await nextTick()
      expect(w.findAll('.lq-chapter-block')).toHaveLength(3)
    })

    it('hurries on a tap of the title too', async () => {
      const w = start()
      await nextTick()
      await w.get('h2').trigger('click')
      await w.get('h2').trigger('click')
      expect(useNarrationStore().isNarrating).toBe(false)
    })

    it('hurries on a tap of the text and skips on a second tap, not on the button', async () => {
      const w = start()
      await nextTick()
      await w.get('button').trigger('click')
      expect(useNarrationStore().isNarrating).toBe(true)
      await w.get('.lq-chapter-body').trigger('click')
      await w.get('.lq-chapter-body').trigger('click')
      expect(useNarrationStore().isNarrating).toBe(false)
    })

    it("holds the text back while the act's recordings load, then lets it go", async () => {
      const w = mount(ChapterPage, { props: { chapter, titleId: 't' } })
      expect(w.get('.lq-chapter-inner').classes()).toContain('lq-held')
      await flushPromises()
      expect(w.get('.lq-chapter-inner').classes()).not.toContain('lq-held')
    })
  })
})
