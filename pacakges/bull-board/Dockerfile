FROM node:20.16.0

ENV TZ=UTC

RUN set -ex; \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime; \
    echo $TZ > /etc/timezone;

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm ci
COPY ./ ./

ENV NODE_ENV="production"

ENV REDIS_HOST="127.0.0.1"
ENV REDIS_PORT="6379"

ENV QUEUE_NAMES=""

ENV PORT="8080"
EXPOSE 8080

CMD ["npm", "start"]
