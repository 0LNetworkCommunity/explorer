# 0L Explorer

# Structure of this repo:

This repository contains the code for the 0L Network explorer and is
structured in the following way:

- `api`: This directory contains the backend in `Nest.js`, the source for `transformer` binary
  and the required migration files.
- `infra`: This directory contains the K8s YAML files for deployment on K8s.
- `ol-fyi-local-infra`: This directory contains files for setting up the databases locally using docker-compose.
- `web-app`: This directory contains the client-side code for the 0L Explorer app.


# Local Setup:

This documentation will walk you through setting up and running the Wallet Explorer project locally from scratch. Follow these steps carefully to ensure a smooth setup process:

Prerequisites
--------------

Before you begin, ensure you have the following installed on your system:

1. Docker: [Install Docker](https://docs.docker.com/get-docker/)
2. Node.js and npm:
  * Install nvm (Node Version Manager) from the [nvm GitHub repository](https://github.com/nvm-sh/nvm#installing-and-updating).
  * Use nvm to install and use the Node.js version specified in your project's .nvmrc file:
     ```bash
     nvm install
     nvm use
     ```

3. Rust and Cargo: [Install Rust](https://www.rust-lang.org/tools/install)

Once you are set, follow the steps:

- First, set up all the necessary components using Docker Compose.

- Navigate to the `ol-fyi-local-infra` directory.

   ```bash
   cd ./ol-fyi-local-infra  
   ```

- Once you are in the `ol-fyi-local-infra` directory, run:

   ```bash
   docker compose up -d
   ```

This brings all the databases up:

- Redis
- Clickhouse
- NATS
- Postgres

Check the status using:

```bash
docker ps
```

Running Clickhouse Migrations
------------------------------

Once the Clickhouse database is up and running,
you can connect to it and execute using:

```bash 
docker compose exec -it clickhouse clickhouse client -h "127.0.0.1" --port 9000 -u "olfyi" --password "olfyi" -n
```

After connecting to the clickhouse client, execute the queries to
run the migrations stored in the `tables_local.sql` file manually.

Building the Transformer Binary
---------------------------------

Navigate to the transformer directory and build the project:

```bash 
cd ./api/transformer
```

Build the binary:

```bash 
cargo build
```

Run the backend
----------------

Navigate to `api` directory.

```bash
cd api
```

## Prerequisites

```bash
nvm install
nvm use
```


## PostgreSQL

We use (Primsa)[https://www.prisma.io/].

- Run `npx prisma generate` if you update `api/prisma/schema.prisma`.
- Run `npx prisma db push` to migrate the database.



## Installation

First, install the project dependencies:

```bash
npm install
```

Don't forget to configure the `.env` on your machine

```bash
cp .env.example .env
```

## Running the app

To run your Nest application, use the following commands:

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```


Run the client:
----------------

Once the backend is running, run the client,

```bash
cd web-app
```

First, install the project dependencies:

```bash
npm install
```

And run it with:

```bash
npm run dev
```
