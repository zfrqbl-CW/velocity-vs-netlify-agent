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

async function compare(articles) {
  const prompt = Object.entries(articles)
    .map(([key, val]) => `${key}:\nMain summary: ${val.mainSummary}\nSupporting summary: ${val.supportSummary}`)
    .join('\n\n');
  return callGroq([
    {
      role: 'system',
      content:
        'Compare the two subjects across reach, speed of adoption, societal effect, and durability, using only the summaries provided. Be specific and concise.'
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

module.exports = { summarize, compare, verdict };
