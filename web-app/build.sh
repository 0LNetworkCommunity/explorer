#!/bin/bash

npm run build

CI_COMMIT_SHA="$(git rev-parse --short HEAD)"

docker build \
  --build-arg CI_COMMIT_SHA="$CI_COMMIT_SHA" \
  --file ./docker/Dockerfile \
  --tag "registry.gitlab.com/0lfyi/explorer/web-app:$CI_COMMIT_SHA" \
  .
