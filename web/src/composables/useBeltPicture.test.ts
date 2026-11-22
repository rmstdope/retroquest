// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { setPictureProbe } from '@/lantern/roomPicture'
import { useBeltPicture } from './useBeltPicture'

/** Runs the composable inside a component and returns what it yields. */
const mounted: { unmount: () => void }[] = []

function run(name: string | (() => string)): { url: () => string | null } {
  let url = (): string | null => null
  const Probe = defineComponent({
    setup() {
      const picture = useBeltPicture(
        () => 'item',
        () => (typeof name === 'string' ? name : name()),
      )
      url = (): string | null => picture.value
      return () => h('div')
    },
  })
  const app = createApp(Probe)
  app.mount(document.createElement('div'))
  mounted.push(app)
  return { url: () => url() }
}

describe('useBeltPicture', () => {
  afterEach(() => {
    setPictureProbe(null)
    for (const app of mounted.splice(0)) app.unmount()
  })

  it('is null while the picture loads, then its URL', async () => {
    const release = ref<(found: boolean) => void>(() => undefined)
    setPictureProbe(
      () =>
        new Promise<boolean>((resolve) => {
          release.value = resolve
        }),
    )
    const belt = run('horseshoe')
    expect(belt.url()).toBeNull()
    release.value(true)
    await nextTick()
    await Promise.resolve()
    await nextTick()
    expect(belt.url()).toMatch(/item-horseshoe\.png$/)
  })

  it('stays null when the picture is not there', async () => {
    setPictureProbe(() => Promise.resolve(false))
    const belt = run('horseshoe')
    await Promise.resolve()
    await nextTick()
    expect(belt.url()).toBeNull()
  })

  /** Lets the pending probes settle. */
  async function settle(): Promise<void> {
    for (let i = 0; i < 4; i++) {
      await Promise.resolve()
      await nextTick()
    }
  }

  it('shows the state picture when it is made', async () => {
    setPictureProbe(() => Promise.resolve(true))
    const belt = run('lantern (lit)')
    await settle()
    expect(belt.url()).toMatch(/item-lantern-lit\.png$/)
  })

  it('falls back to the base picture while the state picture is not made', async () => {
    setPictureProbe((url) => Promise.resolve(!url.includes('-lit')))
    const belt = run('lantern (lit)')
    await settle()
    expect(belt.url()).toMatch(/item-lantern\.png$/)
  })

  it('shows the base picture for a name that has no state', async () => {
    setPictureProbe(() => Promise.resolve(true))
    const belt = run('lantern')
    await settle()
    expect(belt.url()).toMatch(/item-lantern\.png$/)
  })

  it('keeps the old picture while the picture of a new state loads', async () => {
    setPictureProbe(() => Promise.resolve(true))
    const name = ref('lantern')
    const belt = run(() => name.value)
    await settle()
    expect(belt.url()).toMatch(/item-lantern\.png$/)
    const release = ref<(found: boolean) => void>(() => undefined)
    setPictureProbe(
      () =>
        new Promise<boolean>((resolve) => {
          release.value = resolve
        }),
    )
    name.value = 'lantern (lit)'
    await settle()
    expect(belt.url()).toMatch(/item-lantern\.png$/)
    release.value(true)
    await settle()
    expect(belt.url()).toMatch(/item-lantern-lit\.png$/)
  })

  it('drops the old picture when the thing is another one', async () => {
    setPictureProbe(() => Promise.resolve(true))
    const name = ref('lantern')
    const belt = run(() => name.value)
    await settle()
    setPictureProbe(() => new Promise<boolean>(() => undefined))
    name.value = 'horseshoe'
    await settle()
    expect(belt.url()).toBeNull()
  })
})
