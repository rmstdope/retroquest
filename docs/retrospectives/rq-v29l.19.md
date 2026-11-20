# rq-v29l.19 — a hidden live region broke page-level e2e locators

**What happened:** Green unit tests, lint and types locally; CI web-e2e failed in all three shards. A new visually hidden `role="log"` (the screen-reader announcer) repeats every story bubble's words, so Playwright `page.getByText(...)` resolved to two elements (strict mode violation). The full local Playwright run took over 10 minutes and was never finished.

**Why:** `getByText` matches visually hidden elements; the plan said "no e2e change" without searching `e2e/` for page-level text locators.

**Cost:** Two extra CI rounds (about 20 minutes).

**Prevent by:** In the plan, for any change that adds text to the DOM, grep `web/e2e` for `page.getByText` and scope those locators; run the touched specs locally (`smoke-port -- npx playwright test e2e/<spec>`) before the PR.

**Seen before:** nothing like it yet.
