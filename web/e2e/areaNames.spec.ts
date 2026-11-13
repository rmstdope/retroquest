/**
 * What is in a room's picture is named (rq-ezpg.10): a name follows the mouse
 * on a laptop, one button shows a mark and a name for every placed thing, S and
 * Escape do the same, and on a small sideways phone every name stays inside
 * the picture.
 */
import { test, expect, type Page } from '@playwright/test'

/** A placed area, in fractions of the picture. */
interface AreaFractions {
  x: number
  y: number
  width: number
  height: number
}

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Where the things of the cottage are placed on its picture, by default. */
const COTTAGE_AREAS: Record<string, AreaFractions> = {
  hearth: { x: 0.1, y: 0.4, width: 0.15, height: 0.3 },
  bread: { x: 0.5, y: 0.6, width: 0.1, height: 0.1 },
  grandmother: { x: 0.8, y: 0.3, width: 0.1, height: 0.3 },
}

/** Open the game in the cottage with its picture up and a few things placed on it. */
async function toTheCottage(
  page: Page,
  areas: Record<string, AreaFractions> = COTTAGE_AREAS,
): Promise<void> {
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1920,
          height: 1080,
          areas,
        },
      },
    }),
  )
  await page.route('**/images/generated/*.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  // The dream is told a few lines at a time on a small screen.
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  // The voice wakes Elior in his cottage.
  await page
    .getByRole('region', { name: /^Action/ })
    .getByRole('button', { name: /^(Type|Type a command)$/ })
    .click()
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('say hello to voice')
  await input.press('Enter')
  await page.keyboard.press('Escape')
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  await expect(page.locator('.lq-room-name')).toHaveText("Elior's Cottage")
}

test('the button, S and Escape show and take away the marks and names on a laptop', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const button = page.getByRole('button', { name: /Show what's here/ })
  await expect(button).toBeVisible()
  await expect(page.locator('[data-area-mark]')).toHaveCount(0)
  await button.click()
  await expect(page.getByRole('button', { name: '◎ Showing' })).toBeFocused()
  await expect(page.locator('[data-area-mark]')).toHaveCount(3)
  await expect(page.locator('[data-area-name="bread"]')).toHaveText('Bread')
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-area-mark]')).toHaveCount(0)
  await page.keyboard.press('s')
  await expect(page.locator('[data-area-mark]')).toHaveCount(3)
  await page.keyboard.press('s')
  await expect(page.locator('[data-area-mark]')).toHaveCount(0)
})

test('the name follows the mouse over a thing, and no name shows over nothing', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const stage = await page.locator('.lq-stage').boundingBox()
  // The bread sits at 55% across and 65% down of the 16:9 picture trimmed to the stage.
  const scale = Math.max(stage!.width / 1920, stage!.height / 1080)
  const x = stage!.x + stage!.width / 2 + (0.55 - 0.5) * 1920 * scale
  const y = stage!.y + stage!.height / 2 + (0.65 - 0.5) * 1080 * scale
  await page.mouse.move(x, y)
  await expect(page.locator('[data-area-pointer]')).toHaveText('Bread')
  await page.mouse.move(stage!.x + 5, stage!.y + stage!.height / 2 + 100)
  await expect(page.locator('[data-area-pointer]')).toHaveCount(0)
})

