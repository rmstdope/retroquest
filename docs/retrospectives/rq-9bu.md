# rq-9bu — container-smoke stalled 18 minutes on an image layer pull

**What happened:** On PR #540 (head `37ba04c1`), every web check was green in under 80 s, but
`container-smoke` ran for 18m58s, against about 1 minute on #536. Its log shows the step "Build
production image for isolated smoke checks" sitting on one base-image layer
(`sha256:0f5b2460…`, 15.92 MB) at `0B / 15.92MB` from 20:28 to 20:46 UTC before the pull went
through and the job passed.

**Why:** Not established. The layer download from the registry stalled, and nothing in the job
bounds it.

**Cost:** About 18 minutes of a session blocked in the CI wait, with nothing to show whether the job was
stuck or slow.

**Prevent by:** A `timeout-minutes` on the `container-smoke` job (or its build step) in
`.github/workflows/ci.yml`, a few times its normal minute, so a stalled pull fails fast and
can be re-run instead of being waited out.

**Seen before:** No (`grep -rli container-smoke docs/retrospectives/` found nothing).
