# velocity-vs-netlify-agent

One Express app (`src/app.js`), deployed unchanged to Netlify Functions and
Cloudways Velocity, running a fixed multi-step research pipeline: resolve two
Wikipedia subjects, pull four article extracts, summarize each with Groq,
compare them, and produce a verdict. The only difference between the two
deployments is the entry point that wires the same app to each platform's
process model.

## What's shared vs. what differs

- Shared, byte-for-byte identical: `src/app.js`, `src/pipeline.js`,
  `src/wikipedia.js`, `src/groq.js`, `src/log.js`.
- Velocity-only: `server.js` (three lines, calls `app.listen`).
- Netlify-only: `netlify/functions/app.js` (two lines, wraps the same app
  with `serverless-http`) and `netlify.toml` (routes plain paths to the
  function).

## Prerequisites

- A free Groq API key: https://console.groq.com/keys (no credit card).
- A GitHub repo containing this project (both platforms deploy from Git).
- A Netlify account (free tier) and a Cloudways account with a Velocity plan.

## Deploying to Velocity

1. Push this repo to GitHub.
2. In Cloudways, launch a Velocity application and connect the repo.
3. Set the entry file to `server.js`.
4. Add environment variables: `GROQ_API_KEY`. Leave `LOG_ENDPOINT` unset,
   this deployment is the canonical log store.
5. Deploy. Note the app's public URL, you'll need it for `LOG_ENDPOINT` on
   the Netlify side and for running trials.

## Deploying to Netlify

1. Connect the same repo as a new Netlify site.
2. Netlify will pick up `netlify.toml` automatically.
3. Add environment variables: `GROQ_API_KEY`, and `LOG_ENDPOINT` set to
   `https://<your-velocity-app-domain>/log`.
4. Deploy. Note the site's public URL.

## Running the trials

From your own machine (this needs real network access, it won't run inside
a sandboxed tool environment):

```bash
npm install
node scripts/run-trials.js https://<velocity-url> velocity 25
node scripts/run-trials.js https://<netlify-url> netlify 25
```

Each command writes a local `trial-results-<platform>-<timestamp>.json`
with the externally observed timing and status for every run.

## Reading the detailed step logs

Every step of every run, on both platforms, lands in Velocity's in-memory
store, since Netlify forwards its events there via `LOG_ENDPOINT`. Pull the
full step-by-step trace at any time:

```bash
curl https://<velocity-url>/results
```

This is what lets you see exactly which step a failed Netlify run died on,
not just that it failed.

## Notes

- The comparison question (printing press vs. internet) is fixed in
  `src/pipeline.js` under `TOPICS`, so every trial run does the same amount
  of work. Change it there if you want a different comparison, but keep it
  fixed across all trials for a fair comparison.
- The in-memory store in `src/log.js` resets if the Velocity process
  restarts. For anything beyond a one-off experiment, swap it for a file or
  a database, the route shapes (`/log`, `/results`) won't need to change.
