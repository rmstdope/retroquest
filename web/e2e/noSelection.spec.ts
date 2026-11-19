/**
 * Nothing in the game can be selected (rq-0hfk): a click, double-click,
 * triple-click or drag on the room picture, the interface, the story text or
 * the Story so far drawer leaves no blue selection behind. The command box is
 * the one exception and keeps working as a text field.
 */
import {
  test,
  expect,
  type Locator,
  type Page,
  enterCommand,
  openJournal,
} from './fixtures'

/** Start a new game and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.locator('.lq-chapter-button')).toBeFocused({
    timeout: 6000,
  })
  await page.locator('.lq-chapter-button').click()
}

/** Whether the page holds a selection a player would see painted blue. */
async function selectionShows(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const selection = window.getSelection()
    return !!selection && selection.rangeCount > 0 && !selection.isCollapsed
  })
}

/** Click, double-click, triple-click and drag across an element, checking after each that nothing got selected. */
async function expectUnselectable(page: Page, target: Locator): Promise<void> {
  await expect(target).toBeVisible()
  const box = await target.boundingBox()
  if (!box) throw new Error('nothing to click on')
  const x = box.x + box.width / 2
  const y = box.y + Math.min(box.height / 2, 12)
  for (const clickCount of [1, 2, 3]) {
    await page.mouse.click(x, y, { clickCount })
    expect(await selectionShows(page), `${clickCount} click(s)`).toBe(false)
    await page.evaluate(() => window.getSelection()?.removeAllRanges())
  }
  await page.mouse.move(box.x + 4, box.y + 4)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4, {
    steps: 8,
  })
  await page.mouse.up()
  expect(await selectionShows(page), 'drag').toBe(false)
}

test('the picture, the interface and the story cannot be selected', async ({
  page,
}) => {
  await start(page)
  await expectUnselectable(page, page.locator('.lq-stage-picture'))
  await expectUnselectable(page, page.locator('.lq-speech-zone'))
  await enterCommand(page, 'look')
  await openJournal(page)
  const drawer = page.getByRole('complementary', { name: 'Journal drawer' })
  // The story told in the drawer: the arrival and the look, whatever the presses on the picture did.
  await expectUnselectable(page, drawer.locator('article p').first())
  await page.mouse.click(5, 5, { clickCount: 3 })
  expect(await selectionShows(page), 'triple-click on the page').toBe(false)
})

/**
 * Typing, selecting and editing in the command box still work. Chromium keeps
 * an input selectable even under a `user-select: none` page, so this guards
 * the typing in CI; the base stylesheet's `user-select: text` on inputs is for
 * WebKit (Safari), which CI does not run.
 */
test('the command box still takes typing and editing', async ({ page }) => {
  await start(page)
  await enterCommand(page, 'look')
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('look at bed')
  await input.press('Home')
  await input.press('Shift+End')
  const selected = await input.evaluate((el: HTMLInputElement) =>
    el.value.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0),
  )
  expect(selected).toBe('look at bed')
  await input.press('Backspace')
  await input.pressSequentially('north')
  await expect(input).toHaveValue('north')
})
