import { test, expect } from '@playwright/test'

/**
 * Hurrying past a change of scene on the phone's picture stage (rq-dxpb): a
 * command folds the actions sheet and puts focus on the bar's Actions, so the
 * next Enter lands there; during the change it brings the new room up and
 * leaves the sheet folded.
 */
test('on a phone an Enter during a change of scene brings the room up and leaves the actions folded', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page
    .getByTestId('arrival-on-picture')
    .click({ position: { x: 200, y: 300 } })

  await page.getByRole('button', { name: 'Type a command' }).click()
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('say hello to voice')
  await input.press('Enter')
  // The change of scene is under way, and the sheet has folded.
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(0)
  await expect(page.locator('.lq-scrim')).toHaveCount(0)

  await page.keyboard.press('Enter')

  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  await expect(
    page.getByRole('region', { name: 'Current location' }),
  ).not.toContainText('The Dream')
  await expect(page.locator('.lq-scrim')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Actions' })).toBeHidden()
})
