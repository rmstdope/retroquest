// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
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
})
