const { randomUUID } = require('crypto');
const fs = require('fs');

const BASE_URL = process.argv[2] || process.env.BASE_URL;
const PLATFORM = process.argv[3] || process.env.PLATFORM || 'unknown';
const RUNS = parseInt(process.argv[4] || process.env.RUNS || '25', 10);

if (!BASE_URL) {
  console.error('Usage: node scripts/run-trials.js <baseUrl> <platform> <runs>');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(index) {
  const runId = randomUUID();
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, platform: PLATFORM })
    });
    const durationMs = Date.now() - start;
    const body = await res.json().catch(() => ({}));
    return { runId, index, httpStatus: res.status, durationMs, ok: res.ok, body };
  } catch (err) {
    const durationMs = Date.now() - start;
    return { runId, index, httpStatus: null, durationMs, ok: false, error: err.message };
  }
}

async function main() {
  const results = [];

  for (let i = 0; i < RUNS; i++) {
    console.log(`Run ${i + 1}/${RUNS} against ${PLATFORM} (${BASE_URL})...`);
    const result = await runOnce(i);
    results.push(result);
    console.log(`  -> ${result.ok ? 'success' : 'failed'} in ${result.durationMs}ms`);

    // Space runs out to smooth over cold start variance and stay well under
    // Groq's free-tier rate limit.
    const pause = 5000 + Math.random() * 10000;
    await sleep(pause);
  }

  const filename = `trial-results-${PLATFORM}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${filename}`);

  const successes = results.filter((r) => r.ok);
  console.log(`Success rate: ${successes.length}/${RUNS}`);
}

main();
