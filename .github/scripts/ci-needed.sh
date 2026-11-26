#!/usr/bin/env bash
#
# Decides whether CI has to run its checks:
#
#     bash .github/scripts/ci-needed.sh "$EVENT" >> "$GITHUB_OUTPUT"
#
#   stdout   exactly one line, `run=true' or `run=false' (the shape $GITHUB_OUTPUT takes)
#   stderr   why
#   exit     0 when it answered; anything else gives no answer, and the workflow then runs
#            everything (see the `changes' job in .github/workflows/ci.yml)
#
# `run=false' is only for a pull request whose whole diff is under docs/. Nothing in the build,
# the tests or the image reads docs/: a change that starts reading it must remove the skip here
# in the same pull request.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: ci-needed.sh <event_name>" >&2
  exit 2
fi

if [[ "$1" != pull_request ]]; then
  echo "ci-needed: $1 is not a pull request, running everything" >&2
  echo run=true
  exit 0
fi

# A pull request is checked out as its merge commit, whose first parent is the base tip.
# --no-renames: a file moved into docs/ is also listed where it was deleted.
changed="$(git diff --name-only --no-renames HEAD^1 HEAD)"

if [[ -z "$changed" ]]; then
  echo "ci-needed: empty diff, running everything" >&2
  echo run=true
  exit 0
fi

while IFS= read -r path; do
  if [[ "$path" != docs/* ]]; then
    echo "ci-needed: $path is outside docs/, running everything" >&2
    echo run=true
    exit 0
  fi
done <<<"$changed"

echo "ci-needed: only docs/ changed, skipping the checks" >&2
echo run=false
