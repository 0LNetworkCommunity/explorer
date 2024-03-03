#!/bin/bash

set -ex

mkdir -p \
  ./volumes/clickhouse/var/lib/clickhouse \
  ./volumes/postgres/var/lib/postgresql/data

docker compose up -d

docker compose exec -T clickhouse \
  clickhouse-client \
    --host "127.0.0.1" \
    --port 9000 \
    --user "olfyi" \
    --password "olfyi" \
    --database olfyi \
    --multiquery < ../api/tables.sql
