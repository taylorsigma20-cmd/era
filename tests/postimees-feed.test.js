const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePostimeesFeed } = require('../src/postimees-feed');

test('parses Postimees RSS headlines with safe HTTPS source links', () => {
  const xml = `<rss version="2.0"><channel><item><title>Pealkiri &amp; uudis</title><link>https://www.postimees.ee/123</link><pubDate>Tue, 07 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
  const feed = parsePostimeesFeed(xml, 123);
  assert.equal(feed.fetchedAt, 123);
  assert.equal(feed.items.length, 1);
  assert.equal(feed.items[0].title, 'Pealkiri & uudis');
  assert.equal(feed.items[0].link, 'https://www.postimees.ee/123');
});

test('drops non-Postimees, non-HTTPS, and invalid article links', () => {
  const xml = `<rss><channel><item><title>Outside</title><link>https://example.org/story</link></item><item><title>Insecure</title><link>http://www.postimees.ee/story</link></item><item><title>Invalid</title><link>javascript:alert(1)</link></item></channel></rss>`;
  assert.deepEqual(parsePostimeesFeed(xml).items, []);
});

test('rejects oversized feeds', () => {
  assert.throws(() => parsePostimeesFeed('x'.repeat(2_000_001)), /unexpectedly large/);
});
