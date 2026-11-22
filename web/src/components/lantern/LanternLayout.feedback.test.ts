// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { startedHoldStore } from '@/testing/holdGame'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useFeedbackStore } from '@/stores/useFeedbackStore'

const capture = vi.hoisted(() => ({ screen: vi.fn() }))
vi.mock('@/feedback/screenshot', () => ({ captureScreen: capture.screen }))

/** A laptop: a wide window with a mouse and keyboard. */
function laptop(): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('min-width') || query.includes('pointer: fine'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

/** Feedback: ✎, the menu's entry and F2 open one window over the game, which pauses meanwhile. */
describe('LanternLayout: feedback', () => {
  let w: VueWrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    laptop()
    capture.screen.mockReset()
    capture.screen.mockResolvedValue(new Blob(['png']))
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:shot'),
      revokeObjectURL: vi.fn(),
    })
    await startedHoldStore()
    useGameStore().showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
  })
  afterEach(() => {
    w.unmount()
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const press = async (key: string, target: Element = document.body) => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
    await flushPromises()
  }
  const heading = (): string | undefined =>
    document.querySelector('[role="dialog"] h2')?.textContent?.trim()
  const feedbackOpen = (): boolean => useFeedbackStore().open

  it('opens on F2, with focus in the box, over the game', async () => {
    await press('F2')
    expect(feedbackOpen()).toBe(true)
    expect(heading()).toBe('Tell us what you found')
    expect(document.activeElement).toBe(document.querySelector('textarea'))
  })

  it('takes the picture before the window is there, of the game itself', async () => {
    await press('F2')
    expect(capture.screen).toHaveBeenCalledOnce()
    const [element] = capture.screen.mock.calls[0]
    expect(element).toBe(w.element)
  })

  it('opens from the ✎ button on the picture', async () => {
    await w.get('[data-button="feedback"]').trigger('click')
    await flushPromises()
    expect(feedbackOpen()).toBe(true)
  })

  it('opens from the menu, and Escape comes back to the menu with focus on its entry', async () => {
    await press('Escape')
    const entry = [
      ...document.querySelectorAll<HTMLElement>('[role="dialog"] button'),
    ].find((b) => b.getAttribute('aria-label') === 'Send feedback')!
    entry.focus()
    entry.click()
    await flushPromises()
    expect(feedbackOpen()).toBe(true)
    await press('Escape', document.activeElement!)
    expect(feedbackOpen()).toBe(false)
    expect(document.querySelector('.lq-menu')).not.toBeNull()
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'Send feedback',
    )
  })

  it('opens over the menu on F2 and leaves the menu open beneath', async () => {
    await press('Escape')
    await press('F2')
    expect(feedbackOpen()).toBe(true)
    await press('Escape', document.activeElement!)
    expect(feedbackOpen()).toBe(false)
    expect(document.querySelector('.lq-menu')).not.toBeNull()
  })

  it('does nothing on F2 while open, and no other game key acts under it', async () => {
    await press('F2')
    await press('F2', document.activeElement!)
    expect(document.querySelectorAll('textarea')).toHaveLength(1)
    await press('j', document.activeElement!)
    expect(document.querySelector('.lq-story-drawer')).toBeNull()
  })

  it('is not on the title page', async () => {
    useGameStore().showTitle = true
    await flushPromises()
    await press('F2')
    expect(feedbackOpen()).toBe(false)
    expect(capture.screen).not.toHaveBeenCalled()
  })

  it('pauses the narration while open and lets it go on after', async () => {
    const pause = vi.spyOn(useNarrationStore(), 'pause')
    const resume = vi.spyOn(useNarrationStore(), 'resume')
    await press('F2')
    expect(pause).toHaveBeenCalled()
    await press('Escape', document.activeElement!)
    expect(resume).toHaveBeenCalled()
  })

  it('keeps what was written when closed, and shows it again', async () => {
    await press('F2')
    const box = document.querySelector('textarea')!
    box.value = 'the door sticks'
    box.dispatchEvent(new Event('input'))
    await press('Escape', box)
    await press('F2')
    expect(document.querySelector('textarea')!.value).toBe('the door sticks')
  })

  it('sends the report with the save, the act and room, and says thank you', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ reference: 42 }), { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await press('F2')
    const box = document.querySelector('textarea')!
    box.value = 'The door sticks'
    box.dispatchEvent(new Event('input'))
    await flushPromises()
    const send = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Send',
    )!
    send.click()
    await vi.waitFor(() => expect(heading()).toBe('Thank you'))
    const init = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const body = JSON.parse(init[1].body as string) as {
      appVersion: string
      save: { data: string }
      title: string
    }
    expect(body.title).toBe('The door sticks')
    expect(body.appVersion).toContain(useGameStore().roomName)
    expect(JSON.parse(atob(body.save.data))).toMatchObject({ version: 4 })
  })
})
