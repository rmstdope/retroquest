/**
 * The narration hint ("Space to hurry · hold to skip", "Tap to hurry ·
 * hold to skip") floats over the bottom of the story; on a laptop wide
 * enough for two sides it sits below the narrator's cards instead, level with
 * the "▾ Hide" (rq-7tei). While a paragraph at the bottom of the story is read
 * aloud, none of its words may sit under it, on desktop or on a phone, and
 * making room for it must not make the story jump when the reading lets it go
 * (rq-7juz).
 */
import {
  test,
  expect,
  enterCommand,
  type Page,
  closeTypingBox,
} from './fixtures'

// Narration on, as for a new player (the config turns it off for the other specs).
test.use({
  storageState: { cookies: [], origins: [] },
  narrationRecordings: true,
})

/** Narrated clips end shortly after they start (CI has no audio device). */
async function quickNarrationClips(page: Page): Promise<void> {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (this.src.includes('/audio/narration/'))
        setTimeout(() => this.dispatchEvent(new Event('ended')), 1200)
      return Promise.resolve()
    }
  })
}

/**
 * Open the game and wait for Act I's list of recordings: a Start pressed before
 * it has arrived leaves the dream unread (rq-vjbs).
 */
async function openWithRecordings(page: Page): Promise<void> {
  const recordings = page.waitForResponse(
    '**/audio/narration/act1/manifest.json',
  )
  await page.goto('/')
  await (await recordings).finished()
}

/** What one reading showed, frame by frame. */
interface Reading {
  /** Words of a paragraph being read that showed under the hint. */
  covered: string[]
  /** Whether a paragraph of the newest turn was seen being read at all. */
  seen: boolean
  /** Whether the hint was up on some frame of the reading. */
  hintSeen: boolean
  /** How far the last paragraph read moved down once the reading let go, in px. */
  drop: number
  /**
   * The largest gap seen between the middle of the hint and the middle of the
   * "▾ Hide" button while both showed, in px (null when they never showed together).
   */
  offHide: number | null
}

/**
 * Watch the reading of the next turn frame by frame until it ends, collect
 * every word of a paragraph being read that showed under the hint (only the
 * part of a line inside the story counts: the rest is clipped), then see
 * whether the last paragraph read moves down as the story is let go. The watch
 * is running when this returns, so call it before whatever brings the turn: a
 * clip can end before a watch started afterwards (rq-vjbs). What it returns
 * waits for the reading. The next turn is one that is not on the page yet; the
 * opening's may be there already, behind the chapter page, so `opening` counts it.
 */
