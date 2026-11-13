import { test, expect, type Page } from './fixtures'

/**
 * Answering the voice ends the dream (rq-uqp8): the answer is told the way
 * every scene is on the laptop stage, the narrator's paragraphs on the left
 * card and the voice's line on the right as speech, over the dream. Then the
 * room changes to Elior's Cottage, what was told in the dream leaves the
 * screen, the waking is told on the left and the cottage's description in the
 * middle. The closing line "You are in Elior's Cottage." is only in Story so
 * far.
 */

/** Open the game on a laptop with narration at volume 0, past the dream's own arrival. */
async function startInDream(page: Page): Promise<void> {
  await page.addInitScript(() =>
    localStorage.setItem('retroquest_settings', '{"narrationVolume":0}'),
  )
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  // The dream's own arrival is told in the middle first.
  await page.keyboard.press('Escape')
  await page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
    .click()
}

/** Type a command. */
async function enter(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  await input.fill(command)
  await input.press('Enter')
}

for (const command of ['talk to voice', 'say who are you to voice']) {
  test(`"${command}" tells the narrator left, the voice right and the room in the middle`, async ({
    page,
  }): Promise<void> => {
    await startInDream(page)
    await enter(page, command)
    const card = page.locator('.lq-story-wrap.lq-cards')
    const voice = page.locator('.lq-line-right')

    // Over the dream: the narrator left, the voice right.
    await expect(card).toContainText('The whisper comes once more')
    await expect(voice).toContainText('let them rest')
    await expect(voice).toContainText('Elior.')

    const middle = page.getByTestId('arrival-on-picture')
    await expect(middle).toContainText('A modest cottage')
    await expect(middle.locator('.lq-arrival-text')).not.toContainText(
      'You are in',
    )
    await expect(middle).not.toContainText('The whisper comes once more')
    await expect(middle).not.toContainText('let them rest')

    // In the cottage only the waking is left on the card.
    await page.keyboard.press('Escape')
    await expect(card).toContainText('The dark lets go of you')
    await expect(card).not.toContainText('The whisper comes once more')
    await expect(card).not.toContainText('let them rest')
    await expect(card).not.toContainText('You are in')
    await expect(voice).toHaveCount(0)

    // Story so far keeps every line, the command and the closing one too.
    await page.getByRole('button', { name: /Story so far/ }).click()
    const record = page.getByRole('complementary', {
      name: 'Story so far drawer',
    })
    await expect(record).toContainText(`› ${command}`)
    await expect(record).toContainText('The whisper comes once more')
    await expect(record).toContainText("You are in Elior's Cottage.")
  })
}
