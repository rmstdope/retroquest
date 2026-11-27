/**
 * STY-2: A player plays by typing commands. A command the game does not
 * understand is answered in words and changes nothing: the room, the belt and
 * the quests are as they were.
 */
import {
  test,
  expect,
  enterCommand,
  gameKey,
  skipTelling,
  toTheCottage,
  type Page,
} from './fixtures'

/** Where the player stands, what the belt carries, and what the quests say. */
async function gameAsShown(page: Page): Promise<{
  room: string
  belt: string[]
  quests: string
  log: string
}> {
  const room = await page.locator('.lq-name-text').innerText()
  const belt = await page
    .locator('[data-belt-pic]')
    .evaluateAll((pictures) =>
      pictures.map((picture) => picture.getAttribute('data-belt-pic') ?? ''),
    )

  await gameKey(page, 'q')
  const drawer = page.getByRole('complementary', { name: 'Quests drawer' })
  await expect(drawer.locator('[data-quest]')).not.toHaveCount(0)
  const quests = await drawer.innerText()
  await drawer.locator('[data-quest]').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const log = await dialog.innerText()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await gameKey(page, 'q')
  await expect(drawer).toHaveCount(0)

  return { room, belt, quests, log }
}

test('STY-2: a command the game does not understand is answered in words and changes nothing', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  // Something on the belt and a quest under way, so there is something to keep.
  await enterCommand(page, 'take bread')
  await expect(page.locator('[data-belt-pic="item:bread"]')).toBeVisible()
  await skipTelling(page)
  await enterCommand(page, 'talk to grandmother')
  await skipTelling(page)
  const before = await gameAsShown(page)

  await enterCommand(page, 'juggle the moon')
  await expect(page.getByTestId('turn').last()).toContainText(
    "I don't understand the command: 'juggle the moon'.",
  )
  await skipTelling(page)

  expect(await gameAsShown(page)).toEqual(before)
})
