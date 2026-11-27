/**
 * STY-3 at system level: in a real game on the production build, Act I's golden
 * path is walked with one step left out, the reading of mother's letter, so the
 * side quest "The faded photograph" stays open. Its quest log moves on, the map
 * refuses to complete the main quest, `hint` nudges in the game's voice, and
 * once the letter is read the same map completes the act.
 */
import {
  test,
  expect,
  enterCommand,
  gameKey,
  sendToGame,
  skipTelling,
  type Locator,
  type Page,
} from './fixtures'
import {
  ACT1_COMPLETING_COMMANDS,
  ACT1_GOLDEN,
} from '../src/act1/Act1GoldenPath'

/** The side quest the walk leaves open. */
const SIDE_QUEST = 'The faded photograph'

/** The main quest of Act I. */
const MAIN_QUEST = 'Shadows over Willowbrook'

/** The golden path's step that completes the side quest: the one left out. */
const LAST_STEP = 'examine letter'

/** The side quest's entry once the line on the photograph's back is read. */
const EARLY_ENTRY = 'seek the truth where the river bends'

/** The side quest's entry once the letter is found and not yet read. */
const LATE_ENTRY = 'You have not read it yet.'

/** Open the quests drawer, hand it to `look`, and put it away again. */
async function inQuests(
  page: Page,
  look: (drawer: Locator) => Promise<void>,
): Promise<void> {
  await skipTelling(page)
  await gameKey(page, 'q')
  const drawer = page.getByRole('complementary', { name: 'Quests drawer' })
  await expect(drawer).toBeVisible()
  await look(drawer)
  await gameKey(page, 'q')
  await expect(drawer).toHaveCount(0)
}

/** Open one quest's log from the drawer, hand it to `read`, and close it. */
async function inQuestLog(
  page: Page,
  quest: string,
  read: (log: Locator) => Promise<void>,
): Promise<void> {
  await inQuests(page, async (drawer) => {
    await drawer.locator(`[data-quest="${quest}"]`).click()
    const log = page.getByRole('dialog')
    await read(log)
    await page.keyboard.press('Escape')
    await expect(log).toHaveCount(0)
  })
}

test("STY-3: the main quest waits for an open side quest, the quest's log moves on and hint nudges", async ({
  page,
}): Promise<void> => {
  test.setTimeout(120_000)
  const steps = ACT1_GOLDEN.commands.filter((command) => command !== LAST_STEP)
  expect(steps).toHaveLength(ACT1_GOLDEN.commands.length - 1)
  const early = steps.indexOf('examine faded photograph') + 1
  const late = steps.indexOf('take letter') + 1
  expect(early).toBeGreaterThan(0)
  expect(late).toBeGreaterThan(early)
  /** Send part of the walk as a player's commands, without the typing box. */
  const walk = async (from: number, to?: number): Promise<void> => {
    for (const command of steps.slice(from, to))
      await sendToGame(page, command)
  }
  const newest = page.getByTestId('turn').last()

  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()

  await walk(0, early)
  await inQuestLog(page, SIDE_QUEST, async (log) => {
    await expect(log.locator('.lq-latest')).toContainText(EARLY_ENTRY)
  })

  await walk(early, late)
  await inQuestLog(page, SIDE_QUEST, async (log) => {
    await expect(log.locator('.lq-latest')).toContainText(LATE_ENTRY)
    await log.getByRole('button', { name: /^Earlier entries/ }).click()
    await expect(log.locator('.lq-timeline')).toContainText(EARLY_ENTRY)
  })

  // To the Road to Greendale with the letter still unread: the map refuses.
  await walk(late)
  for (const command of ACT1_COMPLETING_COMMANDS)
    await enterCommand(page, command)
  await expect(newest).toContainText(
    'The hidden road will not show itself while something here is unfinished: ' +
      'the tasks you began in the village.',
  )
  await expect(page.locator('.lq-chapter')).toHaveCount(0)
  await inQuests(page, async (drawer) => {
    await expect(drawer.locator(`[data-quest="${MAIN_QUEST}"]`)).toContainText(
      'Main',
    )
    await expect(
      drawer.locator(`[data-quest="${MAIN_QUEST}"]`),
    ).not.toContainText('Done')
  })

  await enterCommand(page, 'hint')
  await expect(newest).toContainText('You stop and think over what you know.')
  await expect(newest).toContainText(
    `${MAIN_QUEST}: The amulet is yours, but Willowbrook still holds you: ` +
      'something you began here is unfinished.',
  )
  await expect(newest).toContainText(`${SIDE_QUEST}: `)
  await expect(newest).toContainText(LATE_ENTRY)

  // With the side quest done, the same map completes the main quest.
  await skipTelling(page)
  await enterCommand(page, LAST_STEP)
  await skipTelling(page)
  for (const command of ACT1_COMPLETING_COMMANDS)
    await enterCommand(page, command)
  await expect(
    page.getByRole('log').getByText('revealing a hidden path'),
  ).toBeAttached()
  await expect(page.locator('.lq-chapter')).toBeVisible()
})
