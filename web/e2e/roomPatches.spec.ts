import { test, expect } from '@playwright/test'

/** A one-pixel transparent PNG, standing for a picture or a patch the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * The picture keeps up with the story (rq-ezpg.3): once Elior takes the bread
 * in the cottage, the patch the studio made for it is laid over the room's
 * picture. The studio's files are stood in for by a manifest that lists the
 * patch and one-pixel pictures.
 */
test('the bread taken in the cottage is laid over its picture as a patch', async ({
  page,
}): Promise<void> => {
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1,
          height: 1,
          patches: {
            'bread-taken': {
              file: 'act1-eliors-cottage.bread-taken.png',
              width: 1,
              height: 1,
            },
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

  await page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
    .click()
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('say hello to voice')
  await input.press('Enter')
  await page.keyboard.press('Escape')
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  await expect(page.locator('img.lq-patch')).toHaveCount(0)

  await input.fill('take bread')
  await input.press('Enter')
  await expect(page.locator('img.lq-patch')).toHaveCount(1)
  await expect(page.locator('img.lq-patch')).toHaveAttribute(
    'src',
    /act1-eliors-cottage\.bread-taken\.png$/,
  )
})
