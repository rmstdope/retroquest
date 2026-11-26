#!/usr/bin/env bash
#
# Installs the browser the end-to-end tests drive, with its system packages,
# trying again when it fails: the packages come from Ubuntu's mirrors, whose
# outages otherwise turn a CI check red (rq-vjbs). Run from web/:
#
#     bash ../.github/scripts/install-playwright.sh
#
#   env    RETRY_DELAY_S  seconds waited after the first failure, doubled
#                         after the second (default 30)
#   exit   0 when an attempt worked, else the last attempt's status

set -uo pipefail

attempts=3
delay="${RETRY_DELAY_S:-30}"

for ((attempt = 1; ; attempt++)); do
  npx playwright install --with-deps chromium && exit 0
  status=$?
  if ((attempt == attempts)); then
    echo "install-playwright: failed $attempts times" >&2
    exit "$status"
  fi
  echo "::warning::Browser install failed (attempt $attempt of $attempts), trying again"
  sleep $((delay * attempt))
done
