# rq-a82d — retrospective

- **Implementer:** Rogue
- **Date:** 2026-11-27
- **PR:** #1419

## An e2e shard went red before any test ran: a Microsoft apt repository refused the browser install

**What happened.** `web-e2e (3/3)` of run 45954446518 failed in `install-playwright.sh`: all three
attempts (06:51 to 06:53) ended in `403 Forbidden` for
`https://packages.microsoft.com/ubuntu/26.04/prod/dists/resolute/InRelease`, then "The repository
... is no longer signed" and exit 100. The Ubuntu mirrors answered. The other two shards passed. The
same URL answered 200 from this machine a few minutes later, and the shard passed locally (83 tests).

**Why.** `npx playwright install --with-deps` updates every apt source on the runner, so one source
that refuses fails the install. Why that source refused is not established.

**Cost.** One more CI cycle and a 5-minute local run of the shard.

**Prevent by.** `.github/scripts/install-playwright.sh`: remove or disable the runner's
`packages.microsoft.com` apt source before installing, if nothing the browser needs comes from it
(not checked). Its retry covers about 90 seconds and did not outlast this outage.

**Seen before.** none found in `docs/retrospectives/`; rq-vjbs added the retry for Ubuntu mirror
outages.
