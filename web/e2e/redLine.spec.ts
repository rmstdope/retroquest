/**
 * The red line, end to end: one playthrough in the browser that follows the
 * golden path from the start of Act I to the Willowbrook epilogue and checks
 * the beats of the Red Line table in design/GameStory.md: the amulet, the
 * dream voice and the refrain in each act, and the withered field that is
 * green again. Each act is played with the dev server's `debug act<N>` command
 * (the act's golden path), then finished with the act's completing commands.
 */
import { test, expect, type Page } from '@playwright/test'
import { ACT1_COMPLETING_COMMANDS } from '../src/act1/Act1GoldenPath'
import { ACT2_COMPLETING_COMMANDS } from '../src/act2/Act2GoldenPath'
import { ACT3_COMPLETING_COMMANDS } from '../src/act3/Act3GoldenPath'

/** One beat of the red line: what a player reads, and a phrase that proves it. */
interface Beat {
  /** The row of the Red Line table in design/GameStory.md, in words. */
  name: string
  /** A verbatim excerpt of the game's text that carries the beat. */
  text: string
}

/** What the player has to do in one act, and the beats that act must show. */
interface ActPlay {
  /** The act's header in the browser. */
  header: string
  /** What the debug command answers when the golden path played as expected. */
  played: RegExp
  /** Commands typed after the act's golden path to complete the act. */
  completing: string[]
  /** The beats, read from the story the player has on screen at the act's end. */
  beats: Beat[]
}

/** The refrain, as every act says it. */
const REFRAIN = 'Power follows purpose; purpose follows truth.'

/** The dream voice's words from the second and third acts' visions. */
const DREAM_VOICE_ACT2 = 'Elior… how you have grown. Do not be afraid of me.'

/**
 * The four acts of the red line, in order. The story keeps only its newest 200
 * turns (`MAX_TURNS` in the game store) and Act I's golden path is 181
 * commands, so Act I has little room left before its early beats scroll away.
 */
const ACTS: ActPlay[] = [
  {
    header: 'Act I',
    played: /Debug script 'act1' played \d+ commands/,
    completing: ACT1_COMPLETING_COMMANDS,
    beats: [
      {
        name: 'Act I dream voice: the three words in the opening dream',
        text: '…and let them rest… Then your name, and the dark lets go of you.',
      },
      {
        name: 'Act I amulet: Mira gives it to him',
        text: 'She presents you with the ancient amulet.',
      },
      {
        name: 'Act I refrain: carved on the moss-covered stone',
        text: `Carved beneath the runes, in a plainer hand, are words you can read:\n\n${REFRAIN}`,
      },
      {
        name: 'Act I revelation: the amulet was his parents',
        text: "This was theirs, you know. Aren and Lysa's.",
      },
    ],
  },
  {
    header: 'Act II',
    played: /Debug script 'act2' played \d+ commands/,
    completing: ACT2_COMPLETING_COMMANDS,
    beats: [
      {
        name: 'Act II amulet: Cedric recognises it',
        text: 'it is the mark of the Wardens of the Dawn',
      },
      {
        name: 'Act II dream voice: heard once',
        text: DREAM_VOICE_ACT2,
      },
      {
        name: 'Act II refrain: spoken by Nyx',
        text: `"Remember the old words, Elior: ${REFRAIN}"`,
      },
    ],
  },
  {
    header: 'Act III',
    played: /Debug script 'act3' played \d+ commands/,
    completing: ACT3_COMPLETING_COMMANDS,
    beats: [
      {
        name: 'Act III amulet: an anchor of the ward',
        text: 'It is anchored in the amulet you carry',
      },
      {
        name: 'Act III dream voice: heard once',
        text: 'Elior… little one. Help me. I cannot hold it shut alone.',
      },
      {
        name: 'Act III refrain: echoed by the Dragon',
        text: `carved wherever they worked: ${REFRAIN}`,
      },
    ],
  },
  {
    header: 'Act IV',
    played: /Debug script 'act4' stopped at line \d+: the act ended\./,
    completing: [],
    beats: [
      {
        name: 'Act IV dream voice: the Shadow of the Past',
        text: 'It is the voice from your dream, the one that called your name on the stormy night in Willowbrook',
      },
      {
        name: 'Act IV refrain: said by Elior to Malakar',
        text: "The words from the stone in Willowbrook, from Nyx, from the Dragon's hall. They are yours now.",
      },
      {
        name: 'Act IV amulet: used in the final choice',
        text: 'The amulet opens in your hand like a flower',
      },
      {
        name: 'Epilogue: the withered field is green again',
        text: 'Green runs out from your fingers along the rows.',
      },
    ],
  },
]

/** Open the game from the title page and wait for the loaded game. */
async function startGame(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
}

/**
 * Close every chapter page until the act `header` is on screen,
 * collecting the text of the chapter pages on the way. Waits for the next page
 * to show instead of sleeping, so a slow machine only makes it wait longer.
 */
async function readPages(page: Page, header: string): Promise<string[]> {
  const pages: string[] = []
  const chapterButton = page.locator('.lq-chapter-button')
  const actHeader = page.getByTestId('act')
  for (;;) {
    if (await chapterButton.isVisible()) {
      pages.push(await page.locator('.lq-chapter').innerText())
      await chapterButton.click()
    } else if ((await actHeader.textContent()) === header) {
      return pages
    } else {
      await expect(chapterButton).toBeVisible()
    }
  }
}

/** Type one command into the command box and wait until it is the story's newest turn. */
async function type(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command')
  await input.fill(command)
  await input.press('Enter')
  await expect(page.getByTestId('command').last()).toHaveText(`› ${command}`)
}

test('plays the red line from Act I to the Willowbrook epilogue', async ({
  page,
}): Promise<void> => {
  test.setTimeout(120_000)
  await startGame(page)
  const story = page.getByRole('region', { name: 'Story' })

  for (const [index, act] of ACTS.entries()) {
    if (index === 0) await expect(page.locator('.lq-chapter')).toBeVisible()
    const pages = await readPages(page, act.header)
    if (index === 0) {
      // The opening chapter page ends where the dream begins.
      expect(
        pages.join('\n'),
        'Act I opening page: the storm, and sleep that is not quiet',
      ).toContain('Sleep, when it comes, is not quiet.')
      await page
        .getByRole('region', { name: 'Actions' })
        .getByRole('button', { name: 'Type', exact: true })
        .click()
    }

    await type(page, `debug act${index + 1}`)
    await expect(page.getByText(act.played)).toBeVisible({ timeout: 60_000 })
    for (const command of act.completing) await type(page, command)

    const text = await story.innerText()
    for (const beat of act.beats) {
      expect(text, beat.name).toContain(beat.text)
    }
  }

  // The last act ends on its closing chapter page.
  await expect(page.locator('.lq-chapter')).toContainText(
    'Malakar is himself again. And Elior is home.',
  )
})
