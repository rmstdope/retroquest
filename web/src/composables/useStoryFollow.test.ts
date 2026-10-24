// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useStoryFollow } from './useStoryFollow'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'

/** Line height and pane height of the fake layout, in px. */
const LINE = 20
const VIEW = 400
const CONTENT = 2000

/** Frames queued by the fake `requestAnimationFrame`. */
let frames: ((time: number) => void)[] = []
/** Run queued frames at `time` ms. */
function frame(time: number): void {
  const queued = frames
  frames = []
  queued.forEach((run) => run(time))
}

interface Fake {
  wrapper: VueWrapper
  story: HTMLElement
  api: ReturnType<typeof useStoryFollow>
  /** A word span whose content-coordinate bottom is `bottom`. */
  word(bottom: number): HTMLElement
}

/** Mounts a story pane with fake geometry: a 400px view of 2000px of content. */
async function mountStory(view = VIEW): Promise<Fake> {
  let api!: ReturnType<typeof useStoryFollow>
  const host = defineComponent({
    setup() {
      const story = ref<HTMLElement | null>(null)
      api = useStoryFollow(story)
      return () => h('section', { ref: story, class: 'story' })
    },
  })
  const wrapper = mount(host, { attachTo: document.body })
  await nextTick()
  const story = wrapper.element as HTMLElement
  let top = 0
  Object.defineProperty(story, 'scrollTop', {
    get: () => top,
    set: (value: number) => {
      top = Math.max(0, Math.min(value, CONTENT - view))
      story.dispatchEvent(new Event('scroll'))
    },
    configurable: true,
  })
  Object.defineProperty(story, 'clientHeight', {
    value: view,
    configurable: true,
  })
  Object.defineProperty(story, 'scrollHeight', { value: CONTENT })
  story.getBoundingClientRect = () =>
    ({ top: 100, bottom: 100 + view }) as DOMRect
  return {
    wrapper,
    story,
    api,
    word(bottom: number) {
      const el = document.createElement('span')
      el.style.lineHeight = `${LINE}px`
      el.getBoundingClientRect = () =>
        ({
          top: 100 + bottom - LINE - story.scrollTop,
          bottom: 100 + bottom - story.scrollTop,
        }) as DOMRect
      story.appendChild(el)
      return el
    },
  }
}

