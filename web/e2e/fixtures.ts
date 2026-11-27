/**
 * The test every spec imports in place of Playwright's own. The story is always
 * told line by line and the narration is only ever silent at volume 0, so a
 * spec that is not about narration would wait on the recordings of every line
 * it reads. This `page` therefore answers each act's narration manifest with an
 * empty one (the game then tells its lines as it does for a line with no
 * recording yet), unless the spec sets the `narrationRecordings` option with
 * `test.use({ narrationRecordings: true })` to get the real recordings.
 *
 * The title page waits for a press before it shows its menu, so this `page`
 * also presses a key for the spec each time the title page appears (as a
 * player would), unless the spec is about the wait and sets the `titleWaits`
 * option with `test.use({ titleWaits: true })`.
 *
 * `E2E_CPU_THROTTLE=<rate>` slows the page's CPU by that factor (Chromium's
 * own throttling), to bring out on a laptop the races a busy CI runner shows:
 * `E2E_CPU_THROTTLE=10 npx playwright test <spec> --repeat-each 10`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test as base, type Page } from '@playwright/test'
import { HOLD_TO_SKIP_MS } from '../src/composables/useHoldToSkip'

export * from '@playwright/test'

/** Playwright's `test`, with the narration recordings withheld unless asked for and the title page pressed past unless the spec waits on it. */
export const test = base.extend<{
  narrationRecordings: boolean
  titleWaits: boolean
}>({
  narrationRecordings: [false, { option: true }],
  titleWaits: [false, { option: true }],
  page: async (
    { page, narrationRecordings, titleWaits },
    use,
  ): Promise<void> => {
    if (!titleWaits)
      await page.addInitScript(() => {
        const press = (): void => {
          if (document.querySelector('.lq-title-page.is-playing'))
            window.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Shift', cancelable: true }),
            )
        }
        new MutationObserver(press).observe(document, {
          childList: true,
          subtree: true,
        })
      })
    if (!narrationRecordings)
      await page.route('**/audio/narration/*/manifest.json', (route) =>
        route.fulfill({ json: {} }),
      )
    else await voiceUnrecordedLines(page)
    const throttle = Number(process.env.E2E_CPU_THROTTLE)
    if (throttle > 1) {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
    }
    await use(page)
  },
})

/** The lines of Act 1 whose wording changed (rq-6is9) and so have no recording yet; the specs that read them aloud still need a voice there. */
const UNRECORDED_ACT1_LINES: readonly string[] = [
  '0cae7f44582e81',
  '07ccfd90396c3a',
  '0dd4a44e45486f',
  '17a70ff3dd4d25',
  '1f0942cb88249f',
  '017329cff1ecf6',
  '16f455f6e3c305',
]

/** The `web/` folder, found from this file so the helpers below work wherever Playwright is started. */
const WEB_DIR = fileURLToPath(new URL('..', import.meta.url))

/**
 * Answer Act 1's narration manifest with the real one plus a stand-in entry
 * (and a stand-in clip) for each line in `UNRECORDED_ACT1_LINES` that has no
 * recording yet, so the game voices it as it will once recorded. An id the
 * real manifest holds keeps its real entry and clip, so the list can be
 * emptied whenever the team has recorded them.
 */
