#!/bin/bash

set -ex

CI_COMMIT_SHA="$(git rev-parse --short HEAD)"

docker build \
  --build-arg CI_COMMIT_SHA="$CI_COMMIT_SHA" \
  --file ./docker/Dockerfile \
  --tag "ghcr.io/minaxolone/explorer/web-app:$CI_COMMIT_SHA" \
  .
