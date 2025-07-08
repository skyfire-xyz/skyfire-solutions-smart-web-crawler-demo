#!/bin/bash
set -e

echo "Installing dependencies..."
yarn install --frozen-lockfile

echo "Checking if TypeScript is available..."
npx tsc --version

echo "Building TypeScript..."
npx tsc

echo "Build completed successfully!" 