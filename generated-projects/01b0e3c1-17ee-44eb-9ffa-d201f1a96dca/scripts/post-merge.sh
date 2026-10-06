#!/bin/bash
set -e
npm install --prefer-offline --no-audit --no-fund < /dev/null
npx drizzle-kit push < /dev/null 2>&1 || true
