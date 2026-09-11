const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

async function callGroq(messages) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.3 })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function summarize(topic, extract) {
  return callGroq([
    {
      role: 'system',
      content:
        'You summarize Wikipedia article text into 3 to 5 factual bullet points relevant to a historical impact comparison. Be concise and stick to the source text.'
    },
    { role: 'user', content: `Topic: ${topic}\n\nArticle text:\n${extract}` }
  ]);
}

async function compareDimension(dimension, summaries) {
  const prompt = Object.entries(summaries)
    .map(([key, list]) => `${key}:\n${list.map((s, i) => `Source ${i + 1}: ${s}`).join('\n')}`)
    .join('\n\n');
  return callGroq([
    {
      role: 'system',
      content: `Compare the two subjects specifically on ${dimension}, using only the summaries provided. Be specific and concise.`
    },
    { role: 'user', content: prompt }
  ]);
}

async function verdict(comparison) {
  return callGroq([
    {
      role: 'system',
      content:
        'Based on the comparison provided, state a clear verdict on which subject had the greater long-term impact on human civilization, with a short justification.'
    },
    { role: 'user', content: comparison }
  ]);
}

async function counterargument(comparison, priorVerdict) {
  return callGroq([
    {
      role: 'system',
      content:
        'Make the strongest possible case against the verdict just given, using only the comparison provided. Be specific and concise.'
    },
    { role: 'user', content: `Comparison:\n${comparison}\n\nVerdict to challenge:\n${priorVerdict}` }
  ]);
}

async function finalVerdict(comparison, priorVerdict, counterargumentText) {
  return callGroq([
    {
      role: 'system',
      content:
        'Weigh the prior verdict against the counterargument and state a revised verdict on which subject had the greater long-term impact on human civilization. Note explicitly whether the counterargument changed the conclusion.'
    },
    {
      role: 'user',
      content: `Comparison:\n${comparison}\n\nPrior verdict:\n${priorVerdict}\n\nCounterargument:\n${counterargumentText}`
    }
  ]);
}

module.exports = { summarize, compareDimension, verdict, counterargument, finalVerdict };
