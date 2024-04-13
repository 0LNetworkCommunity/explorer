
#!/bin/bash

set -ex

CI_COMMIT_SHA="$(git rev-parse --short HEAD)"

docker build \
  --build-arg CI_COMMIT_SHA="$CI_COMMIT_SHA" \
  --file ./Dockerfile \
  --tag "ghcr.io/0lnetworkcommunity/explorer/api:$CI_COMMIT_SHA" \
  .
