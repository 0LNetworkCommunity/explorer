FROM rust:1-bookworm as transformerBuilder
WORKDIR /usr/src/myapp
COPY ./transformer .
RUN cargo install --path .

###############################################

FROM node:20.12.2

COPY --from=transformerBuilder /usr/local/cargo/bin/transformer /usr/local/bin/transformer

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN ["npm", "ci"]
COPY ./ ./

RUN ["npx", "prisma", "generate"]
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

ENV CLICKHOUSE_HOST="127.0.0.1"
ENV CLICKHOUSE_USERNAME="ol_rw"
ENV CLICKHOUSE_PASSWORD="********************************"
ENV CLICKHOUSE_PORT="8123"
ENV CLICKHOUSE_DATABASE="olfyi"

ENV DATA_API_HOST="https://data.0l.fyi"

ENV PORT="3000"

EXPOSE 3000

CMD ["npm", "run", "start:prod"]