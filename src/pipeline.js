const wiki = require('./wikipedia');
const groq = require('./groq');
const { logStep } = require('./log');

const TOPICS = [
  {
    key: 'printing_press',
    title: 'Printing press',
    supportQueries: ['Printing press impact on society', 'History of printing']
  },
  {
    key: 'internet',
    title: 'Internet',
    supportQueries: ['Internet impact on society', 'History of the Internet']
  }
];

const DIMENSIONS = [
  { key: 'reach', label: 'reach' },
  { key: 'speed_of_adoption', label: 'speed of adoption' },
  { key: 'societal_effect', label: 'societal effect' },
  { key: 'durability', label: 'durability' }
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

    for (let i = 0; i < topic.supportQueries.length; i++) {
      const label = `${topic.key}_support${i + 1}`;
      await log(`resolve:${label}`, 'start');
      const title = await wiki.resolveTitle(topic.supportQueries[i]);
      await log(`resolve:${label}`, 'done');
      topicSummaries.push(await summarizeSource(log, label, topic.title, title));
    }

    summaries[topic.key] = topicSummaries;
  }

  const dimensionResults = [];
  for (const dimension of DIMENSIONS) {
    await log(`compare:${dimension.key}`, 'start');
    const result = await groq.compareDimension(dimension.label, summaries);
    await log(`compare:${dimension.key}`, 'done');
    dimensionResults.push(`${dimension.label}:\n${result}`);
  }
  const comparison = dimensionResults.join('\n\n');

  await log('initial_verdict', 'start');
  const initialVerdict = await groq.verdict(comparison);
  await log('initial_verdict', 'done');

  await log('counterargument_1', 'start');
  const counterargument1 = await groq.counterargument(comparison, initialVerdict);
  await log('counterargument_1', 'done');

  await log('final_verdict_1', 'start');
  const finalVerdict1 = await groq.finalVerdict(comparison, initialVerdict, counterargument1);
  await log('final_verdict_1', 'done');

  await log('counterargument_2', 'start');
  const counterargument2 = await groq.counterargument(comparison, finalVerdict1);
  await log('counterargument_2', 'done');

  await log('final_verdict_2', 'start');
  const finalVerdict2 = await groq.finalVerdict(comparison, finalVerdict1, counterargument2);
  await log('final_verdict_2', 'done');

  return {
    comparison,
    initialVerdict,
    counterargument1,
    finalVerdict1,
    counterargument2,
    finalVerdict2
  };
}

module.exports = { runPipeline, TOPICS };
