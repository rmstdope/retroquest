# rq-tets

## A picture-area e2e test failed once in CI and passed on re-run

**What happened**: `web-e2e (3/3)` failed on `e2e/roomTitle.spec.ts:81` ("the priest is not placed": `[data-area-press="priest"]` had no bounding box). The same spec passed locally under `smoke-port` and on a re-run of the failed job. The diff touched only the engine, acts' name lists and the store, nothing about scenes.

**Why**: not established; the test reads the box right after the title settles, so a loaded CI shard can beat the area's placement.

**Cost**: one bare re-run (of the budget of two) and about four minutes of CI.

**Prevent by**: waiting for `[data-area-press="priest"]` to be attached before `boundingBox()` in `roomTitle.spec.ts`.

**Seen before**: nothing like it yet.
