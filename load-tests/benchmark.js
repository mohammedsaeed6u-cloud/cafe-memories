const http = require('http');
const https = require('https');

const targetUrl = process.env.TARGET_URL || 'https://cafe-memories.vercel.app';
const CONCURRENT_WORKERS = 20;
const TOTAL_REQUESTS = 200;

console.log('================================================================');
console.log(' CAFÉ MEMORIES 1M+ SCALE SYNTHETIC BENCHMARK HARNESS');
console.log(` Target: ${targetUrl}`);
console.log(` Concurrency: ${CONCURRENT_WORKERS} workers | Total Requests: ${TOTAL_REQUESTS}`);
console.log('================================================================\n');

const latencies = [];
let completed = 0;
let failed = 0;
const startTime = Date.now();

function executeRequest(workerId) {
  return new Promise((resolve) => {
    const reqStart = Date.now();
    const endpoint = '/api/health';
    const parsedUrl = new URL(endpoint, targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(parsedUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - reqStart;
        latencies.push(duration);
        completed++;
        if (res.statusCode >= 200 && res.statusCode < 400) {
          process.stdout.write('.');
        } else {
          failed++;
          process.stdout.write('x');
        }
        resolve();
      });
    });

    req.on('error', () => {
      failed++;
      completed++;
      process.stdout.write('E');
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      failed++;
      completed++;
      process.stdout.write('T');
      resolve();
    });
  });
}

async function runBenchmark() {
  const chunks = Math.ceil(TOTAL_REQUESTS / CONCURRENT_WORKERS);

  for (let c = 0; c < chunks; c++) {
    const promises = [];
    for (let w = 0; w < CONCURRENT_WORKERS; w++) {
      if (completed + promises.length < TOTAL_REQUESTS) {
        promises.push(executeRequest(w));
      }
    }
    await Promise.all(promises);
  }

  const totalTimeSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.90)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (completed / totalTimeSec).toFixed(1);

  console.log('\n\n==================== BENCHMARK RESULTS ====================');
  console.log(` Total Completed: ${completed} | Failed: ${failed}`);
  console.log(` Total Duration:  ${totalTimeSec.toFixed(2)}s`);
  console.log(` Throughput:      ${rps} req/sec`);
  console.log(` p50 Latency:     ${p50} ms`);
  console.log(` p90 Latency:     ${p90} ms`);
  console.log(` p95 Latency:     ${p95} ms`);
  console.log(` p99 Latency:     ${p99} ms`);
  console.log('===========================================================\n');
}

runBenchmark();
