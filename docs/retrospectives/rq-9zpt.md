# rq-9zpt

## A test under web/src importing from tts/ passed locally and broke the image build

**What happened.** The first version put the retire logic in `tts/retire-orphans.ts` and imported it from a test in `web/src/lantern/`. Lint, `vue-tsc`, vitest and the e2e job were green; `container-smoke` failed with TS2307, because the Dockerfile builds with `web/` only, so `npm run build` (`vue-tsc`) cannot see `tts/`.

**Why.** The fast gate runs `vue-tsc` in a full checkout, where `../../../tts` exists.

**Cost.** One red CI run and one extra commit.

**Prevent by.** Keep anything `web/src` imports under `web/`; `tts/` may import from `web/`, never the reverse (tests may read `tts/` files at run time, as `narrationCasts.test.ts` does).

**Seen before.** Nothing like it yet.
