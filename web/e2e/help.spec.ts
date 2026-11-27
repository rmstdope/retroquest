/**
 * HLP-1: Help lists every command the game accepts. The expected commands are
 * the engine's own grammar, the list its parser reads the verbs from.
 */
import { test, expect, enterCommand } from './fixtures'
import { VERB_FORMS } from '../src/engine/Grammar'

/**
 * The grammar's verbs that no entry of the shown command list starts with. The
 * list is what follows "Available Commands:", up to the Narration section the
 * Help window adds after it. An entry is a verb, bare or followed by what it
 * takes, so a verb that only turns up inside prose does not count.
 */
function unlisted(shown: string): string[] {
  const list = (shown.split('Available Commands:')[1] ?? '').split(
    'Narration:',
  )[0]
  const entries = list
    .split('\n')
    .flatMap((line) => line.split(/, |\(e\.g\., /))
    .map((entry) => entry.split(/ [<[]/)[0].trim())
  return VERB_FORMS.flatMap((form) => form.verbs).filter(
    (verb) => !entries.includes(verb),
  )
}

test('HLP-1: Help, from the menu or by typing help, lists every command the game accepts', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Help', exact: true }).click()
  const help = page.getByRole('dialog', { name: 'Help' })
  await expect(help).toContainText('Available Commands:')
  expect(unlisted(await help.innerText())).toEqual([])

  // Back to the menu, then to the game.
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await enterCommand(page, 'help')
  const answer = page.getByTestId('turn').last()
  await expect(answer).toContainText('Available Commands:')
  expect(unlisted(await answer.innerText())).toEqual([])
})
