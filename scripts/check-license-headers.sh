#!/usr/bin/env bash
# Check Apache-2.0 license headers on web source files.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATTERN='Licensed under the Apache License, Version 2.0'
MISSING=0

while IFS= read -r -d '' file; do
  if ! head -n 20 "$file" | grep -q "$PATTERN"; then
    echo "Missing license header: $file"
    MISSING=$((MISSING + 1))
  fi
done < <(find "$ROOT" \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -print0)

if [[ "$MISSING" -gt 0 ]]; then
  echo "ERROR: $MISSING file(s) missing Apache 2.0 license header"
  exit 1
fi

echo "License header check passed"
