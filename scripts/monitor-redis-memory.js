#!/usr/bin/env node

const { createClient } = require('redis');
const readline = require('readline');

// Create a Redis client
const client = createClient({
  url: 'redis://localhost:6379',
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function monitorRedisMemory() {
  await client.connect();

  console.log('Redis Memory Usage Monitor');
  console.log('Press Ctrl+C to exit\n');

  // Initial header
  console.log('Time             | Used Memory | Peak | Fragmentation | Keys | Clients');
  console.log('--------------------------------------------------------------------------------');

  // Set up interval for monitoring
  const interval = setInterval(async () => {
    try {
      // Get memory info
      const info = await client.info('memory');
      const stats = await client.info('stats');
      const clients = await client.info('clients');

      // Parse values
      const usedMemory = parseInt(info.match(/used_memory_human:(.*)/)[1]);
      const usedMemoryPeak = parseInt(info.match(/used_memory_peak_human:(.*)/)[1]);
      const memFragmentation = parseFloat(info.match(/mem_fragmentation_ratio:(.*)/)[1]);
      const totalKeys = parseInt(stats.match(/keyspace_hits:(\d+)/)[1]) +
                        parseInt(stats.match(/keyspace_misses:(\d+)/)[1]);
      const connectedClients = parseInt(clients.match(/connected_clients:(\d+)/)[1]);

      // Get current time
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Clear line and write new data
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);

      console.log(`${now} | ${usedMemory.padEnd(11)} | ${usedMemoryPeak.padEnd(4)} | ${memFragmentation.toFixed(2).padEnd(13)} | ${totalKeys.toString().padEnd(4)} | ${connectedClients}`);

      // Get queue details if BullMQ is used
      const queues = await client.keys('bull:*');
      if (queues.length > 0) {
        console.log('\nQueue Status:');
        for (const queue of queues) {
          if (queue.includes(':id:')) continue; // Skip job data keys

          const jobCount = await client.lLen(queue);
          console.log(`  ${queue}: ${jobCount} jobs`);
        }
        console.log();
      }
    } catch (err) {
      console.error('Error fetching Redis info:', err);
    }
  }, 5000); // Update every 5 seconds

  // Handle shutdown
  process.on('SIGINT', async () => {
    clearInterval(interval);
    await client.quit();
    console.log('\nMonitoring stopped');
    process.exit(0);
  });
}

monitorRedisMemory().catch(console.error);
