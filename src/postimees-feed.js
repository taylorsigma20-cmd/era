const { XMLParser } = require('fast-xml-parser');

const ALLOWED_HOSTS = new Set(['postimees.ee', 'www.postimees.ee', 'pmo.ee']);

function parsePostimeesFeed(xml, fetchedAt = Date.now()) {
  if (typeof xml !== 'string' || xml.length > 2_000_000) throw new Error('Postimees RSS response was unexpectedly large.');
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item;
  const items = (Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []).slice(0, 25).map(item => {
    const link = String(item.link || '').trim();
    let url;
    try { url = new URL(link); } catch { return null; }
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    return {
      title: String(item.title || 'Untitled article').replace(/<[^>]*>/g, '').slice(0, 240),
      link: url.toString(),
      pubDate: String(item.pubDate || '').slice(0, 64)
    };
  }).filter(Boolean);
  return { items, fetchedAt };
}

module.exports = { ALLOWED_HOSTS, parsePostimeesFeed };
