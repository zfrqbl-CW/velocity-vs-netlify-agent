const express = require('express');
const { randomUUID } = require('crypto');
const { recordEvent, getResults } = require('./log');
const { runPipeline } = require('./pipeline');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/run', async (req, res) => {
  const runId = req.body.runId || randomUUID();
  const platform = req.body.platform || 'unknown';
  try {
    const result = await runPipeline(runId, platform);
    res.json({ runId, platform, ...result });
  } catch (err) {
    res.status(500).json({ runId, platform, error: err.message });
  }
});

// Every deployed copy exposes this route. Only the Velocity deployment is
// actually used as the store: Netlify's copy forwards its own events here
// via the LOG_ENDPOINT environment variable instead of keeping them locally.
app.post('/log', (req, res) => {
  recordEvent(req.body);
  res.status(204).end();
});

app.get('/results', (req, res) => {
  res.json(getResults());
});

module.exports = app;
