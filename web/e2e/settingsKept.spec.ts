/**
 * RDG-3: a player can choose the text size, a light or dark look and less
 * motion, and the choices are kept between visits.
 */
import { test, expect, openJournal, toTheCottage, type Page } from './fixtures'
import { LANTERN_PALETTES, LANTERN_TEXT_SCALE } from '../src/lantern/tokens'

/** The story text size on a laptop at the medium setting, in px. */
const MEDIUM_STORY_PX = 16

/** Start a new game and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  // With motion on the page rises out of the dark; its button takes focus
  // once it is up.
  await expect(page.locator('.lq-chapter-button')).toBeFocused()
  await page.locator('.lq-chapter-button').click()
}

/** Open Settings from the menu. */
async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
}

/** A `#rrggbb` colour as the browser reports a computed one. */
function rgb(hex: string): string {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${channels.join(', ')})`
}

test('RDG-3: the text size, the look and less motion are chosen in Settings and kept between visits', async ({
  page,
}): Promise<void> => {
  // A device that asks for the dark look and full motion, so that only the
  // player's own choices can give the light look and the still page.
  await page.emulateMedia({
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await start(page)
  await openSettings(page)
  const light = page.getByRole('button', { name: 'Light', exact: true })
  const large = page.getByRole('button', { name: 'Large text', exact: true })
  const still = page.getByRole('switch', { name: 'Reduce motion' })
  await expect(still).toHaveAttribute('aria-checked', 'false')
  await light.click()
  await large.click()
  await still.click()
  await expect(still).toHaveAttribute('aria-checked', 'true')

  // The next visit loads the page afresh and walks on until there is a story
  // in the journal to look at.
  await toTheCottage(page)
  await openJournal(page)

  const story = page.locator('.lq-block-text').first()
  await expect(story).toHaveCSS(
    'font-size',
    `${MEDIUM_STORY_PX * LANTERN_TEXT_SCALE.large}px`,
  )
  await expect(story).toHaveCSS('color', rgb(LANTERN_PALETTES.light.prose))
  await expect(page.locator('html')).toHaveCSS('--lq-motion', '0')

  await page.keyboard.press('Escape')
  await openSettings(page)
  await expect(light).toHaveAttribute('aria-pressed', 'true')
  await expect(large).toHaveAttribute('aria-pressed', 'true')
  await expect(still).toHaveAttribute('aria-checked', 'true')
})
