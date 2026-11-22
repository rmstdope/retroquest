import { describe, expect, it, vi } from 'vitest'
import { createBeacon, type NewReport } from './beacon'

const REPORT: NewReport = { type: 'bug', title: 'Title', description: 'Text' }

/** A beacon whose fetch answers with `response` (or fails when it is an Error). */
function beaconAnswering(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response
    return response
  })
  return {
    fetchMock,
    beacon: createBeacon({
      clientId: 'retroquest',
      appVersion: '1.0',
      fetch: fetchMock as unknown as typeof fetch,
    }),
  }
}
const json = (status: number, body: unknown, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers })

describe('createBeacon', () => {
  it('posts the report with the save as base64 and returns the reference', async () => {
    const { beacon, fetchMock } = beaconAnswering(json(201, { reference: 3 }))
    const result = await beacon.report({ ...REPORT, save: '{"a":1}' })
    expect(result).toEqual({ ok: true, reference: 3 })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe('https://beacon.rmstdope.eu/v1/reports')
    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect(body.save).toEqual({ data: btoa('{"a":1}') })
    expect(body.appVersion).toBe('1.0')
  })

  it('reads the wait from Retry-After, and takes 60 seconds when it is missing', async () => {
    const withHeader = beaconAnswering(
      json(429, { error: 'rate_limited' }, { 'retry-after': '125' }),
    )
    expect(await withHeader.beacon.report(REPORT)).toMatchObject({
      error: { code: 'rate_limited', retryAfterSeconds: 125 },
    })
    const without = beaconAnswering(json(429, { error: 'rate_limited' }))
    expect(await without.beacon.report(REPORT)).toMatchObject({
      error: { code: 'rate_limited', retryAfterSeconds: 60 },
    })
  })

  it('says unexpected for a 201 with no reference and for an unknown error', async () => {
    expect(
      await beaconAnswering(json(201, {})).beacon.report(REPORT),
    ).toMatchObject({ ok: false, error: { code: 'unexpected' } })
    expect(
      await beaconAnswering(json(418, { error: 'teapot' })).beacon.report(
        REPORT,
      ),
    ).toMatchObject({ ok: false, error: { code: 'unexpected', status: 418 } })
  })

  it('gives a network result, never an exception, when the request fails', async () => {
    const { beacon } = beaconAnswering(new TypeError('offline'))
    expect(await beacon.report(REPORT)).toMatchObject({
      ok: false,
      error: { code: 'network' },
    })
  })
})
