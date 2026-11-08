import { test, expect, type Page } from '@playwright/test'

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Walk to the cottage with its picture up (the studio's files stood in for), and the hearth's spot marked. */
async function toTheCottage(page: Page): Promise<void> {
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1,
          height: 1,
          areas: {
            'motion-fire': { x: 0.1, y: 0.4, width: 0.2, height: 0.3 },
          },
        },
      },
    }),
  )
  await page.route('**/images/generated/*.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page
    .getByTestId('arrival-on-picture')
    .click({ position: { x: 200, y: 300 } })
}

/**
 * The rooms move (rq-ezpg.9): the painting drifts and a canvas of movement
 * lies over it, scenery only; with Reduce motion on there is neither.
 */
test('the cottage picture drifts with movement over it, never catching a click', async ({
  page,
}): Promise<void> => {
  await toTheCottage(page)
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
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await toTheCottage(page)
  await expect(page.locator('.lq-stage-picture img.lq-pic-in')).toHaveCount(1)
  await expect(page.locator('.lq-drift-on')).toHaveCount(0)
  await expect(page.locator('canvas.lq-motion')).toHaveCount(0)
})
