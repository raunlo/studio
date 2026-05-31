#!/bin/sh
# Run once after cloning to register the pnpm-lock.yaml merge driver.
# This prevents conflicts in pnpm-lock.yaml when merging branches.
git config merge.pnpm-lock.name "pnpm lock file merge driver"
git config merge.pnpm-lock.driver "node -e \"require('fs').copyFileSync(process.argv[3], process.argv[1])\" %O %A %B && pnpm install --no-frozen-lockfile"
git config merge.pnpm-lock.recursive binary
echo "pnpm merge driver registered."
