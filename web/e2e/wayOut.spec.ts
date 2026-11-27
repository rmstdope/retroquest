/**
 * A way out is pressed in the picture (rq-ezpg.7): a way that is closed right
 * now is plain painting, but pressing where the studio placed it gets the
 * game's own answer, as the typed direction does, and Elior stays.
 */
import { test, expect, toTheCottage } from './fixtures'

test('pressing a closed way in the picture answers as the typed direction does', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  // The room is brought up on the page's clock, stepped rather than slept.
  await page.clock.install()
  await toTheCottage(page, {
    areas: { 'exit-south': { x: 0.8, y: 0.05, width: 0.15, height: 0.2 } },
  })
  const stage = await page.locator('.lq-stage').boundingBox()
  if (!stage) throw new Error('no stage')
  // The way sits at 87% across and 15% down of the 16:9 picture trimmed to the stage.
  const scale = Math.max(stage.width / 1920, stage.height / 1080)
  const px = stage.x + stage.width / 2 + (0.875 - 0.5) * 1920 * scale
  const py = stage.y + stage.height / 2 + (0.15 - 0.5) * 1080 * scale
  // A press while the room is still being brought up only brings it up; the next one goes.
  await page.mouse.click(px, py)
  await page.clock.runFor(2500)
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++) {
    await page.keyboard.press('Enter')
    await page.clock.runFor(400)
  }
  await page.mouse.click(px, py)
  await expect(
    page.getByText(/Grandmother looks up before you reach the door/).first(),
  ).toBeVisible()
  await expect(page.locator('.lq-name-text')).toHaveText("Elior's Cottage")
})
