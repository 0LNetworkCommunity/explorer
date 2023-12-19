FROM node:20.10.0

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

REDIS_HOST="127.0.0.1"

EXPOSE 3000

CMD ["npm", "run", "start:prod"]