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

async function runPipeline(runId, platform) {
  const log = (step, status) => logStep(runId, platform, step, status);
  const articles = {};

  for (const topic of TOPICS) {
    await log(`resolve:${topic.key}`, 'start');
    const mainTitle = await wiki.resolveTitle(topic.title);
    await log(`resolve:${topic.key}`, 'done');

    await log(`resolve:${topic.key}_support`, 'start');
    const supportTitle = await wiki.resolveTitle(topic.supportQuery);
    await log(`resolve:${topic.key}_support`, 'done');

    await log(`extract:${topic.key}`, 'start');
    const mainExtract = await wiki.getExtract(mainTitle);
    await log(`extract:${topic.key}`, 'done');

    await log(`extract:${topic.key}_support`, 'start');
    const supportExtract = await wiki.getExtract(supportTitle);
    await log(`extract:${topic.key}_support`, 'done');

    await log(`summarize:${topic.key}`, 'start');
    const mainSummary = await groq.summarize(topic.title, mainExtract);
    await log(`summarize:${topic.key}`, 'done');

    await log(`summarize:${topic.key}_support`, 'start');
    const supportSummary = await groq.summarize(topic.title, supportExtract);
    await log(`summarize:${topic.key}_support`, 'done');

    articles[topic.key] = { mainSummary, supportSummary };
  }

  await log('compare', 'start');
  const comparison = await groq.compare(articles);
  await log('compare', 'done');

  await log('verdict', 'start');
  const verdict = await groq.verdict(comparison);
  await log('verdict', 'done');

  return { comparison, verdict };
}

module.exports = { runPipeline, TOPICS };
