/**
 * The red line, end to end: one playthrough in the browser that follows the
 * golden path from the start of Act I to the Willowbrook epilogue and checks
 * the beats of the Red Line table in design/GameStory.md: the amulet, the
 * dream voice and the refrain in each act, and the withered field that is
 * green again. Each act is played with the dev server's `debug act<N>` command
 * (the act's golden path), then finished with the act's completing commands.
 */
import { test, expect, type Locator, type Page } from '@playwright/test'

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
  /** Commands typed after the act's golden path to complete the act. */
  completing: string[]
  /** The beats, read from the story the player has on screen at the act's end. */
  beats: Beat[]
}

/** The refrain, as every act says it. */
const REFRAIN = 'Power follows purpose; purpose follows truth.'

/** The dream voice's words from the second and third acts' visions. */
const DREAM_VOICE_ACT2 = 'Elior… how you have grown. Do not be afraid of me.'

/** The four acts of the red line, in order. */
const ACTS: ActPlay[] = [
  {
    header: 'Act I',
    completing: ['use map'],
    beats: [
      {
        name: 'Act I amulet: Mira gives it to him',
        text: 'She presents you with the Ancient Amulet.',
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
    completing: ['cast prophetic vision', 'talk to sir cedric'],
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
    completing: ['examine fortress gates'],
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
    completing: [],
    beats: [
      {
        name: 'Act IV dream voice: the Shadow of the Past',
        text: 'It is the voice from your dream, the one that called your name on the stormy night in Willowbrook',
      },
      {
        name: 'Act IV refrain: said by Elior to Malakar',
        text: `“${REFRAIN.slice(0, -1)},” you say.`,
      },
      {
        name: 'Act IV amulet: used in the final choice',
        text: 'You raise the amulet. It opens in your hand like a flower',
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
 * Close every chapter page and pop-up until the act is on screen, collecting
 * the text of the chapter pages on the way.
 */
async function readPages(page: Page): Promise<string[]> {
  const pages: string[] = []
  const chapterButton = page.locator('.lq-chapter-button')
  const popUpButton = page.getByRole('button', {
    name: 'Continue',
    exact: true,
  })
  for (;;) {
    await page.waitForTimeout(300)
    if (await chapterButton.isVisible()) {
      pages.push(await page.locator('.lq-chapter').innerText())
      await chapterButton.click()
    } else if (await popUpButton.isVisible()) {
      await popUpButton.click()
    } else {
      return pages
    }
  }
}

/** Type one command into the command box and wait for it to show in the story. */
async function type(page: Page, story: Locator, command: string) {
  const input = page.getByLabel('Command')
  await input.fill(command)
  await input.press('Enter')
  await expect(story).toContainText(`› ${command}`)
}

test('plays the red line from Act I to the Willowbrook epilogue', async ({
  page,
}) => {
  test.setTimeout(300_000)
  await startGame(page)
  const story = page.getByRole('region', { name: 'Story' })

  for (const [index, act] of ACTS.entries()) {
    const pages = await readPages(page)
    await expect(page.getByTestId('act')).toHaveText(act.header)
    if (index === 0) {
      // The dream voice's first appearance is in the opening chapter page.
      expect(
        pages.join('\n'),
        'Act I dream voice: heard in the opening dream',
      ).toContain('you dream of a shadowy figure calling your name')
      await page
        .getByRole('region', { name: 'Actions' })
        .getByRole('button', { name: 'Type', exact: true })
        .click()
    }

    await type(page, story, `debug act${index + 1}`)
    await expect(
      page.getByText(
        new RegExp(`Debug script 'act${index + 1}' (played|stopped)`),
      ),
    ).toBeVisible({ timeout: 60_000 })
    for (const command of act.completing) await type(page, story, command)

    const text = await story.innerText()
    for (const beat of act.beats) {
      expect(text, beat.name).toContain(beat.text)
    }
  }

  // The last act ends on its closing chapter page, after the quest pop-ups.
  const popUp = page.getByRole('button', { name: 'Continue', exact: true })
  while (!(await page.locator('.lq-chapter').isVisible())) {
    await popUp.click()
  }
  await expect(page.locator('.lq-chapter')).toContainText(
    'Malakar is himself again. And Elior is home.',
  )
})
