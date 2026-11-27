import { test, expect, type Page, toTheCottage, withMotion } from './fixtures'

/** Stand in the cottage with the hearth's spot marked on its picture. */
async function toTheHearth(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page, {
    effects: [
      {
        kind: 'fire',
        spot: [
          [
            [0.1, 0.4],
            [0.3, 0.4],
            [0.3, 0.7],
            [0.1, 0.7],
          ],
        ],
      },
    ],
  })
}

/**
 * The rooms move (rq-ezpg.9): the painting drifts and a canvas of movement
 * lies over it, scenery only; with Reduce motion on there is neither.
 */
test('the cottage picture drifts with movement over it, never catching a click', async ({
  page,
}): Promise<void> => {
  await toTheHearth(page)
  await withMotion(page)
  await expect(page.locator('.lq-drift.lq-drift-on')).toHaveCount(1)
  const canvas = page.locator('canvas.lq-motion')
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toHaveAttribute('aria-hidden', 'true')
  await expect(canvas).toHaveCSS('pointer-events', 'none')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  const onTop = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.tagName ?? '',
    { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
  )
  expect(onTop).not.toBe('CANVAS')
})

test('with the device asking for less motion the cottage is just the painting', async ({
  page,
}): Promise<void> => {
  await toTheHearth(page)
  await expect(page.locator('.lq-stage-picture img.lq-pic-in')).toHaveCount(1)
  await expect(page.locator('.lq-drift-on')).toHaveCount(0)
  await expect(page.locator('canvas.lq-motion')).toHaveCount(0)
})
