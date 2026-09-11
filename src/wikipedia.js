const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'velocity-vs-netlify-demo/1.0 (hackernoon article)';

async function resolveTitle(query) {
  const url = `${API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikipedia search failed (${res.status}) for "${query}"`);
  const data = await res.json();
  const hit = data.query && data.query.search && data.query.search[0];
  if (!hit) throw new Error(`No Wikipedia result for "${query}"`);
  return hit.title;
}

async function getExtract(title, maxChars = 6000) {
  const url = `${API}?action=query&prop=extracts&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikipedia extract failed (${res.status}) for "${title}"`);
  const data = await res.json();
  const pages = (data.query && data.query.pages) || {};
  const page = Object.values(pages)[0];
  if (!page || !page.extract) throw new Error(`No extract found for "${title}"`);
  return page.extract.slice(0, maxChars);
}

module.exports = { resolveTitle, getExtract };
