// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { domToBlob as realDomToBlob } from 'modern-screenshot'
import { captureScreen } from './screenshot'

vi.mock('modern-screenshot', () => ({ domToBlob: vi.fn() }))
const domToBlob = vi.mocked(realDomToBlob)

const el = document.createElement('div')
const blobOf = (size: number): Blob => new Blob([new Uint8Array(size)])

describe('captureScreen', () => {
  beforeEach(() => domToBlob.mockReset())

  it('is the first picture when it fits', async () => {
    const small = blobOf(10)
    domToBlob.mockResolvedValue(small)
    expect(await captureScreen(el)).toBe(small)
    expect(domToBlob).toHaveBeenCalledOnce()
  })

  it('tries smaller until the picture is under 2 MB', async () => {
    const small = blobOf(10)
    domToBlob
      .mockResolvedValueOnce(blobOf(3 * 1024 * 1024))
      .mockResolvedValueOnce(small)
    expect(await captureScreen(el)).toBe(small)
    expect((domToBlob.mock.calls[1] as unknown[])[1]).toMatchObject({
      scale: 0.75,
      type: 'image/jpeg',
    })
  })

  it('is null when nothing fits or nothing comes back', async () => {
    domToBlob.mockResolvedValue(blobOf(3 * 1024 * 1024))
    expect(await captureScreen(el)).toBeNull()
    domToBlob.mockResolvedValue(null as unknown as Blob)
    expect(await captureScreen(el)).toBeNull()
  })

  it('leaves the feedback window out of the picture, whenever it is taken', async () => {
    domToBlob.mockResolvedValue(blobOf(10))
    await captureScreen(el)
    const options = (domToBlob.mock.calls[0] as unknown[])[1] as {
      filter: (node: Node) => boolean
    }
    const game = document.createElement('div')
    const window = document.createElement('div')
    window.setAttribute('data-feedback-window', '')
    const inside = document.createElement('p')
    window.append(inside)
    expect(options.filter(game)).toBe(true)
    expect(options.filter(window)).toBe(false)
    expect(options.filter(inside)).toBe(false)
    expect(options.filter(document.createTextNode('x'))).toBe(true)
  })
})
