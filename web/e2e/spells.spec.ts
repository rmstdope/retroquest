/**
 * STY-4 at system level: in a real game on the production build, a spell cast
 * before it is learned is refused; the story then teaches it (Mira, along Act
 * I's golden path) and the same spell, typed again, works.
 */
import { test, expect, enterCommand, sendToGame } from './fixtures'
import { ACT1_GOLDEN } from '../src/act1/Act1GoldenPath'

/** The golden path's first cast of a spell Mira teaches: the one the test types itself. */
const FIRST_CAST = 'cast unlock on mysterious box'

test('STY-4: a spell is refused before it is learned, and casts once the story has taught it', async ({
  page,
}) => {
  const castAt = ACT1_GOLDEN.commands.indexOf(FIRST_CAST)
  expect(castAt).toBeGreaterThan(0)
  const picture = page.locator('main')
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()

  await enterCommand(page, 'cast unlock')
  await expect(
    picture.getByText("You don't know any spell called 'unlock'."),
  ).toBeVisible()

  // The way there, sent as a player's commands but without the typing box.
  for (const command of ACT1_GOLDEN.commands.slice(0, castAt))
    await sendToGame(page, command)
  await expect(
    page.getByRole('log').getByText('You have learned Heal, Unlock and Light.'),
  ).toBeAttached()

  await enterCommand(page, FIRST_CAST)
  await expect(
    picture.getByText('A soft click is heard from the Mysterious Box'),
  ).toBeVisible()
})
