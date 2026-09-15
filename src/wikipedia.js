const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'velocity-vs-netlify-demo/1.0 (hackernoon article)';

async function fetchWithRetry(url, attempt = 0, maxAttempts = 5) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

  if (res.status === 429 && attempt < maxAttempts) {
    // Wikipedia's public API doesn't reliably send a retry-after header, so
    // back off exponentially to survive longer throttling windows too:
    // 3s, 6s, 12s, 24s, 48s.
    const waitMs = 3000 * Math.pow(2, attempt);
    console.log(`Wikipedia 429, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return fetchWithRetry(url, attempt + 1, maxAttempts);
  }

  return res;
}

async function resolveTitle(query) {
  const url = `${API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Wikipedia search failed (${res.status}) for "${query}"`);
  const data = await res.json();
  const hit = data.query && data.query.search && data.query.search[0];
  if (!hit) throw new Error(`No Wikipedia result for "${query}"`);
  return hit.title;
}

async function getExtract(title, maxChars = 6000) {
  const url = `${API}?action=query&prop=extracts&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Wikipedia extract failed (${res.status}) for "${title}"`);
  const data = await res.json();
  const pages = (data.query && data.query.pages) || {};
  const page = Object.values(pages)[0];
  if (!page || !page.extract) throw new Error(`No extract found for "${title}"`);
  return page.extract.slice(0, maxChars);
}

module.exports = { resolveTitle, getExtract };
