// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { setPictureProbe } from '@/lantern/roomPicture'
import { useBeltPicture } from './useBeltPicture'

/** Runs the composable inside a component and returns what it yields. */
function run(name: string): { url: () => string | null } {
  let url = (): string | null => null
  const Probe = defineComponent({
    setup() {
      const picture = useBeltPicture(
        () => 'item',
        () => name,
      )
      url = (): string | null => picture.value
      return () => h('div')
    },
  })
  createApp(Probe).mount(document.createElement('div'))
  return { url: () => url() }
}

describe('useBeltPicture', () => {
  afterEach(() => setPictureProbe(null))

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
})