describe('useStoryFollow', () => {
  let audio: NarrationAudio
  let narration: ReturnType<typeof useNarrationStore>
  let fake: Fake

  /** Start narrating a story turn (the pane is then held). */
  function read(id = 1): void {
    narration.begin(
      id,
      [
        {
          kind: 'block',
          parts: [
            {
              markup: 'a b',
              clip: { file: 'a.mp3', speaker: 'n', duration: 2, words: [] },
            },
          ],
        },
      ],
      'act1',
    )
  }

  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (run: (t: number) => void) => {
      frames.push(run)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      frames = []
    })
    document.documentElement.style.setProperty('--lq-motion', '0')
    setActivePinia(createPinia())
    narration = useNarrationStore()
    narration.setAudioFactory(() => {
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
  afterEach(() => {
    fake.wrapper.unmount()
    narration.skipAll()
    document.documentElement.style.removeProperty('--lq-motion')
    vi.unstubAllGlobals()
  })

  describe('following the word', () => {
    it('stays still while the word is well above the bottom', async () => {
      fake = await mountStory()
      read()
      fake.api.follow(fake.word(300))
      expect(fake.story.scrollTop).toBe(0)
    })

    it('keeps the word two lines above the bottom once it gets within two lines', async () => {
      fake = await mountStory()
      read()
      fake.api.follow(fake.word(360)) // 40px (two lines) above the bottom: still
      expect(fake.story.scrollTop).toBe(0)
      fake.api.follow(fake.word(380)) // one line too low
      expect(fake.story.scrollTop).toBe(20)
      fake.api.follow(fake.word(400))
      expect(fake.story.scrollTop).toBe(40)
    })

    it('brings a word that is far below up in one move to two lines above the bottom', async () => {
      fake = await mountStory()
      read()
      fake.api.follow(fake.word(900))
      expect(fake.story.scrollTop).toBe(900 - VIEW + 2 * LINE)
    })

    it('keeps the line just inside the bottom edge in a very short pane', async () => {
      fake = await mountStory(80)
      read()
      fake.api.follow(fake.word(150))
      expect(fake.story.scrollTop).toBe(150 - 80)
    })

    it('brings a word above the top back to the top', async () => {
      fake = await mountStory()
      read()
      fake.api.moveTo(500, false)
      fake.api.follow(fake.word(450)) // top at 430, above the view
      expect(fake.story.scrollTop).toBe(430)
    })

    it('glides to the target over a short time when motion is allowed', async () => {
      fake = await mountStory()
      document.documentElement.style.setProperty('--lq-motion', '1')
      read()
      fake.api.follow(fake.word(420))
      frame(1000)
      expect(fake.story.scrollTop).toBe(0)
      frame(1090)
      expect(fake.story.scrollTop).toBeGreaterThan(0)
      expect(fake.story.scrollTop).toBeLessThan(60)
      frame(1400)
      expect(fake.story.scrollTop).toBe(60)
      expect(frames).toHaveLength(0)
    })

    it('does not scroll twice for words that arrive while it is gliding', async () => {
      fake = await mountStory()
      document.documentElement.style.setProperty('--lq-motion', '1')
      read()
      fake.api.follow(fake.word(420))
      frame(1000)
      frame(1050)
      fake.api.follow(fake.word(420)) // the same line, still on its way
      frame(2000)
      expect(fake.story.scrollTop).toBe(60)
    })

    it('is a no-op without a pane', async () => {
      fake = await mountStory()
      fake.wrapper.unmount()
      expect(() => fake.api.follow(fake.word(900))).not.toThrow()
      fake = await mountStory()
    })

    it('follows a unit that starts out of view, by its first line when it is taller than the pane', async () => {
      fake = await mountStory()
      read()
      const unit = fake.word(1500)
      unit.getBoundingClientRect = () =>
        ({
          top: 100 + 600 - fake.story.scrollTop,
          bottom: 100 + 1500,
        }) as DOMRect
      fake.api.follow(unit, true)
      expect(fake.story.scrollTop).toBe(620 - VIEW + 2 * LINE)
    })

    it('refollows the lit word at once when the pane changes size', async () => {
      fake = await mountStory()
      document.documentElement.style.setProperty('--lq-motion', '1')
      read()
      const lit = fake.word(500)
      lit.className = 'lq-w-now'
      fake.api.refollow()
      expect(fake.story.scrollTop).toBe(500 - VIEW + 2 * LINE)
    })
  })

  describe('holding the pane still', () => {
    it('is held exactly while a story turn is read', async () => {
      fake = await mountStory()
      expect(fake.api.held.value).toBe(false)
      read()
      expect(fake.api.held.value).toBe(true)
      narration.skipAll()
      expect(fake.api.held.value).toBe(false)
    })

    it('stops the mouse wheel and touch drags, showing the hint', async () => {
      fake = await mountStory()
      read()
      const wheel = new WheelEvent('wheel', { cancelable: true, deltaY: 100 })
      fake.story.dispatchEvent(wheel)
      expect(wheel.defaultPrevented).toBe(true)
      expect(narration.hintVisible).toBe(true)

      const touch = new Event('touchmove', { cancelable: true })
      fake.story.dispatchEvent(touch)
      expect(touch.defaultPrevented).toBe(true)
    })

    it('stops the scrolling keys on the page or the story, not in a field, not other keys', async () => {
      fake = await mountStory()
      read()
      const press = (key: string, target: EventTarget = document.body) => {
        const event = new KeyboardEvent('keydown', {
          key,
          cancelable: true,
          bubbles: true,
        })
        target.dispatchEvent(event)
        return event.defaultPrevented
      }
      for (const key of [
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
      ])
        expect(press(key)).toBe(true)
      expect(press('ArrowDown', fake.story)).toBe(true)
      expect(press('a')).toBe(false)
      expect(press(' ')).toBe(false)
      const input = document.createElement('input')
      document.body.appendChild(input)
      expect(press('ArrowDown', input)).toBe(false)
      expect(press('Home', input)).toBe(false)
      input.remove()
    })

    it('puts the pane back when it is moved by other means, such as the scrollbar', async () => {
      fake = await mountStory()
      read()
      fake.api.moveTo(100, false)
      fake.story.scrollTop = 700
      expect(fake.story.scrollTop).toBe(100)
      expect(narration.hintVisible).toBe(true)
    })

    it('does not count the browser clamping the pane after a resize as a scroll attempt', async () => {
      fake = await mountStory()
      for (const id of [1, 2, 3, 4]) read(id) // past the hint's first turns
      fake.api.moveTo(CONTENT - VIEW, false)
      Object.defineProperty(fake.story, 'clientHeight', { value: VIEW + 100 })
      fake.story.scrollTop = CONTENT - VIEW - 100
      expect(fake.story.scrollTop).toBe(CONTENT - VIEW - 100)
      expect(narration.hintVisible).toBe(false)
    })

    it('is free as soon as the reading ends, right where it is', async () => {
      fake = await mountStory()
      read()
      fake.api.moveTo(100, false)
      narration.skipAll()
      await nextTick()
      const wheel = new WheelEvent('wheel', { cancelable: true, deltaY: 100 })
      fake.story.dispatchEvent(wheel)
      expect(wheel.defaultPrevented).toBe(false)
      fake.story.scrollTop = 700
      expect(fake.story.scrollTop).toBe(700)
    })

    it('does not hold the pane for the chapter page or a pop-up', async () => {
      fake = await mountStory()
      read(-1)
      const wheel = new WheelEvent('wheel', { cancelable: true, deltaY: 100 })
      fake.story.dispatchEvent(wheel)
      expect(wheel.defaultPrevented).toBe(false)
    })

    it('cancels a glide when the reading ends', async () => {
      fake = await mountStory()
      document.documentElement.style.setProperty('--lq-motion', '1')
      read()
      fake.api.follow(fake.word(500))
      frame(1000)
      frame(1050)
      const at = fake.story.scrollTop
      narration.skipAll()
      await nextTick()
      frame(2000)
      expect(fake.story.scrollTop).toBe(at)
    })
  })

  describe('lq-follow events', () => {
    it('are handled by following the word while held, and left alone otherwise', async () => {
      fake = await mountStory()
      const word = fake.word(900)
      const idle = new CustomEvent('lq-follow', {
        bubbles: true,
        cancelable: true,
      })
      word.dispatchEvent(idle)
      expect(idle.defaultPrevented).toBe(false)
      expect(fake.story.scrollTop).toBe(0)

      read()
      const held = new CustomEvent('lq-follow', {
        bubbles: true,
        cancelable: true,
      })
      word.dispatchEvent(held)
      expect(held.defaultPrevented).toBe(true)
      expect(fake.story.scrollTop).toBe(900 - VIEW + 2 * LINE)
    })
  })
})
