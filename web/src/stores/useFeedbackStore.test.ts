import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFeedbackStore } from './useFeedbackStore'

const CONTEXT = {
  saveData: '{"version":4}',
  act: 'Act I',
  room: 'Riverbank',
  version: '1.0.0',
}

/** A fake fetch that answers every report with `status` and `body`. */
function answer(status: number, body: unknown, headers: HeadersInit = {}) {
  const fetchMock = vi.fn(
    async () => new Response(JSON.stringify(body), { status, headers }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The JSON body of the report the mock was sent. */
function sent(mock: ReturnType<typeof answer>): Record<string, unknown> {
  const init = mock.mock.calls[0] as unknown as [string, RequestInit]
  return JSON.parse(init[1].body as string) as Record<string, unknown>
}

const PICTURE = new Blob(['png'], { type: 'image/png' })

describe('useFeedbackStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.unstubAllGlobals()
  })

  it('opens with Something is wrong picked, the picture ticked and nothing written', () => {
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(PICTURE))
    expect(feedback.open).toBe(true)
    expect(feedback.kind).toBe('bug')
    expect(feedback.includePicture).toBe(true)
    expect(feedback.text).toBe('')
    expect(feedback.phase).toBe('editing')
  })

  it('offers no picture, and ticks nothing, when none could be taken', async () => {
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    await vi.waitFor(() => expect(feedback.pictureState).toBe('failed'))
    expect(feedback.includePicture).toBe(false)
    expect(feedback.hasPicture).toBe(false)
  })

  it('keeps the kind and words when closed, and shows them on reopening', () => {
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(PICTURE))
    feedback.kind = 'feature'
    feedback.text = 'a thought'
    feedback.includePicture = false
    feedback.close()
    expect(feedback.open).toBe(false)
    feedback.begin(Promise.resolve(PICTURE))
    expect(feedback.kind).toBe('feature')
    expect(feedback.text).toBe('a thought')
    expect(feedback.includePicture).toBe(true)
  })

  it('files the report with its heading, text, version, save and picture', async () => {
    const mock = answer(201, { reference: 42 })
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(PICTURE))
    feedback.text = 'The door sticks\nand will not open'
    await feedback.send(CONTEXT)
    const body = sent(mock)
    expect(body).toMatchObject({
      clientId: 'retroquest',
      type: 'bug',
      title: 'The door sticks',
      description: 'The door sticks\nand will not open',
      appVersion: '1.0.0 · Act I · Riverbank',
    })
    expect(body.save).toEqual({ data: btoa(CONTEXT.saveData) })
    expect(body.screenshots).toHaveLength(1)
    expect(feedback.phase).toBe('sent')
    expect(feedback.reference).toBe(42)
  })

  it('sends an idea as a feature request and no picture when unticked', async () => {
    const mock = answer(201, { reference: 7 })
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(PICTURE))
    feedback.kind = 'feature'
    feedback.includePicture = false
    feedback.text = 'More boats'
    await feedback.send(CONTEXT)
    expect(sent(mock)).toMatchObject({ type: 'feature' })
    expect(sent(mock).screenshots).toBeUndefined()
  })

  it('says Sending while the report is on its way', async () => {
    const noRelease = (): void => {}
    let release: (response: Response) => void = noRelease
    vi.stubGlobal(
      'fetch',
      () => new Promise<Response>((resolve) => (release = resolve)),
    )
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    feedback.text = 'abc'
    const pending = feedback.send(CONTEXT)
    expect(feedback.phase).toBe('sending')
    await vi.waitFor(() => expect(release).not.toBe(noRelease))
    release(new Response(JSON.stringify({ reference: 1 }), { status: 201 }))
    await pending
    expect(feedback.phase).toBe('sent')
  })

  it('clears the words once the report is sent, when the window closes', async () => {
    answer(201, { reference: 1 })
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    feedback.text = 'abc'
    await feedback.send(CONTEXT)
    feedback.close()
    feedback.begin(Promise.resolve(null))
    expect(feedback.text).toBe('')
    expect(feedback.phase).toBe('editing')
  })

  it('opens on Something is wrong again once an idea was sent', async () => {
    answer(201, { reference: 1 })
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    feedback.kind = 'feature'
    feedback.text = 'abc'
    await feedback.send(CONTEXT)
    feedback.close()
    feedback.begin(Promise.resolve(null))
    expect(feedback.kind).toBe('bug')
    expect(feedback.text).toBe('')
  })

  it('keeps what was written when the service refuses, and says why', async () => {
    answer(
      429,
      { error: 'rate_limited', message: 'slow' },
      { 'retry-after': '130' },
    )
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    feedback.text = 'abc'
    await feedback.send(CONTEXT)
    expect(feedback.phase).toBe('failed')
    expect(feedback.text).toBe('abc')
    expect(feedback.error).toBe(
      'Too many reports just now. Try again in 3 minutes.',
    )
  })

  it('says the service could not be reached when the request fails', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('offline')
    })
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    feedback.text = 'abc'
    await feedback.send(CONTEXT)
    expect(feedback.error).toMatch(/^Couldn't reach the feedback service/)
  })

  it('can send again after a failure', async () => {
    answer(500, { error: 'internal', message: 'x' })
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    feedback.text = 'abc'
    await feedback.send(CONTEXT)
    const mock = answer(201, { reference: 9 })
    await feedback.send(CONTEXT)
    expect(mock).toHaveBeenCalledOnce()
    expect(feedback.phase).toBe('sent')
    expect(feedback.error).toBe('')
  })

  it('cannot be closed while sending, and its answer lands in the same window', async () => {
    let release: (response: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      () => new Promise<Response>((resolve) => (release = resolve)),
    )
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    feedback.text = 'abc'
    const pending = feedback.send(CONTEXT)
    feedback.close()
    expect(feedback.open).toBe(true)
    expect(feedback.phase).toBe('sending')
    await vi.waitFor(() => expect(feedback.phase).toBe('sending'))
    await new Promise((r) => setTimeout(r, 0))
    release(new Response(JSON.stringify({ reference: 5 }), { status: 201 }))
    await pending
    expect(feedback.phase).toBe('sent')
    expect(feedback.reference).toBe(5)
  })

  it('does not send while it is already sending or too short', async () => {
    const mock = answer(201, { reference: 1 })
    const feedback = useFeedbackStore()
    feedback.begin(Promise.resolve(null))
    feedback.text = 'a b'
    expect(feedback.canSend).toBe(false)
    await feedback.send(CONTEXT)
    expect(mock).not.toHaveBeenCalled()
    feedback.text = 'abc'
    expect(feedback.canSend).toBe(true)
  })
})

