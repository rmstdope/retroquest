/**
 * The speaking rule beside the words: the yellow line drawn at the left edge
 * of the block being read must never cover a letter of that block, and must
 * not move the words when it appears. Checked on the opening chapter page and
 * on the first room's description, on desktop and on a phone.
 */
import { test, expect, type Locator, type Page } from '@playwright/test'

/** Where the rule ends and where the first letter starts, in page pixels. */
interface RuleGeometry {
  /** The right edge of the rule (the block's left edge plus the rule width). */
  ruleRight: number
  /** The left edge of the leftmost glyph in the block. */
  textLeft: number
}

/** Light the rule on a block and measure it against the block's words. */
async function measure(block: Locator): Promise<RuleGeometry> {
  return block.evaluate((el) => {
    el.classList.add('lq-speaking')
    const style = getComputedStyle(el)
    const ruleWidth = parseFloat(
      style.getPropertyValue('--lq-rule-width') || '2px',
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
    return {
      ruleRight: el.getBoundingClientRect().left + ruleWidth,
      textLeft,
    }
  })
}

/** The left edge of the block's leftmost glyph, with the rule off. */
async function textLeftUnlit(block: Locator): Promise<number> {
  return block.evaluate((el) => {
    el.classList.remove('lq-speaking')
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let left = Infinity
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of Array.from(range.getClientRects())) {
        if (r.width > 0) left = Math.min(left, r.left)
      }
    }
    return left
  })
}

/** The rule covers no letter, and lighting it leaves the words in place. */
async function expectRuleBesideText(block: Locator): Promise<void> {
  await expect(block).toBeVisible()
  const before = await textLeftUnlit(block)
  const lit = await measure(block)
  expect(lit.textLeft).toBeGreaterThanOrEqual(lit.ruleRight)
  expect(Math.abs(lit.textLeft - before)).toBeLessThan(0.5)
}

/** Open the game on its first chapter page. */
async function openChapter(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.locator('.lq-chapter-block').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
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
  })
}
