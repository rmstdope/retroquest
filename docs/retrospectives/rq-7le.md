# rq-7le — retrospective

## `build-workload --classify` refuses in this project

**What happened:** `produce-bead` *Building* says to classify the changed paths before the fast
gate (`git diff --name-only -z origin/main...HEAD | xargs -0 .cerebro/cerebro/scripts/build-workload --classify`).
Here it exits 1 with "build-workload: no rust_paths in .cerebro/project.conf - cannot classify
safely." The project has no Rust, so the step can never succeed.

**Why:** `.cerebro/project.conf` leaves `rust_paths` commented out, and the script refuses
rather than guess when it is absent.

**Cost:** one failed command and a moment spent deciding whether it blocks the gate (it does not:
the workload is non-rust, and the fast gate ran as declared).

**Prevent by:** either declaring that the project has no Rust paths in `.cerebro/project.conf` in
a form `build-workload` accepts, or having `build-workload --classify` answer `non-rust` when the
project declares no Rust build at all.

**Seen before:** nothing in `docs/retrospectives/` yet.
