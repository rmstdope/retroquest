# Traps

The facts this project has already paid for, read by producers before they start.
One entry per trap: what happened, what it cost, and what to do about it. Empty until the first one.

## Playwright reuses whatever is on port 5173

`web/playwright.config.ts` starts Vite on the fixed port 5173 with `reuseExistingServer` on outside CI. Two producers running `gate_full` at once, or any other Vite server on that port, means the end-to-end suite may run against the wrong tree and pass or fail for reasons unrelated to the change. Until the port is made configurable, run `npx playwright test` only when nothing else holds 5173 (`lsof -i :5173`), and trust CI's e2e job over a local run. The suite also needs Chromium installed once per machine: `npx playwright install chromium` in `web/`.
