/**
 * A way out is pressed in the picture (rq-ezpg.7): a way that is closed right
 * now is plain painting, but pressing where the studio placed it gets the
 * game's own answer, as the typed direction does, and Elior stays.
 */
import { test, expect, type Page } from './fixtures'

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Open the game in the cottage with its picture up and a few things placed on it. */
async function toTheCottage(page: Page): Promise<void> {
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1920,
          height: 1080,
          areas: {
            'exit-south': { x: 0.8, y: 0.05, width: 0.15, height: 0.2 },
          },
        },
      },
    }),
  )
  await page.route('**/images/generated/*.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  // The dream is told a few lines at a time on a small screen.
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  // The voice wakes Elior in his cottage.
  await page
    .getByRole('region', { name: /^Action/ })
    .getByRole('button', { name: /^(Type|Type a command)$/ })
    .click()
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('say hello to voice')
  await input.press('Enter')
  await page.keyboard.press('Escape')
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  await expect(page.locator('.lq-room-name')).toHaveText("Elior's Cottage")
}

test('pressing a closed way in the picture answers as the typed direction does', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const stage = await page.locator('.lq-stage').boundingBox()
  if (!stage) throw new Error('no stage')
  // The way sits at 87% across and 15% down of the 16:9 picture trimmed to the stage.
  const scale = Math.max(stage.width / 1920, stage.height / 1080)
  const px = stage.x + stage.width / 2 + (0.875 - 0.5) * 1920 * scale
  const py = stage.y + stage.height / 2 + (0.15 - 0.5) * 1080 * scale
  // A press while the room is still being brought up only brings it up; the next one goes.
  await page.mouse.click(px, py)
  await page.waitForTimeout(2500)
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
  }
  await page.mouse.click(px, py)
  await expect(
    page.getByText(/Grandmother looks up from the hearth/).first(),
  ).toBeVisible()
  await expect(page.locator('.lq-room-name')).toHaveText("Elior's Cottage")
})
