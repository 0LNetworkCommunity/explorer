FROM clickhouse/clickhouse-server:23.8.4.69 as clickhouse

###############################################

FROM rust:1.75.0 as transformerBuilder
WORKDIR /usr/src/myapp
COPY ./transformer .
RUN cargo install --path .

###############################################

FROM node:20.11.0

COPY --from=clickhouse /usr/bin/clickhouse-client /usr/bin/clickhouse-client
COPY --from=transformerBuilder /usr/local/cargo/bin/transformer /usr/local/bin/transformer

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN ["npm", "ci"]
COPY ./ ./

RUN ["npm", "run", "build"]

ENV NODE_ENV="production"

ARG CI_COMMIT_SHA=""
ENV CI_COMMIT_SHA=$CI_COMMIT_SHA

ENV REDIS_HOST="127.0.0.1"
ENV REDIS_PORT="6379"

ENV S3_REGION="fr-par"
ENV S3_ENDPOINT="https://s3.fr-par.scw.cloud"
ENV S3_ACCESS_KEY_ID="********************"
ENV S3_SECRET_ACCESS_KEY="************************************"
ENV S3_BUCKET="0lfyi-v7"
ENV S3_STORAGE_CLASS="ONEZONE_IA"

ENV CLICKHOUSE_HTTP_HOST="127.0.0.1"
ENV CLICKHOUSE_HTTP_USERNAME="ol_rw"
ENV CLICKHOUSE_HTTP_PASSWORD="********************************"
ENV CLICKHOUSE_PORT="8123"
ENV CLICKHOUSE_DATABASE="olfyi"

EXPOSE 3000

CMD ["npm", "run", "start:prod"]