test.describe('at the edges of a laptop picture (rq-5hs1)', () => {
  /**
   * On a 1428×650 laptop the 16:9 picture is trimmed to the stage under the
   * header and the action bar lies over the stage's foot: the bread runs under
   * the bar, the grandmother's middle is behind it and her name has to move
   * away from the bread's, and the hearth hugs the left edge.
   */
  const AT_THE_EDGES: Record<string, AreaFractions> = {
    hearth: { x: 0, y: 0.4, width: 0.03, height: 0.2 },
    bread: { x: 0.1, y: 0.72, width: 0.1, height: 0.1 },
    grandmother: { x: 0.13, y: 0.7, width: 0.06, height: 0.2 },
  }
  /** What the browser may round a position by. */
  const ROUNDING = 0.5

  /** Hold the drift at its peak, where the picture is largest and furthest over. */
  async function holdDriftAtPeak(page: Page): Promise<void> {
    await page.addStyleTag({
      content:
        // !important: the picture's own scoped animation shorthand outranks this.
        '.lq-drift-on { animation-delay: -26s !important; animation-play-state: paused !important; }',
    })
  }

  test('the name of what the pointer is over, just above the bar, goes above the pointer', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 1428, height: 650 })
    await toTheCottage(page, AT_THE_EDGES)
    const bar = await page.locator('.lq-composer').boundingBox()
    const stage = await page.locator('.lq-stage').boundingBox()
    await page.mouse.move(stage!.x + 0.115 * stage!.width, bar!.y - 15)
    const name = page.locator('[data-area-pointer]')
    await expect(name).toHaveText('Bread')
    const box = await name.boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y)
  })

  test('every mark and name stays on the visible picture with the drift at its peak', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 1428, height: 650 })
    await toTheCottage(page, AT_THE_EDGES)
    // The belt covers the very foot of the picture while it is up (belt.spec.ts); put away, the action row is the floor.
    await page.getByRole('button', { name: 'Put the belt away' }).click()
    await holdDriftAtPeak(page)
    await page.getByRole('button', { name: /Show what's here/ }).click()
    const marks = page.locator('[data-area-mark]')
    await expect(marks).toHaveCount(3)
    const bar = await page.locator('.lq-composer').boundingBox()
    const stage = await page.locator('.lq-stage').boundingBox()
    const spots = [
      ...(await marks.all()),
      ...(await page.locator('[data-area-name]').all()),
    ]
    expect(spots).toHaveLength(6)
    for (const spot of spots) {
      const box = await spot.boundingBox()
      expect.soft(box!.x).toBeGreaterThanOrEqual(stage!.x - ROUNDING)
      expect
        .soft(box!.x + box!.width)
        .toBeLessThanOrEqual(stage!.x + stage!.width + ROUNDING)
      expect.soft(box!.y).toBeGreaterThanOrEqual(stage!.y - ROUNDING)
      expect.soft(box!.y + box!.height).toBeLessThanOrEqual(bar!.y + ROUNDING)
    }
    const lines = page.locator('.lq-area-lines line')
    await expect(lines).not.toHaveCount(0)
    for (const line of await lines.all()) {
      const bottom = await line.evaluate(
        (el) => el.getBoundingClientRect().bottom,
      )
      expect.soft(bottom).toBeLessThanOrEqual(bar!.y + ROUNDING)
    }
  })
})

test.describe('on the smallest sideways phone', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('every name stays inside the picture', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 568, height: 320 })
    await toTheCottage(page)
    const button = page.getByRole('button', { name: /Show what's here/ })
    await expect(button).toBeVisible()
    await button.click()
    await expect(page.locator('[data-area-name]')).toHaveCount(3)
    const stage = await page.locator('.lq-stage').boundingBox()
    for (const name of await page.locator('[data-area-name]').all()) {
      const box = await name.boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(stage!.x - 1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        stage!.x + stage!.width + 1,
      )
      expect(box!.y).toBeGreaterThanOrEqual(stage!.y - 1)
      expect(box!.y + box!.height).toBeLessThanOrEqual(
        stage!.y + stage!.height + 1,
      )
    }
  })
})

