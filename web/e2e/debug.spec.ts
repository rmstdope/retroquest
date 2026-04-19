import { test } from '@playwright/test'

test('debug: check page load', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (msg) => logs.push('[' + msg.type() + '] ' + msg.text()))
  page.on('pageerror', (err) => logs.push('[PAGE_ERROR] ' + err.message))
  page.on('request', (req) => logs.push('[REQ] ' + req.method() + ' ' + req.url()))
  page.on('response', (res) => {
    logs.push('[RES] ' + res.status() + ' ' + res.url())
  })

  await page.goto('/index-vue.html')
  await page.waitForTimeout(15_000)

  const appHtml = await page.locator('#app').innerHTML()
  console.log('=== ALL LOGS ===')
  logs.forEach((l) => console.log(l))
  console.log('=== #app innerHTML (first 2000 chars) ===')
  console.log(appHtml.slice(0, 2000))
  console.log('=== appHtml length: ' + appHtml.length + ' ===')
})
