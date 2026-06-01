import { clampText, nowISO, sanitizeText } from '../lib/utils.mjs';
import { isMedicalQuery } from './medical.mjs';

const FAST_TIMEOUT_MS = 1800;
const CACHE_TTL_MS = 120_000;
const CACHE_MAX = 80;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'do', 'for', 'from', 'how',
  'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'please', 'should', 'that', 'the', 'this',
  'to', 'what', 'when', 'where', 'who', 'why', 'with', 'would', 'you'
]);

const cache = new Map();

export async function getLivePulse({ message, mode = 'general' } = {}) {
  const started = Date.now();
  const at = nowISO();
  const text = sanitizeText(message, 1000);
  const query = compactQuery(text);
  const clock = {
    provider: 'clock',
    ok: true,
    result: {
      utc: at,
      note: 'Use this timestamp to ground freshness, dates, and current-versus-stale reasoning.'
    }
  };

  if (!shouldUseFreeSearch(text, mode)) {
    return finalizePulse({ started, at, query: '', sources: [clock], cached: false });
  }

  const cacheKey = `${mode}:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return finalizePulse({ started, at, query, sources: [clock, ...cached.sources], cached: true });
  }

  const providers = [
    ['wikipedia-opensearch', () => freeWikipedia(query)]
  ];

  if (shouldUseNewsSearch(text, mode)) {
    providers.push(['gdelt', () => freeGdelt(query)]);
  }

  if (mode === 'medical' || isMedicalQuery(text)) {
    providers.push(['pubmed', () => freePubMed(query)]);
  }

  const results = await Promise.all(providers.map(([provider, task]) => runSource(provider, task)));
  remember(cacheKey, results);
  return finalizePulse({ started, at, query, sources: [clock, ...results], cached: false });
}

function finalizePulse({ started, at, query, sources, cached }) {
  const externalCount = sources.filter((source) => source.provider !== 'clock' && source.ok && source.items?.length).length;
  return {
    ok: true,
    free: true,
    alwaysOn: true,
    at,
    query,
    cached,
    latencyMs: Date.now() - started,
    providerCount: sources.length,
    externalProviderCount: externalCount,
    sources
  };
}

async function runSource(provider, task) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve({ provider, ok: false, error: `Timed out after ${FAST_TIMEOUT_MS}ms in fast free live pulse.` });
    }, FAST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      task().catch((error) => ({ provider, ok: false, error: sanitizeError(error) })),
      timeout
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs = FAST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function freeWikipedia(query) {
  const data = await fetchJson(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json&origin=*`);
  const titles = data[1] || [];
  const snippets = data[2] || [];
  const urls = data[3] || [];
  return {
    provider: 'wikipedia-opensearch',
    ok: true,
    items: titles.map((title, index) => normalizeItem({
      title,
      snippet: snippets[index],
      url: urls[index]
    })).filter(Boolean)
  };
}

async function freeGdelt(query) {
  const data = await fetchJson(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&format=json&maxrecords=4&sort=hybridrel`);
  return {
    provider: 'gdelt',
    ok: true,
    items: (data.articles || []).map((item) => normalizeItem({
      title: item.title,
      source: item.sourcecountry || item.domain,
      publishedAt: item.seendate,
      snippet: item.domain,
      url: item.url
    })).filter(Boolean)
  };
}

async function freePubMed(query) {
  const search = await fetchJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=4&term=${encodeURIComponent(query)}`);
  const ids = search.esearchresult?.idlist || [];
  if (!ids.length) return { provider: 'pubmed', ok: true, items: [] };

  const summary = await fetchJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`);
  return {
    provider: 'pubmed',
    ok: true,
    items: ids.map((id) => summary.result?.[id]).filter(Boolean).map((item) => normalizeItem({
      title: item.title,
      source: item.source,
      publishedAt: item.pubdate,
      url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
      snippet: (item.authors || []).slice(0, 3).map((author) => author.name).join(', ')
    })).filter(Boolean)
  };
}

function shouldUseFreeSearch(text, mode) {
  if (mode === 'medical') return true;
  const clean = sanitizeText(text, 400);
  if (clean.length < 3) return false;
  if (/^(hi|hello|hey|ok|okay|thanks|thank you)$/i.test(clean)) return false;
  return true;
}

function shouldUseNewsSearch(text, mode) {
  if (mode === 'medical') return false;
  return /\b(today|now|current|latest|recent|live|news|breaking|headline|price|stock|sports|score|trend|release|business|market|company|product|travel|flight|event|weather|forecast|near me|open now)\b/i.test(text);
}

function compactQuery(text) {
  const clean = sanitizeText(text, 320)
    .replace(/\b(can you|could you|would you|please|tell me|show me|find me|look up|search for)\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\s.,'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return 'current information';

  const meaningful = clean.split(/\s+/).filter((word) => {
    const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalized.length > 1 && !STOPWORDS.has(normalized);
  });
  const words = meaningful.length >= 2 ? meaningful : clean.split(/\s+/);
  return clampText(words.slice(0, 14).join(' '), 180) || 'current information';
}

function normalizeItem(item) {
  const title = sanitizeText(item.title || '', 180);
  if (!title) return null;
  return {
    title,
    source: sanitizeText(item.source || '', 120),
    publishedAt: sanitizeText(item.publishedAt || '', 80),
    url: sanitizeText(item.url || '', 500),
    snippet: sanitizeText(item.snippet || '', 320)
  };
}

function remember(key, sources) {
  cache.set(key, { cachedAt: Date.now(), sources });
  if (cache.size <= CACHE_MAX) return;
  const oldestKey = cache.keys().next().value;
  if (oldestKey) cache.delete(oldestKey);
}

function sanitizeError(error) {
  if (error?.name === 'AbortError') return `Timed out after ${FAST_TIMEOUT_MS}ms in fast free live pulse.`;
  return clampText(String(error?.message || error || 'Unknown live data failure.'), 240);
}
