# Production container

The application is built in GitHub Actions, not on the deployment VPS. After all
main-branch CI checks pass, the publishing job pushes
`ghcr.io/rmstdope/retroquest:sha-<commit>` and reports its immutable digest in the
workflow summary. Pull requests do not publish. Publication does not deploy.

The publishing job also uploads `deployment-manifest`, containing
`deployment.json` with the source `revision` and immutable service `images`.
With the updated infrastructure CLI, deploy the newest successful main build:

```sh
rmstdope-deploy release retroquest --latest
```

This requires an authenticated `gh` CLI on the operator machine. The selected
run, revision and digest are displayed before confirmation. Newer pending or
failed builds do not block selecting the newest successful build. If that run's
artifact is absent or expired, publish another build or use the explicit command
from the workflow summary; there is no silent fallback to an older artifact.

Keep the GHCR package private in its package settings; if a package of this name
already exists, verify its visibility and grant this repository Actions access.
The deployment host needs a separate read-only package credential. Never add
production SSH credentials to this workflow.

For a local build on an x86_64 deployment target:

```sh
docker build --platform linux/amd64 \
  --build-arg VCS_REF="$(git rev-parse HEAD)" -t retroquest:local .
docker run --rm -p 127.0.0.1:8080:8080 retroquest:local
```

Only the production `web/dist` directory is served. The runtime listens on 8080
and includes `wget` for Compose health checks. `/healthz` returns 200 and
`/release.json` contains `{"revision":"<full-source-commit>"}`. Hashed Vite assets
under `/assets/` are immutable; HTML and release metadata require revalidation.
Missing asset files return 404 rather than the SPA shell.

The shared infrastructure repository, `rmstdope/rmstdope-infra`, owns Compose
definitions, the public HTTPS proxy, and the `rmstdope-deploy` command. Its runtime
configuration must not be duplicated here. Production is
`https://retroquest.rmstdope.eu`. Game saves remain in browser storage, scoped to
the origin; moving from another hostname does not transfer existing saves.

Before merging, run the existing repository pre-merge checks and independently
review the full change. Packaging work is tracked as `rq-dob`.