async function watchReading(
  page: Page,
  { opening = false } = {},
): Promise<() => Promise<Reading>> {
  await page.evaluate((opening) => {
    const earlier = new Set(
      opening ? [] : document.querySelectorAll('[data-testid="turn"]'),
    )
    ;(window as unknown as { reading: Promise<Reading> }).reading =
      new Promise<Reading>((resolve) => {
        const covered = new Set<string>()
        const started = performance.now()
        let seen = false
        let hintSeen = false
        let last: Element | null = null
        let lastTop = 0
        let offHide: number | null = null
        const overlaps = (
          a: DOMRect,
          b: { left: number; right: number; top: number; bottom: number },
        ): boolean =>
          a.left < b.right &&
          a.right > b.left &&
          a.top < b.bottom &&
          a.bottom > b.top
        const settle = (frames: number): void => {
          if (frames > 0) {
            requestAnimationFrame(() => settle(frames - 1))
            return
          }
          const top = last?.getBoundingClientRect().top ?? lastTop
          resolve({
            covered: [...covered],
            seen,
            hintSeen,
            drop: Math.max(0, top - lastTop),
            offHide,
          })
        }
        const check = (): void => {
          const story = document.querySelector('.lq-story')
          const hint = document.querySelector('.lq-narration-hint')
          const turns = document.querySelectorAll('[data-testid="turn"]')
          const newest = turns[turns.length - 1]
          const speaking =
            newest && !earlier.has(newest)
              ? newest.querySelector('.lq-speaking')
              : null
          if (speaking) {
            seen = true
            last = speaking
            lastTop = speaking.getBoundingClientRect().top
          }
          if (hint && seen) hintSeen = true
          const hide = document.querySelector('.lq-words-hide')
          if (hint && hide && seen) {
            const a = hint.getBoundingClientRect()
            const b = hide.getBoundingClientRect()
            const gap = Math.abs(a.top + a.height / 2 - (b.top + b.height / 2))
            offHide = Math.max(offHide ?? 0, gap)
          }
          if (story && hint && speaking) {
            const pane = story.getBoundingClientRect()
            const pill = hint.getBoundingClientRect()
            const area = {
              left: Math.max(pane.left, pill.left),
              right: Math.min(pane.right, pill.right),
              top: Math.max(pane.top, pill.top),
              bottom: Math.min(pane.bottom, pill.bottom),
            }
            // The pane ends above the hint (the paper glides taller while a
            // part appears): nothing can sit under it then.
            const shared = area.right > area.left && area.bottom > area.top
            const walker = document.createTreeWalker(
              speaking,
              NodeFilter.SHOW_TEXT,
            )
            for (let n = walker.nextNode(); n; n = walker.nextNode()) {
              const text = n.textContent ?? ''
              for (const match of text.matchAll(/\S+/g)) {
                const range = document.createRange()
                range.setStart(n, match.index)
                range.setEnd(n, match.index + match[0].length)
                for (const r of Array.from(range.getClientRects()))
                  if (shared && overlaps(r, area)) covered.add(match[0])
              }
            }
          }
          if ((seen && !speaking) || performance.now() - started > 20_000)
            settle(20)
          else requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      })
  }, opening)
  return () =>
    page.evaluate(
      () => (window as unknown as { reading: Promise<Reading> }).reading,
    )
}

/** The reading was measured, nothing read sat under the hint, and the story did not drop when let go. */
function expectClear(reading: Reading, what: string): void {
  expect(reading.seen, `${what}: a paragraph was read`).toBe(true)
  expect(reading.hintSeen, `${what}: the hint showed`).toBe(true)
  expect(reading.covered, `${what}: words under the hint`).toEqual([])
  expect(reading.drop, `${what}: drop when let go`).toBeLessThan(1)
}

for (const { name, width, height } of [
  // Short screens keep the text page: any other screen tells an arrival on
  // the picture, where the story and its hint wait aside (arrival.spec.ts).
  { name: 'desktop', width: 1000, height: 500 },
  { name: 'phone', width: 844, height: 390 },
]) {
  test(`no word being read sits under the narration hint, and the story stays put after, on ${name}`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height })
    await quickNarrationClips(page)
    await openWithRecordings(page)
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    const dream = await watchReading(page, { opening: true })
    await page.locator('.lq-chapter-button').click()
    // The dream is read first; the voice wakes the hero in the cottage,
    // whose arrival is read; then the lantern. Each is checked to its end.
    expectClear(await dream(), 'the dream')
    for (const command of ['talk to voice', 'examine lantern']) {
      const reading = await watchReading(page)
      await enterCommand(page, command)
      // Space is a letter in the command box, where no hint shows: leave it.
      await closeTypingBox(page)
      expectClear(await reading(), command)
    }
  })
}

/**
 * On a laptop wide enough for two sides the narrator's cards end above the
 * "▾ Hide" line: the hint sits on that line, beside the Hide, and so never
 * over the newest card (rq-7tei). The hint is then outside the story pane,
 * so no word can count as covered: the guard that it stays off the cards is
 * that it is level with the Hide.
 */
test('on a wide desktop the hint sits at the height of the Hide button and covers no word being read', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await quickNarrationClips(page)
  await openWithRecordings(page)
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  const enter = async (command: string): Promise<void> => {
    await enterCommand(page, command)
    // Space is a letter in the command box, where no hint shows: leave it.
    await closeTypingBox(page)
  }
  // The voice wakes the hero, whose arrival in the cottage is told on the
  // picture; the next command clears it and is read on the cards.
  await enter('talk to voice')
  await expect(page.getByTestId('arrival-on-picture')).toBeVisible()
  const look = await watchReading(page)
  await enter('look')
  const reading = await look()
  expectClear(reading, 'look')
  expect(reading.offHide, 'the hint beside the Hide').not.toBeNull()
  expect(
    reading.offHide ?? 0,
    "the hint off the Hide's height, in px",
  ).toBeLessThan(2)
})

/**
 * On the one column of narrator's cards (a phone with room for the picture,
 * 390x650, or a laptop window too narrow for two sides) the hint floats at
 * the bottom of the cards: while a card is read the cards keep the room for
 * the hint below the words, so no line of the newest card lies under it
 * (rq-x720).
 */
for (const { name, width, height } of [
  { name: 'a tall phone', width: 390, height: 650 },
  { name: 'a narrow laptop', width: 1050, height: 700 },
]) {
  test(`on ${name} no word of the newest card being read sits under the hint`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height })
    await quickNarrationClips(page)
    await openWithRecordings(page)
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    const enter = async (command: string): Promise<void> => {
      await enterCommand(page, command)
      // Space is a letter in the command box, where no hint shows: leave it.
      await closeTypingBox(page)
    }
    await enter('talk to voice')
    await expect(page.getByTestId('arrival-on-picture')).toBeVisible()
    const reading = await watchReading(page)
    await enter('look')
    await expect(page.locator('.lq-story-wrap.lq-one-column')).toBeVisible()
    expectClear(await reading(), 'look')
  })
}
