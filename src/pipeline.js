const wiki = require('./wikipedia');
const groq = require('./groq');
const { logStep } = require('./log');

const TOPICS = [
  {
    key: 'printing_press',
    title: 'Printing press',
    supportQuery: 'Printing press impact on society'
  },
  {
    key: 'internet',
    title: 'Internet',
    supportQuery: 'Internet impact on society'
  }
];

async function summarizeSource(log, label, topicTitle, title) {
  await log(`extract:${label}`, 'start');
  const extract = await wiki.getExtract(title);
  await log(`extract:${label}`, 'done');

  await log(`summarize:${label}`, 'start');
  const summary = await groq.summarize(topicTitle, extract);
  await log(`summarize:${label}`, 'done');

  return summary;
}

async function runPipeline(runId, platform) {
  const log = (step, status) => logStep(runId, platform, step, status);
  const summaries = {};

  for (const topic of TOPICS) {
    const topicSummaries = [];

    await log(`resolve:${topic.key}_main`, 'start');
    const mainTitle = await wiki.resolveTitle(topic.title);
    await log(`resolve:${topic.key}_main`, 'done');
    topicSummaries.push(await summarizeSource(log, `${topic.key}_main`, topic.title, mainTitle));

    await log(`resolve:${topic.key}_support`, 'start');
    const supportTitle = await wiki.resolveTitle(topic.supportQuery);
    await log(`resolve:${topic.key}_support`, 'done');
    topicSummaries.push(await summarizeSource(log, `${topic.key}_support`, topic.title, supportTitle));

    summaries[topic.key] = topicSummaries;
  }

  await log('compare', 'start');
  const comparison = await groq.compare(summaries);
  await log('compare', 'done');

  await log('initial_verdict', 'start');
  const initialVerdict = await groq.verdict(comparison);
  await log('initial_verdict', 'done');

  await log('counterargument', 'start');
  const counterargument = await groq.counterargument(comparison, initialVerdict);
  await log('counterargument', 'done');

  await log('final_verdict', 'start');
  const finalVerdict = await groq.finalVerdict(comparison, initialVerdict, counterargument);
  await log('final_verdict', 'done');

  return { comparison, initialVerdict, counterargument, finalVerdict };
}

module.exports = { runPipeline, TOPICS };