test('the marks and names come back with the picture after a layout without one (rq-fy44)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1000, height: 700 })
  await toTheCottage(page)
  await page.getByRole('button', { name: /Show what's here/ }).click()
  await expect(page.locator('[data-area-mark]')).toHaveCount(3)
  // A short window has no picture: the text page.
  await page.setViewportSize({ width: 568, height: 320 })
  await expect(page.locator('.lq-stage')).toHaveCount(0)
  await page.setViewportSize({ width: 1000, height: 700 })
  await expect(page.getByRole('button', { name: '◎ Showing' })).toBeVisible()
  await expect(page.locator('[data-area-mark]')).toHaveCount(3)
  await expect(page.locator('[data-area-name]')).toHaveCount(3)
})

test.describe('a dot under the faded edge of a card (rq-riv9)', () => {
  /** Where the studio placed the cottage's things when the bug was found. */
  const PLACED: Record<string, AreaFractions> = {
    hearth: { x: 0.211458, y: 0.388889, width: 0.145833, height: 0.376852 },
    lantern: { x: 0.825, y: 0.47037, width: 0.046875, height: 0.107407 },
    bread: { x: 0.452083, y: 0.585185, width: 0.099479, height: 0.112037 },
    'scenery-eliors-cottage-table': {
      x: 0.295833,
      y: 0.594444,
      width: 0.38125,
      height: 0.27963,
    },
    'scenery-eliors-cottage-shelves': {
      x: 0.385417,
      y: 0.101852,
      width: 0.140104,
      height: 0.449074,
    },
    'scenery-eliors-cottage-books': {
      x: 0.414583,
      y: 0.165741,
      width: 0.092708,
      height: 0.115741,
    },
    grandmother: {
      x: 0.623958,
      y: 0.180556,
      width: 0.177083,
      height: 0.698148,
    },
    'exit-east': {
      x: 0.915104,
      y: 0.184259,
      width: 0.082292,
      height: 0.609259,
    },
  }
  const TABLE = 'scenery-eliors-cottage-table'

  /** Type one command into the action bar. */
  async function command(page: Page, text: string): Promise<void> {
    const type = page
      .getByRole('region', { name: /^Action/ })
      .getByRole('button', { name: /^(Type|Type a command)$/ })
    if (await type.isVisible()) await type.click()
    const input = page.getByLabel('Command', { exact: true })
    await input.fill(text)
    await input.press('Enter')
  }

  test('resting on the dot names it', async ({ page }): Promise<void> => {
    await page.setViewportSize({ width: 1000, height: 700 })
    await toTheCottage(page, PLACED)
    await command(page, 'talk to grandmother')
    await command(page, 'talk to grandmother')
    await page.getByRole('button', { name: /Show what's here/ }).click()
    await page.getByRole('button', { name: /Show$/ }).click()
    await expect(page.locator('.lq-story-wrap .lq-cl')).not.toHaveCount(0)
    await expect(page.locator(`[data-area-mark="${TABLE}"]`)).toHaveCount(1)
    const story = page.locator('.lq-story-wrap .lq-story')
    /** Scroll the words to `top` and let the marks be laid out again; where the table's left-off dot is then, or null. */
    const scrollTo = (
      top: number,
    ): Promise<{ x: number; y: number; covered: boolean } | null> =>
      story.evaluate(
        async (el, [top, table]) => {
          el.scrollTop = top
          for (let i = 0; i < 3; i++)
            await new Promise((done) => requestAnimationFrame(done))
          const mark = document.querySelector(`[data-area-mark="${table}"]`)
          if (!mark || document.querySelector(`[data-area-name="${table}"]`))
            return null
          const box = mark.getBoundingClientRect()
          const x = Math.round(box.x + box.width / 2)
          const y = Math.round(box.y + box.height / 2)
          const at = document.elementFromPoint(x, y)
          return { x, y, covered: !!at?.closest('.lq-card, .lq-cl') }
        },
        [top, TABLE] as const,
      )
    // Scroll the words up, a few pixels at a time: wherever the table's dot, its name left off, lies where a card takes the pointer, resting on it names it.
    const bottom = await story.evaluate(
      (el) => el.scrollHeight - el.clientHeight,
    )
    let covered = 0
    for (let top = bottom; top >= 0; top -= 3) {
      await page.mouse.move(5, 300)
      const dot = await scrollTo(top)
      if (!dot?.covered) continue
      covered++
      await page.mouse.move(dot.x, dot.y, { steps: 5 })
      await expect(
        page.locator('[data-area-pointer]'),
        `scrolled to ${top}`,
      ).toHaveText('Table')
    }
    // How many positions put the dot under a card depends on the layout: Grandmother's two replies, the fonts and the
    // cards' padding. A change to any of them can leave none, which fails here rather than checking nothing.
    expect(covered).toBeGreaterThan(0)
  })
})