/** A picture that arrives when `resolve` is called, as a slow screenshot does. */
function slowPicture(): {
  shot: Promise<Blob | null>
  arrive: (blob: Blob | null) => Promise<void>
} {
  let resolve: (blob: Blob | null) => void = () => {}
  const shot = new Promise<Blob | null>((r) => (resolve = r))
  return {
    shot,
    arrive: async (blob) => {
      resolve(blob)
      await shot
      await Promise.resolve()
    },
  }
}

describe('useFeedbackStore: the picture arrives after the window opens', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.unstubAllGlobals()
  })

  it('opens at once with the picture being taken and the box ticked', () => {
    const feedback = useFeedbackStore()
    feedback.begin(slowPicture().shot)
    expect(feedback.open).toBe(true)
    expect(feedback.pictureState).toBe('taking')
    expect(feedback.includePicture).toBe(true)
    expect(feedback.hasPicture).toBe(false)
  })

  it('has the picture ready once it arrives', async () => {
    const feedback = useFeedbackStore()
    const slow = slowPicture()
    feedback.begin(slow.shot)
    await slow.arrive(PICTURE)
    expect(feedback.pictureState).toBe('ready')
    expect(feedback.picture).toBe(PICTURE)
    expect(feedback.includePicture).toBe(true)
  })

  it('unticks the box when the picture cannot be taken', async () => {
    const feedback = useFeedbackStore()
    const slow = slowPicture()
    feedback.begin(slow.shot)
    await slow.arrive(null)
    expect(feedback.pictureState).toBe('failed')
    expect(feedback.includePicture).toBe(false)
  })

  it('treats a picture that throws as one that could not be taken', async () => {
    const feedback = useFeedbackStore()
    feedback.begin(Promise.reject(new Error('no')))
    await vi.waitFor(() => expect(feedback.pictureState).toBe('failed'))
  })

  it('keeps the box unticked when the picture arrives after it was unticked', async () => {
    const feedback = useFeedbackStore()
    const slow = slowPicture()
    feedback.begin(slow.shot)
    feedback.includePicture = false
    await slow.arrive(PICTURE)
    expect(feedback.pictureState).toBe('ready')
    expect(feedback.includePicture).toBe(false)
  })

  it('throws a late picture away when the window was closed meanwhile', async () => {
    const feedback = useFeedbackStore()
    const slow = slowPicture()
    feedback.begin(slow.shot)
    feedback.close()
    await slow.arrive(PICTURE)
    expect(feedback.picture).toBeNull()
  })

  it('does not hand an earlier picture to a window opened again', async () => {
    const feedback = useFeedbackStore()
    const first = slowPicture()
    feedback.begin(first.shot)
    feedback.close()
    const second = slowPicture()
    feedback.begin(second.shot)
    await first.arrive(PICTURE)
    expect(feedback.pictureState).toBe('taking')
    expect(feedback.picture).toBeNull()
  })

  it('sends with the picture when Send is pressed before it is ready', async () => {
    const mock = answer(201, { reference: 3 })
    const feedback = useFeedbackStore()
    const slow = slowPicture()
    feedback.begin(slow.shot)
    feedback.text = 'abc'
    const pending = feedback.send(CONTEXT)
    expect(feedback.phase).toBe('sending')
    expect(mock).not.toHaveBeenCalled()
    await slow.arrive(PICTURE)
    await pending
    expect(sent(mock).screenshots).toHaveLength(1)
    expect(feedback.phase).toBe('sent')
  })

  it('sends without the picture when it then cannot be taken', async () => {
    const mock = answer(201, { reference: 3 })
    const feedback = useFeedbackStore()
    const slow = slowPicture()
    feedback.begin(slow.shot)
    feedback.text = 'abc'
    const pending = feedback.send(CONTEXT)
    await slow.arrive(null)
    await pending
    expect(sent(mock).screenshots).toBeUndefined()
    expect(feedback.phase).toBe('sent')
  })

  it('does not wait for the picture when it is unticked', async () => {
    const mock = answer(201, { reference: 3 })
    const feedback = useFeedbackStore()
    feedback.begin(slowPicture().shot)
    feedback.includePicture = false
    feedback.text = 'abc'
    await feedback.send(CONTEXT)
    expect(sent(mock).screenshots).toBeUndefined()
  })

  it('counts a picture that never arrives as one that could not be taken, so Send goes without it', async () => {
    vi.useFakeTimers()
    try {
      const mock = answer(201, { reference: 3 })
      const feedback = useFeedbackStore()
      feedback.begin(slowPicture().shot)
      feedback.text = 'abc'
      const pending = feedback.send(CONTEXT)
      await vi.advanceTimersByTimeAsync(20000)
      await pending
      expect(feedback.pictureState).toBe('failed')
      expect(sent(mock).screenshots).toBeUndefined()
      expect(feedback.phase).toBe('sent')
    } finally {
      vi.useRealTimers()
    }
  })
})
