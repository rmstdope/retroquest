/**
 * The speaking rule beside the words: the yellow line drawn at the left edge
 * of the block being read must never cover a letter of that block, must not
 * be clipped away by the pane that scrolls it, and must not move the words
 * when it appears. Checked on the opening chapter page, on the first room's
 * description and on a plain narrated paragraph, on desktop and on a phone.
 */
import { test, expect, type Locator, type Page } from '@playwright/test'

/** Where the rule is, what may clip it, and where the words start. */
interface RuleGeometry {
  /** The left edge of the rule (the block's left edge). */
  ruleLeft: number
  /** The right edge of the rule (the block's left edge plus the rule width). */
  ruleRight: number
  /** The left edge of the nearest ancestor that clips sideways. */
  clipLeft: number
  /** The left edge of the leftmost glyph in the block. */
  textLeft: number
}

/** Light the rule on a block, or put it out, and measure it against the words. */
async function measure(block: Locator, lit: boolean): Promise<RuleGeometry> {
  return block.evaluate((el, on) => {
    el.classList.toggle('lq-speaking', on)
    const ruleWidth = parseFloat(
      getComputedStyle(el).getPropertyValue('--lq-rule-width') || '2px',
    )
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let textLeft = Infinity
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of Array.from(range.getClientRects())) {
        if (r.width > 0) textLeft = Math.min(textLeft, r.left)
      }
    }
    let clip = el.parentElement
    while (clip && getComputedStyle(clip).overflowX === 'visible')
      clip = clip.parentElement
    const ruleLeft = el.getBoundingClientRect().left
    return {
      ruleLeft,
      ruleRight: ruleLeft + ruleWidth,
      clipLeft: clip ? clip.getBoundingClientRect().left : 0,
      textLeft,
    }
  }, lit)
}

/** The rule shows, covers no letter, and lighting it leaves the words in place. */
async function expectRuleBesideText(block: Locator): Promise<void> {
  await expect(block).toBeVisible()
  const before = await measure(block, false)
  const lit = await measure(block, true)
  expect(lit.ruleLeft).toBeGreaterThanOrEqual(lit.clipLeft)
  expect(lit.textLeft).toBeGreaterThanOrEqual(lit.ruleRight)
  expect(Math.abs(lit.textLeft - before.textLeft)).toBeLessThan(0.5)
}

/** Open the game on its first chapter page. */
async function openChapter(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.locator('.lq-chapter-block').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

/** Close the chapter page and type one command, on desktop or phone. */
async function type(page: Page, command: string): Promise<void> {
  await page.locator('.lq-chapter-button').click()
  await page
    .getByRole('button', { name: /^Type( a command)?$/ })
    .first()
    .click()
  const input = page.getByLabel('Command')
  await input.fill(command)
  await input.press('Enter')
}

for (const width of [1280, 360]) {
  test.describe(`at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
    })

    test('the rule sits beside a chapter paragraph', async ({ page }) => {
      await openChapter(page)
      const blocks = page.locator('.lq-chapter-body .lq-chapter-block')
      for (let i = 0; i < (await blocks.count()); i++)
        await expectRuleBesideText(blocks.nth(i))
    })

    test('the rule sits beside the room description', async ({ page }) => {
      await openChapter(page)
      await page.locator('.lq-chapter-button').click()
      // The opening turn arrives in the first room, description and all.
      const arrival = page.getByTestId('turn').first().locator('.lq-arrival')
      await expectRuleBesideText(arrival)
    })

    test('the rule sits beside a narrated paragraph', async ({ page }) => {
      await openChapter(page)
      await type(page, 'talk to voice')
      const paragraph = page
        .getByTestId('turn')
        .last()
        .locator('.lq-block-text')
        .first()
      await expectRuleBesideText(paragraph)
    })
  })
}
