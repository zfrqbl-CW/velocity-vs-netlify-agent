const runs = {};

function recordEvent({ runId, platform, step, status, timestamp }) {
  if (!runId || !step) return;
  if (!runs[runId]) runs[runId] = { runId, platform, events: [] };
  runs[runId].events.push({ step, status, timestamp: timestamp || Date.now() });
}

async function logStep(runId, platform, step, status) {
  const event = { runId, platform, step, status, timestamp: Date.now() };

  if (process.env.LOG_ENDPOINT) {
    try {
      await fetch(process.env.LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      return;
    } catch (err) {
      // A logging failure should never take down the pipeline itself.
      console.error('log forward failed:', err.message);
      return;
    }
  }

  recordEvent(event);
}

function getResults() {
  return Object.values(runs);
}

module.exports = { logStep, recordEvent, getResults };
