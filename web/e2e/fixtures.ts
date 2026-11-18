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
import { test as base, type Page } from '@playwright/test'

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
    const throttle = Number(process.env.E2E_CPU_THROTTLE)
    if (throttle > 1) {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
    }
    await use(page)
  },
})

/**
 * Show the rest of what is being told at once, as a player does: let go of the
 * command box (a space typed there is a letter), then hold Space until the
 * hold to skip is full. Escape no longer skips: it opens the menu.
 */
export async function skipTelling(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down(' ')
  await page.waitForTimeout(HOLD_TO_SKIP_MS + 150)
  await page.keyboard.up(' ')
}

/** How long Space is held to skip a telling (the app's `HOLD_TO_SKIP_MS`, with a margin kept by the helper). */
const HOLD_TO_SKIP_MS = 700

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
