// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import FeedbackDialog from './FeedbackDialog.vue'
import { useFeedbackStore } from '@/stores/useFeedbackStore'

describe('FeedbackDialog', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:shot'),
      revokeObjectURL: vi.fn(),
    })
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.unstubAllGlobals()
  })

  function mountDialog(picture: Blob | null = new Blob(['x'])) {
    const feedback = useFeedbackStore()
    feedback.begin(picture)
    wrapper = mount(FeedbackDialog, {
      attachTo: document.body,
      props: { place: 'Act I · Riverbank' },
    })
    return { feedback, w: wrapper }
  }
  const sendButton = (w: VueWrapper) =>
    w.findAll('button').find((b) => /^Send/.test(b.text()))!
  const button = (w: VueWrapper, label: string) =>
    w.findAll('button').find((b) => b.text() === label)!

  it('has the agreed heading, kinds, placeholder and sentences', () => {
    const { w } = mountDialog()
    expect(w.text()).toContain('Feedback')
    expect(w.text()).toContain('Tell us what you found')
    expect(button(w, "Something's wrong").attributes('aria-checked')).toBe(
      'true',
    )
    expect(button(w, 'An idea').attributes('aria-checked')).toBe('false')
    expect(w.get('textarea').attributes('placeholder')).toBe(
      'What happened, or what would make the game better?',
    )
    expect(w.text()).toContain('Include a picture of the screen')
    expect(w.text()).toContain(
      'Screenshots are posted publicly with your report. Check they show nothing private.',
    )
    expect(w.text()).toContain(
      'Your save, where you are (Act I · Riverbank) and the game’s version'.replace(
        '’',
        "'",
      ),
    )
    expect(w.text()).toContain(
      "Reports are posted publicly — don't write anything private.",
    )
  })

  it('starts with focus in the box, the counter at 0 and Send dim', async () => {
    const { w } = mountDialog()
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(w.get('textarea').element)
    expect(w.text()).toContain('0 / 5000')
    expect(sendButton(w).attributes('disabled')).toBeDefined()
  })

  it('counts what is written, takes no more than 5000 and wakes Send at 3 letters', async () => {
    const { w, feedback } = mountDialog()
    expect(w.get('textarea').attributes('maxlength')).toBe('5000')
    await w.get('textarea').setValue('ab')
    expect(sendButton(w).attributes('disabled')).toBeDefined()
    await w.get('textarea').setValue('abc')
    expect(sendButton(w).attributes('disabled')).toBeUndefined()
    await w.get('textarea').setValue('x'.repeat(5000))
    expect(w.text()).toContain('5000 / 5000')
    expect(feedback.text).toHaveLength(5000)
  })

  it('picks the idea kind', async () => {
    const { w, feedback } = mountDialog()
    await button(w, 'An idea').trigger('click')
    expect(feedback.kind).toBe('feature')
  })

  it('shows a copy of the picture while ticked, and none once unticked', async () => {
    const { w, feedback } = mountDialog()
    expect(w.find('img.lq-feedback-thumb').exists()).toBe(true)
    await w.get('input[type=checkbox]').setValue(false)
    expect(feedback.includePicture).toBe(false)
    expect(w.find('img.lq-feedback-thumb').exists()).toBe(false)
  })

  it('offers no picture box ticked when none could be taken', () => {
    const { w } = mountDialog(null)
    const box = w.get('input[type=checkbox]')
    expect((box.element as HTMLInputElement).checked).toBe(false)
    expect(box.attributes('disabled')).toBeDefined()
  })

  it('asks the layout to send, on Send', async () => {
    const { w } = mountDialog()
    await w.get('textarea').setValue('abc')
    await sendButton(w).trigger('click')
    expect(w.emitted('send')).toHaveLength(1)
  })

  it('locks everything while sending', async () => {
    const { w, feedback } = mountDialog()
    await w.get('textarea').setValue('abc')
    feedback.phase = 'sending'
    await nextTick()
    expect(sendButton(w).text()).toBe('Sending…')
    expect(sendButton(w).attributes('disabled')).toBeDefined()
    expect(button(w, 'Cancel').attributes('disabled')).toBeDefined()
    expect(w.get('textarea').attributes('disabled')).toBeDefined()
    expect(w.get('input[type=checkbox]').attributes('disabled')).toBeDefined()
    expect(button(w, 'An idea').attributes('disabled')).toBeDefined()
  })

  it('says why it failed, keeps the words and lets Send be pressed again', async () => {
    const { w, feedback } = mountDialog()
    await w.get('textarea').setValue('abc')
    feedback.phase = 'failed'
    feedback.error = "Something went wrong and it wasn't sent. Try again later."
    await nextTick()
    expect(w.get('[role=alert]').text()).toBe(feedback.error)
    expect((w.get('textarea').element as HTMLTextAreaElement).value).toBe('abc')
    expect(sendButton(w).attributes('disabled')).toBeUndefined()
  })

  it('thanks the player, with the report number and one way back', async () => {
    const { w, feedback } = mountDialog()
    feedback.phase = 'sent'
    feedback.reference = 42
    await nextTick()
    expect(w.text()).toContain('Thank you')
    expect(w.text()).not.toContain('Tell us what you found')
    expect(w.text()).toContain(
      "Sent — it's report #42. Thank you for telling us.",
    )
    expect(w.find('textarea').exists()).toBe(false)
    await button(w, 'Back to the game').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('closes on Cancel, ✕ and Escape, sending nothing', async () => {
    const { w } = mountDialog()
    await button(w, 'Cancel').trigger('click')
    await w.get('.lq-dialog-close').trigger('click')
    await w.get('textarea').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('close')).toHaveLength(3)
    expect(w.emitted('send')).toBeUndefined()
  })

  it('does nothing on F2 while open', async () => {
    const { w } = mountDialog()
    const event = new KeyboardEvent('keydown', { key: 'F2', bubbles: true })
    w.get('textarea').element.dispatchEvent(event)
    expect(w.emitted('close')).toBeUndefined()
  })
})
