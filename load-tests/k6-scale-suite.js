import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // 1. Sustained Baseline (2,000 VUs)
    baseline_traffic: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
    },
    // 2. Morning Coffee Rush Surge (10,000 VUs burst peak)
    morning_rush_surge: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 10000,
      stages: [
        { target: 1000, duration: '1m' }, // Ramp up to 1,000 RPS
        { target: 5000, duration: '2m' }, // Peak burst at 5,000 RPS
        { target: 5000, duration: '1m' }, // Hold 5,000 RPS
        { target: 200, duration: '1m' },  // Recovery
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% failure rate
    http_req_duration: ['p(95)<120', 'p(99)<250'], // 95% of requests under 120ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://cafe-memories.vercel.app';

export default function () {
  const randomSlug = 'table-01';

  // Step 1: Guest scans QR Code
  const qrRes = http.get(`${BASE_URL}/api/v1/qr/${randomSlug}`);
  check(qrRes, {
    'QR status is 200': (r) => r.status === 200,
    'QR latency < 80ms': (r) => r.timings.duration < 80,
  });

  sleep(0.5);

  // Step 2: System Health Telemetry Check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'Health status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
