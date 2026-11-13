import { test, expect, type Page } from './fixtures'

/**
 * Answering the voice ends the dream (rq-uqp8): the answer is told the way
 * every scene is on the laptop stage, the narrator's paragraphs on the left
 * card and the voice's line on the right as speech, over the dream. Then the
 * dream fades out, what was told in it leaves the screen, and the waking is
 * told in the middle of the dark; once it is read it fades, the cottage rises
 * and its name and description are told in the middle. The waking is never on
 * the cards. The closing line "You are in Elior's Cottage." is only in Story
 * so far.
 */

/** Open the game on a laptop with narration at volume 0, past the dream's own arrival. */
async function startInDream(page: Page): Promise<void> {
  await page.addInitScript(() =>
    localStorage.setItem('retroquest_settings', '{"narrationVolume":0}'),
  )
  await page.setViewportSize({ width: 1440, height: 800 })
  // The waking is told in the dark of a change of scene, which the suite's reduced motion skips.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
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
    test.setTimeout(60_000)
    await startInDream(page)
    await enter(page, command)
    const card = page.locator('.lq-story-wrap.lq-cards')
    const voice = page.locator('.lq-line-right')

    // Over the dream: the narrator left, the voice right.
    await expect(card).toContainText('The whisper comes once more')
    await expect(voice).toContainText('let them rest')
    await expect(voice).toContainText('Elior.')

    // In the dark: the waking in the middle, nothing on the cards or of the cottage.
    const interlude = page.getByTestId('scene-interlude')
    await expect(interlude).toContainText('The dark lets go of you')
    await expect(page.locator('.lq-stage-picture.lq-scene-dark')).toHaveCount(1)
    await expect(card).not.toContainText('The dark lets go of you')
    await expect(
      page.locator('[data-testid="arrival-on-picture"].lq-on'),
    ).toHaveCount(0)

    // Once it is read the cottage rises, its room told in the middle.
    const middle = page.getByTestId('arrival-on-picture')
    await expect(middle).toContainText('A modest cottage', { timeout: 30_000 })
    await expect(interlude).toHaveCount(0)
    await expect(middle.locator('.lq-arrival-text')).not.toContainText(
      'You are in',
    )
    await expect(middle).not.toContainText('The whisper comes once more')
    await expect(middle).not.toContainText('let them rest')

    // In the cottage nothing of the dream, nor the waking, is left on the cards.
    await page.keyboard.press('Escape')
    await expect(card).not.toContainText('The dark lets go of you')
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
    await expect(record).toContainText('The dark lets go of you')
    await expect(record).toContainText("You are in Elior's Cottage.")
  })
}
