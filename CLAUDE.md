# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the 0L Network Explorer, a full-stack application for exploring the 0L blockchain. The repository contains:

- **api/**: NestJS GraphQL backend with ClickHouse integration for blockchain data
- **web-app/**: React frontend with TypeScript and Vite
- **api/transformer/**: Rust binary for data transformation
- **infra/**: Kubernetes deployment configurations
- **ol-fyi-local-infra/**: Docker Compose setup for local development

## Common Development Commands

### API (Backend)
```bash
cd api
npm install
npm run start:dev    # Development with hot reload
npm run build        # Build production
npm run test         # Run Jest tests
npm run test:e2e     # End-to-end tests
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
npx prisma generate  # Generate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
```

### Web App (Frontend)
```bash
cd web-app
npm install
npm run dev          # Vite development server
npm run build        # TypeScript compilation + Vite build
npm run lint         # ESLint
npm run preview      # Preview production build
npm run prettier-check  # Check formatting
npm run prettier-fix    # Fix formatting
```

### Transformer (Rust)
```bash
cd api/transformer
cargo build          # Build the binary
```

## Architecture Overview

### Backend Architecture (NestJS)
- **GraphQL API** with Apollo Server and subscriptions
- **Modular structure** with feature-based modules (accounts, validators, transactions, stats)
- **Database layers**: PostgreSQL (Prisma) for app data, ClickHouse for blockchain analytics
- **Background processing** with BullMQ queues and Redis
- **External integrations**: S3, Firebase, NATS messaging
- **Role-based workers** configured via ROLES environment variable

Key modules:
- `OlModule`: Core blockchain data handling
- `StatsModule`: Analytics and metrics
- `NodeWatcherModule`: Network monitoring
- `ValidatorsModule`: Validator information
- `TransactionsModule`: Transaction processing with factory pattern

### Frontend Architecture (React)
- **React 18** with TypeScript and Vite
- **Routing** with React Router v6
- **State management** via Apollo Client for GraphQL
- **Styling** with Styled Components and Tailwind CSS
- **Charts** using ECharts for data visualization
- **Wallet integration** with Aptos wallet adapters

Component structure:
- `modules/core/`: App setup, routing, Apollo client
- `modules/core/routes/`: Page components (Account, Stats, Validators, etc.)
- `modules/ui/`: Reusable UI components
- `modules/interface/`: TypeScript interfaces

### Data Flow
1. Blockchain data ingested via background processors
2. Raw data transformed by Rust transformer binary  
3. Processed data stored in ClickHouse and PostgreSQL
4. GraphQL resolvers query databases
5. React frontend consumes GraphQL API with real-time subscriptions

## Local Development Setup

1. **Prerequisites**: Docker, Node.js 20.11+, Rust
2. **Start databases**: `cd ol-fyi-local-infra && docker compose up -d`
3. **ClickHouse setup**: Connect and run migrations from `api/tables_local.sql`
4. **Build transformer**: `cd api/transformer && cargo build`
5. **API setup**: `cd api && npm install && cp .env.example .env`
6. **Frontend setup**: `cd web-app && npm install`
7. **Run API**: `npm run start:dev` (from api/)
8. **Run frontend**: `npm run dev` (from web-app/)

## Key Technologies

- **Backend**: NestJS, GraphQL, Prisma, ClickHouse, BullMQ, Redis, NATS
- **Frontend**: React, TypeScript, Apollo Client, Styled Components, ECharts
- **Infrastructure**: Docker, Kubernetes, PostgreSQL, ClickHouse
- **Blockchain**: Aptos SDK for 0L Network integration

## Testing Strategy

- API uses Jest for unit and e2e tests
- Frontend uses ESLint for code quality
- Prisma for database schema management
- Both projects use Prettier for code formatting