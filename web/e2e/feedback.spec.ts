/**
 * Feedback: F2 and the ✎ button open the window over the game, the report goes to the feedback
 * service (answered here by a stand-in for it) with the save and a real picture of the screen,
 * a refusal keeps what was written, and the title page has neither button nor key.
 */
import { test, expect, type Page, type Route } from './fixtures'

const SERVICE = 'https://beacon.rmstdope.eu/v1/reports'

/** Start a new game on a laptop and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

/** Stand in for the feedback service: answer each report with `answer`, and record what it got. */
async function service(
  page: Page,
  answer: (route: Route) => Promise<void>,
): Promise<Array<Record<string, unknown>>> {
  const received: Array<Record<string, unknown>> = []
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
  }
  await page.route(SERVICE, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors })
      return
    }
    received.push(route.request().postDataJSON() as Record<string, unknown>)
    await answer(route)
  })
  return received
}

test('F2 opens the window, and a report goes out with the save and a picture', async ({
  page,
}): Promise<void> => {
  const received = await service(page, (route) =>
    route.fulfill({
      status: 201,
      headers: { 'access-control-allow-origin': '*' },
      json: { reference: 42 },
    }),
  )
  await start(page)
  await page.keyboard.press('F2')
  const window = page.getByRole('dialog', { name: 'Tell us what you found' })
  await expect(window).toBeVisible()
  await expect(window.getByRole('textbox')).toBeFocused()
  await window.getByRole('textbox').fill('The door sticks\nand will not open')
  await window.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Thank you' })).toBeVisible()
  await expect(
    page.getByText("Sent — it's report #42. Thank you for telling us."),
  ).toBeVisible()

  expect(received).toHaveLength(1)
  expect(received[0]).toMatchObject({
    clientId: 'retroquest',
    type: 'bug',
    title: 'The door sticks',
  })
  expect(String(received[0].appVersion)).toContain('Act I')
  expect(received[0].save).toBeDefined()
  expect(received[0].screenshots).toHaveLength(1)

  await page.getByRole('button', { name: 'Back to the game' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('the ✎ button opens it, a refusal keeps the words, and Cancel sends nothing', async ({
  page,
}): Promise<void> => {
  const received = await service(page, (route) =>
    route.fulfill({
      status: 429,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'retry-after',
        'retry-after': '90',
      },
      json: { error: 'rate_limited', message: 'slow down' },
    }),
  )
  await start(page)
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
  const window = page.getByRole('dialog', { name: 'Tell us what you found' })
  await window.getByRole('textbox').fill('An idea for boats')
  await window.getByRole('radio', { name: 'An idea' }).click()
  await window.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(
    window.getByText('Too many reports just now. Try again in 2 minutes.'),
  ).toBeVisible()
  await expect(window.getByRole('textbox')).toHaveValue('An idea for boats')

  await window.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(received).toHaveLength(1)
  expect(received[0]).toMatchObject({ type: 'feature' })

  await page.keyboard.press('F2')
  await expect(
    page
      .getByRole('dialog', { name: 'Tell us what you found' })
      .getByRole('textbox'),
  ).toHaveValue('An idea for boats')
})

test('the title page has no ✎ and F2 does nothing there', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.keyboard.press('F2')
  await expect(
    page.getByRole('dialog', { name: 'Tell us what you found' }),
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Send feedback' })).toHaveCount(
    0,
  )
})
