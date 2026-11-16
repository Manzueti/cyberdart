#!/usr/bin/env bash
# Stage and publish cyberdart to a Buildkite npm package registry.
#
#   scripts/publish-buildkite.sh <registry-url>            # dry run (default)
#   scripts/publish-buildkite.sh <registry-url> --publish  # real upload
#
# <registry-url> is the registry's npm endpoint, e.g.
#   https://packages.buildkite.com/<org>/<registry>/npm/
# Auth: BUILDKITE_REGISTRY_TOKEN (a registry token with publish rights) is
# written to a throwaway .npmrc inside the staging dir, never to ~/.npmrc.
#
# What gets published:
#   - git-tracked source only (no node_modules, no untracked files)
#   - excludes */dist/ (Mach-O arm64 binaries), test/, */test/, .github/
#   - version: VERSION X.Y.Z.0 -> X.Y.Z (npm requires 3-part semver)
#   - `bin` is dropped: those point at compiled binaries that ./setup
#     builds per platform after install.
set -euo pipefail

REGISTRY_URL="${1:-}"
MODE="${2:---dry-run}"
if [[ -z "$REGISTRY_URL" ]]; then
  echo "usage: $0 <registry-url> [--publish]" >&2
  exit 2
fi
[[ "$REGISTRY_URL" == */ ]] || REGISTRY_URL="$REGISTRY_URL/"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FULL_VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"
if [[ ! "$FULL_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "VERSION '$FULL_VERSION' is not X.Y.Z.W" >&2
  exit 1
fi
if [[ "${BASH_REMATCH[4]}" != "0" ]]; then
  echo "VERSION '$FULL_VERSION' has a non-zero 4th part; no lossless semver mapping." >&2
  echo "Bump to the next X.Y.Z.0 or choose a mapping before publishing." >&2
  exit 1
fi
SEMVER="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.${BASH_REMATCH[3]}"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cd "$ROOT"
git ls-files -z \
  | grep -zvE '(^|/)dist/|(^|/)test/|^\.github/' \
  | xargs -0 cp -P --parents -t "$STAGE"

# Rewrite only the staged copy's package.json, never the repo's.
(cd "$STAGE" && SEMVER="$SEMVER" FULL_VERSION="$FULL_VERSION" node -e '
  const fs = require("fs");
  const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
  p.version = process.env.SEMVER;
  p.cyberdartVersion = process.env.FULL_VERSION;
  delete p.bin;
  fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
')

if [[ -n "${BUILDKITE_REGISTRY_TOKEN:-}" ]]; then
  HOST_PATH="${REGISTRY_URL#https:}"
  printf '%s:_authToken=%s\n' "$HOST_PATH" "$BUILDKITE_REGISTRY_TOKEN" > "$STAGE/.npmrc"
fi

cd "$STAGE"
echo "Staged cyberdart@$SEMVER (from $FULL_VERSION) -> $REGISTRY_URL"
if [[ "$MODE" == "--publish" ]]; then
  if [[ -z "${BUILDKITE_REGISTRY_TOKEN:-}" ]]; then
    echo "BUILDKITE_REGISTRY_TOKEN is not set" >&2
    exit 1
  fi
  npm publish --registry "$REGISTRY_URL" --ignore-scripts
else
  npm publish --registry "$REGISTRY_URL" --ignore-scripts --dry-run
fi
