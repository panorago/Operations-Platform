#!/usr/bin/env bash
set -eu
cd /workspace/Operations-Platform
npm ci
npm run build
