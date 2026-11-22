/**
 * Beacon's browser client: file a report with one call.
 *
 *   const beacon = createBeacon({ clientId: "retroquest", appVersion: "1.4.2" });
 *   const result = await beacon.report({ type: "bug", title, description });
 *   if (result.ok) show(`Thanks! Reference #${result.reference}`);
 *   else if (result.error.code === "rate_limited") retryIn(result.error.retryAfterSeconds);
 *
 * This file has no imports and no dependencies: copy it into a frontend as it is, and refresh it
 * from https://github.com/rmstdope/beacon/blob/main/src/client.ts. It talks to the `/v1/` API, so
 * an older copy keeps working. Its types are tested against the server's (`test/client.test.ts`).
 */

export const REPORT_TYPES = ['bug', 'enhancement', 'feature'] as const
export type ReportType = (typeof REPORT_TYPES)[number]

export interface BeaconOptions {
  /** The client ID Beacon is configured with for this frontend. */
  clientId: string
  /** Sent with every report, when given. */
  appVersion?: string
  /** Defaults to Beacon's public address. */
  endpoint?: string
  /** Defaults to the browser's `fetch`. */
  fetch?: typeof fetch
}

export interface NewReport {
  type: ReportType
  title: string
  description: string
  /**
   * Up to 3 images (PNG, JPEG or WebP), each at most 2 MB: a `File` from a file input or a pasted
   * image is a `Blob`. Beacon checks the limits and refuses the whole report if one is broken.
   */
  screenshots?: Blob[]
  /**
   * The game's save, at most 512 KB of JSON: its text (sent as UTF-8) or a `Blob`. Beacon stores
   * it exactly as sent and links it from the issue.
   */
  save?: Blob | string
}

/**
 * Every way a report can fail. `message` is developer text from Beacon (or this client): log it,
 * never show it to the reporter verbatim.
 */
export type BeaconError =
  /** `field` is a report field name, `body` or `unknown_key`. */
  | { code: 'invalid_report'; field: string; message: string }
  | { code: 'rate_limited'; retryAfterSeconds: number; message: string }
  | {
      code:
        | 'forbidden'
        | 'too_large'
        | 'unsupported_media_type'
        | 'request_timeout'
        | 'upstream_failed'
        | 'internal'
      message: string
    }
  /** No response: offline, DNS, or the browser refused the cross-origin request. */
  | { code: 'network'; message: string }
  /** A response Beacon's API does not document. */
  | { code: 'unexpected'; status: number; message: string }

export type ReportResult =
  { ok: true; reference: number } | { ok: false; error: BeaconError }

export interface Beacon {
  /** Files one report. Never throws: every outcome is a `ReportResult`. */
  report(report: NewReport): Promise<ReportResult>
}

const DEFAULT_ENDPOINT = 'https://beacon.rmstdope.eu'
const MAX_PAGE_URL = 2_048
const MAX_USER_AGENT = 512
const DEFAULT_RETRY_AFTER_SECONDS = 60
const PLAIN_ERRORS = [
  'forbidden',
  'too_large',
  'unsupported_media_type',
  'request_timeout',
  'upstream_failed',
  'internal',
] as const

/** The browser globals this client reads, reached through `globalThis` so it builds anywhere. */
const browser = globalThis as {
  location?: { href?: string }
  navigator?: { userAgent?: string }
}

/** The page's origin and path: the query and fragment can carry tokens, and the issue may be public. */
function pageUrl(): string | undefined {
  try {
    const url = new URL(browser.location?.href ?? '')
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    const page = url.origin + url.pathname
    return page.length <= MAX_PAGE_URL ? page : undefined
  } catch {
    return undefined
  }
}

/** Base64 of a Blob, encoded in chunks so a 2 MB image does not overflow the argument limit. */
async function base64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let at = 0; at < bytes.length; at += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000))
  }
  return btoa(binary)
}

function retryAfter(header: string | null): number {
  const seconds =
    header !== null && /^\d+$/.test(header.trim()) ? Number(header) : NaN
  return Number.isSafeInteger(seconds) ? seconds : DEFAULT_RETRY_AFTER_SECONDS
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function toResult(response: Response): Promise<ReportResult> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }
  const record = isRecord(body) ? body : {}
  const unexpected = (message: string): ReportResult => ({
    ok: false,
    error: { code: 'unexpected', status: response.status, message },
  })

  if (response.status === 201) {
    const reference = record.reference
    return typeof reference === 'number' &&
      Number.isSafeInteger(reference) &&
      reference > 0
      ? { ok: true, reference }
      : unexpected('201 without a reference')
  }

  const code = record.error
  const message =
    typeof record.message === 'string'
      ? record.message
      : `HTTP ${String(response.status)}`
  if (code === 'invalid_report') {
    const field = typeof record.field === 'string' ? record.field : 'body'
    return { ok: false, error: { code, field, message } }
  }
  if (code === 'rate_limited') {
    return {
      ok: false,
      error: {
        code,
        retryAfterSeconds: retryAfter(response.headers.get('retry-after')),
        message,
      },
    }
  }
  const plain = PLAIN_ERRORS.find((known) => known === code)
  if (plain !== undefined) return { ok: false, error: { code: plain, message } }
  return unexpected(message)
}

/** A beacon client that files reports to the feedback service; every outcome is a result, never an exception. */
export function createBeacon(options: BeaconOptions): Beacon {
  const endpoint = (options.endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, '')
  // Called through globalThis: a bare `fetch` kept on an object throws "Illegal invocation" in browsers.
  const send =
    options.fetch ??
    ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args))

  return {
    async report(report: NewReport): Promise<ReportResult> {
      const page = pageUrl()
      const userAgent = browser.navigator?.userAgent?.slice(0, MAX_USER_AGENT)
      const screenshots: { data: string }[] = []
      for (const [index, blob] of (report.screenshots ?? []).entries()) {
        try {
          screenshots.push({ data: await base64(blob) })
        } catch {
          const message = `screenshots[${String(index + 1)}]: could not be read`
          return {
            ok: false,
            error: { code: 'invalid_report', field: 'screenshots', message },
          }
        }
      }
      let save: { data: string } | undefined
      if (report.save !== undefined) {
        try {
          save = {
            data: await base64(
              typeof report.save === 'string'
                ? new Blob([report.save])
                : report.save,
            ),
          }
        } catch {
          return {
            ok: false,
            error: {
              code: 'invalid_report',
              field: 'save',
              message: 'save: could not be read',
            },
          }
        }
      }
      const body = {
        clientId: options.clientId,
        type: report.type,
        title: report.title,
        description: report.description,
        ...(page === undefined ? {} : { pageUrl: page }),
        ...(options.appVersion === undefined
          ? {}
          : { appVersion: options.appVersion }),
        ...(userAgent ? { userAgent } : {}),
        ...(screenshots.length > 0 ? { screenshots } : {}),
        ...(save === undefined ? {} : { save }),
      }
      let response: Response
      try {
        response = await send(`${endpoint}/v1/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'network',
            message: error instanceof Error ? error.message : 'request failed',
          },
        }
      }
      return toResult(response)
    },
  }
}
