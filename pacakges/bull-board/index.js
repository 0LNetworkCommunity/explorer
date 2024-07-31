require("dotenv").config();

const Redis = require("ioredis");
const express = require("express");
const { Queue } = require("bullmq");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: !!process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : undefined,
  maxRetriesPerRequest: null,
});

const queueNames = process.env.QUEUE_NAMES.split(",");

const queues = queueNames.map((name) => new Queue(name, { connection: redis }));

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");

createBullBoard({
  queues: queues.map((queue) => new BullMQAdapter(queue)),
  serverAdapter: serverAdapter,
});

const app = express();
app.use("/", serverAdapter.getRouter());

const port = !!process.env.PORT ? parseInt(process.env.PORT, 10) : 8006;
const server = app.listen(port, () => {
  const addr = server.address();
  if (addr && typeof addr !== 'string') {
    const host = (addr.family === 'IPv6')
      ? `[${addr.address}]:${addr.port}`
      : `${addr.address}:${addr.port}`;
    console.log(`Serving at http://${host}"`);
  }
});
