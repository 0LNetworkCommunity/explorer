#########################################
#              FIRST STAGE              #
#########################################

# FROM node:20.11.0 AS builder
# WORKDIR /app
#
# ARG CI_COMMIT_SHA=""
# ENV VITE_CI_COMMIT_SHA $CI_COMMIT_SHA
#
# ENV VITE_API_HOST "https://api.0l.fyi"
#
# COPY ./package.json ./package-lock.json ./
# RUN npm ci
# COPY ./ ./
#
# RUN npm run build

#########################################
#             SECOND STAGE              #
#########################################

FROM nginx:1.25

# COPY --from=builder /app/dist /app
COPY ./dist /app
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
