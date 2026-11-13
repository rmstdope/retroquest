# rq-tets

## Shard 3 of the e2e suite failed on two different picture tests, each green locally

**What happened**: `web-e2e (3/3)` failed on `e2e/roomTitle.spec.ts:81` ("the priest is not placed": `[data-area-press="priest"]` had no bounding box). The same spec passed locally under `smoke-port` and on a re-run of the failed job. The diff touched only the engine, acts' name lists and the store, nothing about scenes.

On the next head (docs only) the same shard failed on `e2e/questNews.spec.ts:165` (390 wide, a 15 s predicate timeout); that spec also passed locally.

**Why**: not established; the test reads the box right after the title settles, so a loaded CI shard can beat the area's placement.

**Cost**: one bare re-run, a second CI cycle for the retrospective commit, and a second red shard.

**Prevent by**: waiting for `[data-area-press="priest"]` to be attached before `boundingBox()` in `roomTitle.spec.ts`.

**Seen before**: nothing like it yet.
