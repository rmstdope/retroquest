/**
 * The test every spec imports in place of Playwright's own. The story is always
 * told line by line and the narration is only ever silent at volume 0, so a
 * spec that is not about narration would wait on the recordings of every line
 * it reads. This `page` therefore answers each act's narration manifest with an
 * empty one (the game then tells its lines as it does for a line with no
 * recording yet), unless the spec sets the `narrationRecordings` option with
 * `test.use({ narrationRecordings: true })` to get the real recordings.
 */
import { test as base } from '@playwright/test'

export * from '@playwright/test'

/** Playwright's `test`, with the narration recordings withheld unless asked for. */
export const test = base.extend<{ narrationRecordings: boolean }>({
  narrationRecordings: [false, { option: true }],
  page: async ({ page, narrationRecordings }, use): Promise<void> => {
    if (!narrationRecordings)
      await page.route('**/audio/narration/*/manifest.json', (route) =>
        route.fulfill({ json: {} }),
      )
    await use(page)
  },
})
