# rq-0bea — a rebase conflicted in the generated narration manifest and lock

**What happened**: After CI went green, PR #895 turned `CONFLICTING DIRTY`. Ten beads had merged to
main in the meantime. The rebase stopped on `content-studio/narration/act1.lock.json` and
`web/public/audio/narration/act1/manifest.json`, which `tts/retire-orphans.ts` had edited when it
retired five clips. Other merged beads had retired other Act 1 clips from the same two files. No
source file conflicted.

**Why**: Every bead that changes a spoken Act 1 line rewrites the same generated files
(`tts/act1/script.json`, the manifest, the lock). When several such beads are in flight at once,
the second one to merge always conflicts there, even when its source changes are independent.

**Cost**: A rebuild of the branch (abort the rebase, reapply the source diff on main, run
`extract-act.ts` and `retire-orphans.ts` again, then rerun the gate), a force-push, and a second
full CI wait of about 10 minutes.

**Prevent by**: `produce-bead` *Merging*, the `422` / `CONFLICTING` step: when the conflicts are
only in generated narration files, do not resolve them by hand. Take main's versions, then run
`extract-act.ts <N>` and `retire-orphans.ts <N>` again on the rebased tree. Or a traps entry in
`.cerebro/traps.md` that says so.

**Seen before**: Nothing like it yet in `docs/retrospectives/` (grep for "manifest.json" and
"act1.lock").
