/**
 * Words in the narration read whole (rq-v29l.12): neither the narrator's
 * bubbles nor the speech lines let the browser break a word with a hyphen
 * of its own ('ap-pears', 'be-fore'), at a laptop width and on a phone.
 */
import {
  test,
  expect,
  type Page,
  skipTelling,
  enterCommand as enter,
} from './fixtures'

/** The `hyphens` value of every element inside the matched bubbles and lines. */
async function hyphenation(page: Page, selector: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const values: string[] = []
    for (const root of Array.from(document.querySelectorAll(sel)))
      for (const el of [root, ...Array.from(root.querySelectorAll('*'))])
        values.push(getComputedStyle(el).hyphens)
    return values
  }, selector)
}

for (const { name, width, height } of [
  { name: 'laptop', width: 1440, height: 800 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`on a ${name} no bubble or speech line hyphenates a word`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    await enter(page, 'talk to voice')
    await skipTelling(page)
    await enter(page, 'look')
    await enter(page, 'talk to grandmother')
    await expect(page.locator('.lq-block-text').first()).toBeAttached()

    const values = await hyphenation(
      page,
      '.lq-block-text, .lq-quote, [data-testid="speech-line"]',
    )
    expect(values.length).toBeGreaterThan(0)
    expect(values.filter((v) => v === 'auto')).toEqual([])
  })
}
