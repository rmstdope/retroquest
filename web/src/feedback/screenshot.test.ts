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
    expect(domToBlob.mock.calls[1][1]).toMatchObject({
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
})
