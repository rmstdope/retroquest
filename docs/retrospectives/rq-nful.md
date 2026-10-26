# rq-nful

## A test importing `tts/` was green locally and red in the image build

**What happened:** The new test in `web/src/lantern` imports `../../../tts/actScripts`. All local checks passed, but CI `container-smoke` failed: `vue-tsc` (run by `npm run build` in the Dockerfile) type-checks test files, and the image build context contains only `web/` and `deploy/`, so TS2307 "Cannot find module".

**Why:** Nothing under `web/src` had imported outside `web/` before; the Dockerfile and `.dockerignore` copy only `web/`.

**Cost:** One fix commit and one extra CI cycle (~5 minutes).

**Prevent by:** A note in the pre-merge checklist (CLAUDE.md) or the plan template: a change that imports from outside `web/` must also touch the Dockerfile and `.dockerignore`; Docker is not available locally, so simulate by copying `web/` plus the extra directory to a temp dir and running `vue-tsc`.

**Seen before:** nothing like it yet.