async function voiceUnrecordedLines(page: Page): Promise<void> {
  await page.route('**/audio/narration/act1/manifest.json', async (route) => {
    const response = await route.fetch()
    const manifest = (await response.json()) as Record<string, unknown>
    const script = JSON.parse(
      readFileSync(join(WEB_DIR, '../tts/act1/script.json'), 'utf8'),
    ) as { id: string; speaker: string; text: string }[]
    const missing: string[] = []
    for (const id of UNRECORDED_ACT1_LINES) {
      const line = script.find((entry) => entry.id === id)
      if (!line || id in manifest) continue
      missing.push(id)
      const words = line.text.split(/\s+/)
      manifest[id] = {
        file: `${id}.mp3`,
        speaker: line.speaker,
        duration: words.length * 0.4,
        words: words.map((word, i) => ({
          word,
          start: i * 0.4,
          end: (i + 1) * 0.4,
        })),
      }
    }
    if (missing.length > 0)
      await page.route(
        new RegExp(`/audio/narration/act1/(${missing.join('|')})\\.mp3$`),
        (clip) =>
          clip.fulfill({
            body: readFileSync(
              join(WEB_DIR, 'public/audio/narration/act1/00010af0e27d3f.mp3'),
            ),
            contentType: 'audio/mpeg',
          }),
      )
    await route.fulfill({ json: manifest })
  })
}

/**
 * Show the rest of what is being told at once, as a player does: let go of the
 * command box (a space typed there is a letter), then hold Space until the
 * hold to skip is full, which here it is at once (`holdFilledAtOnce`). Escape
 * no longer skips: it opens the menu.
 */
export async function skipTelling(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await holdFilledAtOnce(
    page,
    () => page.keyboard.down(' '),
    () => page.keyboard.up(' '),
  )
}

/**
 * Press (`press`), have the app's hold to skip come due at once instead of
 * after `HOLD_TO_SKIP_MS`, and let go (`release`): for a spec that only needs
 * a telling out of the way, never one about how long a hold takes. The events
 * and the app's own hold are real; only the first `setTimeout` of exactly that
 * length made during the press, the hold's own, is shortened, so a timer the
 * skip itself starts keeps its time.
 */
export async function holdFilledAtOnce(
  page: Page,
  press: () => Promise<void>,
  release: () => Promise<void>,
): Promise<void> {
  const shortened = await page.evaluateHandle((hold) => {
    const own = window.setTimeout
    const restore = (): void => {
      window.setTimeout = own
    }
    window.setTimeout = ((handler: TimerHandler, ms?: number, ...args) => {
      if (ms !== hold) return own(handler, ms, ...args)
      restore()
      return own(handler, 0, ...args)
    }) as typeof window.setTimeout
    return { restore }
  }, HOLD_TO_SKIP_MS)
  try {
    await press()
    // Queued after the hold's timer and due no sooner, so that one has fired.
    await page.evaluate(
      () => new Promise<void>((resolve) => void setTimeout(resolve, 0)),
    )
  } finally {
    await shortened.evaluate((timers) => timers.restore())
    await shortened.dispose()
    await release()
  }
}

/**
 * Keep the lines on the picture where they are: a line fades away once it has
 * been read, and on a slow CI runner it goes while a spec is still looking at
 * it (rq-vjbs). With no fade animation a line never ends its fade, so it keeps
 * its place and its room. Call it after `page.goto`; not for a spec about the
 * fade.
 */
export async function keepWords(page: Page): Promise<void> {
  await page.addStyleTag({
    content: "[data-fade='away'] { animation: none !important; }",
  })
}

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** What the stood-in image manifest says of the cottage's picture, beyond its file and size. */
export interface CottagePicture {
  areas?: Record<string, object>
  effects?: object[]
  patches?: Record<string, object>
}

/**
 * Open the game and walk the opening to Elior's cottage: its picture up (the
 * studio's files stood in for, with what `picture` says of it) and every word
 * told. Set the viewport first. The walk is made with the motion the spec
 * runs with, the suite's reduced motion unless it says otherwise, so a spec
 * whose own assertion needs motion switches it on once it has arrived.
 */
export async function toTheCottage(
  page: Page,
  picture: CottagePicture = {},
): Promise<void> {
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1920,
          height: 1080,
          ...picture,
        },
      },
    }),
  )
  await page.route('**/images/generated/*.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  // The dream is told over its picture first, a few lines at a time on a small screen.
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  // The voice wakes Elior in his cottage.
  await enterCommand(page, 'say hello to voice')
  await closeTypingBox(page)
  await skipTelling(page)
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  await expect(page.locator('.lq-name-text')).toHaveText("Elior's Cottage")
  await expect(
    page.locator('[data-testid="arrival-on-picture"].lq-on'),
  ).toHaveCount(0)
}

