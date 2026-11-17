// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import LanternDialog from './LanternDialog.vue'

describe('LanternDialog', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountDialog(props = {}, slots = {}) {
    wrapper = mount(LanternDialog, {
      props: { title: 'Save game', eyebrow: 'Game', ...props },
      slots: {
        default:
          '<button class="first">First</button><button class="last">Last</button>',
        ...slots,
      },
      attachTo: document.body,
    })
    return wrapper
  }

  /** Press Tab where focus is, as a browser would send it. */
  function pressTab(target: HTMLElement, shiftKey = false) {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }),
    )
  }

  it('can stay centred on a phone (centered)', () => {
    expect(mountDialog().get('.lq-dialog-layer').classes()).not.toContain(
      'lq-dialog-centered',
    )
    wrapper?.unmount()
    expect(
      mountDialog({ centered: true }).get('.lq-dialog-layer').classes(),
    ).toContain('lq-dialog-centered')
  })

  it('can be a pane of frosted glass (glass)', () => {
    expect(mountDialog().get('.lq-dialog-layer').classes()).not.toContain(
      'lq-dialog-glass',
    )
    wrapper?.unmount()
    expect(
      mountDialog({ glass: true }).get('.lq-dialog-layer').classes(),
    ).toContain('lq-dialog-glass')
  })

  it('can be narrow, for a short list of choices (narrow)', () => {
    expect(mountDialog().get('.lq-dialog-layer').classes()).not.toContain(
      'lq-dialog-narrow',
    )
    wrapper?.unmount()
    expect(
      mountDialog({ narrow: true }).get('.lq-dialog-layer').classes(),
    ).toContain('lq-dialog-narrow')
  })

  it('is a modal dialog named by its title', () => {
    const w = mountDialog()
    const dialog = w.get('[role="dialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    const title = w.get('h2')
    expect(title.text()).toBe('Save game')
    expect(dialog.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(w.get('.lq-dialog-eyebrow').text()).toBe('Game')
  })

  it('closes with the close button, Escape or the backdrop', async () => {
    const w = mountDialog()

    await w.get('button[aria-label="Close"]').trigger('click')
    await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    await w.get('.lq-dialog-scrim').trigger('click')

    expect(w.emitted('close')).toHaveLength(3)
  })

  it('can leave out the close button', () => {
    const w = mountDialog({ closable: false })

    expect(w.find('button[aria-label="Close"]').exists()).toBe(false)
  })

  it('ignores the backdrop when it has no close button', async () => {
    const w = mountDialog({ closable: false })

    await w.get('.lq-dialog-scrim').trigger('click')

    expect(w.emitted('close')).toBeUndefined()
  })

  it('takes focus back when its backdrop is tapped, so Escape still works', async () => {
    const w = mountDialog({ closable: false })
    await w.vm.$nextTick()
    // A tap on the backdrop leaves focus on the page body in a browser.
    ;(document.activeElement as HTMLElement | null)?.blur()

    await w.get('.lq-dialog-scrim').trigger('click')

    expect(
      w.get('[role="dialog"]').element.contains(document.activeElement),
    ).toBe(true)
  })

  it('keeps Tab inside the dialog', async () => {
    const w = mountDialog()
    const dialog = w.get('[role="dialog"]')
    const close = w.get('button[aria-label="Close"]').element as HTMLElement
    const last = w.get('.last').element as HTMLElement

    last.focus()
    await dialog.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(close)

    await dialog.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('skips hidden and untabbable elements when wrapping Tab', async () => {
    const w = mountDialog(
      {},
      {
        default:
          '<button class="last">Last</button><button class="gone">Gone</button>' +
          '<button tabindex="-1">Skipped</button>',
      },
    )
    const close = w.get('button[aria-label="Close"]').element as HTMLElement
    const last = w.get('.last').element as HTMLElement
    // jsdom has no layout: mark the element as not rendered, as a browser would.
    const gone = w.get('.gone').element as HTMLElement
    gone.checkVisibility = () => false

    last.focus()
    pressTab(last)
    expect(document.activeElement).toBe(close)
  })

  it('focuses the dialog itself when it has nothing to focus', async () => {
    const w = mountDialog({ closable: false }, { default: '<p>Only text</p>' })
    await w.vm.$nextTick()
    const dialog = w.get('[role="dialog"]').element as HTMLElement

    expect(document.activeElement).toBe(dialog)
    expect(dialog.getAttribute('tabindex')).toBe('-1')
  })

  it('wraps Shift+Tab from the dialog itself to the last element', async () => {
    const w = mountDialog()
    const dialog = w.get('[role="dialog"]').element as HTMLElement
    dialog.focus()

    pressTab(dialog, true)
    expect(document.activeElement).toBe(w.get('.last').element)
  })

  it('puts focus on the element marked to get it, else the first one', async () => {
    const marked = mountDialog(
      {},
      { default: '<button>A</button><button data-autofocus>B</button>' },
    )
    await marked.vm.$nextTick()
    expect(document.activeElement?.textContent).toBe('B')
    marked.unmount()
    wrapper = undefined

    const plain = mountDialog({ closable: false })
    await plain.vm.$nextTick()
    expect(document.activeElement?.className).toBe('first')
  })

  it('has a footer for its buttons', () => {
    const w = mountDialog({}, { footer: '<button>Continue</button>' })

    expect(w.get('footer').text()).toBe('Continue')
  })

  it('gives focus back to what had it when it opened', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const w = mountDialog()
    await w.vm.$nextTick()

    w.unmount()
    wrapper = undefined

    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('can leave focus to its caller', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const w = mountDialog({ restoreFocus: false })
    await w.vm.$nextTick()

    w.unmount()
    wrapper = undefined

    expect(document.activeElement).not.toBe(opener)
    opener.remove()
  })

  it('starts on the panel itself, with no ring, when asked (startOnPanel)', async () => {
    mountDialog({ startOnPanel: true })
    await Promise.resolve()
    await Promise.resolve()
    expect(document.activeElement).toBe(
      wrapper?.get('.lq-dialog-panel').element,
    )
  })

  it('scrolls the body with the scroll keys when asked (scrollKeys)', () => {
    mountDialog({ scrollKeys: true })
    const body = wrapper?.get('.lq-dialog-content').element as HTMLElement
    const by = vi.fn()
    const to = vi.fn()
    body.scrollBy = by
    body.scrollTo = to
    const press = (key: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      })
      wrapper?.get('.first').element.dispatchEvent(event)
      return event
    }
    expect(press('ArrowDown').defaultPrevented).toBe(true)
    expect(by).toHaveBeenLastCalledWith({ top: 40 })
    press('ArrowUp')
    expect(by).toHaveBeenLastCalledWith({ top: -40 })
    press('Home')
    expect(to).toHaveBeenLastCalledWith({ top: 0 })
    press('End')
    expect(to).toHaveBeenLastCalledWith({ top: body.scrollHeight })
    press('PageDown')
    expect(by).toHaveBeenLastCalledWith({ top: body.clientHeight * 0.9 })
    press('PageUp')
    expect(by).toHaveBeenLastCalledWith({ top: -body.clientHeight * 0.9 })
    expect(press('a').defaultPrevented).toBe(false)
  })

  it('leaves the arrows alone without scrollKeys', () => {
    mountDialog()
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })
    wrapper?.get('.first').element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('shows its key line below the footer', () => {
    mountDialog({ keyLine: [{ keys: ['Esc'], word: 'back' }] })
    expect(wrapper?.findComponent({ name: 'KeyLine' }).exists()).toBe(true)
  })
})