/** Give the page motion back (the suite runs with it reduced), for an assertion that needs it. */
export async function withMotion(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
}

/** The part of the game store the helpers below drive. */
interface GameStoreHandle {
  acceptInput: boolean
  submitCommand(command: string): void
}

/** The app's Vue root, as far as the helpers reach into it. */
interface AppRootElement extends Element {
  __vue_app__?: {
    config: {
      globalProperties: {
        $pinia: { _s: Map<string, GameStoreHandle> }
      }
    }
  }
}

/**
 * Send a command the way a player does: F1 brings up the typing box and the
 * command is typed and sent with Enter (the box stays up for the next one).
 * A phone has no box (it plays by pointing only), so there the command goes
 * straight to the game, once it takes commands.
 */
export async function enterCommand(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  if (!(await input.isVisible())) {
    await page.keyboard.press('F1')
    // A phone has no box; anywhere else a missing box is a failure.
    const phone = await page.evaluate(
      () => matchMedia('(hover: none) and (pointer: coarse)').matches,
    )
    if (!phone) await input.waitFor({ state: 'visible', timeout: 2000 })
  }
  if (await input.isVisible()) {
    await input.fill(command)
    await input.press('Enter')
    return
  }
  await sendToGame(page, command)
}

/**
 * Send a command straight to the game once it takes commands, with no typing
 * box: the phone's way, and a spec's way when the box itself would be in the
 * way (it is something the names keep clear of).
 */
export async function sendToGame(page: Page, command: string): Promise<void> {
  await page.waitForFunction(() => {
    const root = document.querySelector('#app') as AppRootElement | null
    return root?.__vue_app__?.config.globalProperties.$pinia._s.get('game')
      ?.acceptInput
  })
  await page.evaluate((text) => {
    const root = document.querySelector('#app') as AppRootElement | null
    root?.__vue_app__?.config.globalProperties.$pinia._s
      .get('game')
      ?.submitCommand(text)
  }, command)
}

/** Put the typing box away (F1) if it is up, so keys such as B and S reach the page again. */
export async function closeTypingBox(page: Page): Promise<void> {
  if (await page.getByLabel('Command', { exact: true }).isVisible())
    await page.keyboard.press('F1')
}

/** Open the journal (the story so far): the plate's ⟲ Journal on a phone, J anywhere else. */
export async function openJournal(page: Page): Promise<void> {
  const onPlate = page.getByRole('button', { name: /^⟲ Journal/ })
  if (await onPlate.isVisible()) await onPlate.click()
  else await gameKey(page, 'j')
}

/** Press one of the game's own keys (J journal, Q quests, M map…) with focus off any text field. */
export async function gameKey(page: Page, key: string): Promise<void> {
  await page.evaluate(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement && active.matches('input, textarea'))
      active.blur()
  })
  await page.keyboard.press(key)
}

/**
 * Do what brings the marks and names in: a tap at the picture's left edge,
 * halfway down, where the input is touch (on a small sideways phone a tap in
 * the top corner reaches the room's name, which opens its actions), else the
 * mouse moved over the picture (the marks leave 4 seconds after the last such
 * input).
 */
export async function showNames(page: Page): Promise<void> {
  const box = await page.locator('.lq-stage').boundingBox()
  if (!box) throw new Error('no picture stage to show the names over')
  const touch = await page.evaluate(
    () => window.matchMedia('(pointer: coarse)').matches,
  )
  if (touch) {
    await page.touchscreen.tap(box.x + 6, box.y + box.height / 2)
    return
  }
  await page.mouse.move(box.x + 6, box.y + 6)
  await page.mouse.move(box.x + 14, box.y + 10)
}
