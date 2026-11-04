const dns = require('dns').promises;
const net = require('net');

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;
const WWW_PATTERN = /\bwww\.[^\s<>"']+/i;

function trimUrl(value) {
  return String(value || '').replace(/[),.;!?]+$/g, '');
}

function firstUrl(text) {
  const source = String(text || '');
  const explicit = source.match(URL_PATTERN);
  if (explicit) return trimUrl(explicit[0]);
  const www = source.match(WWW_PATTERN);
  if (www) return trimUrl(`https://${www[0]}`);
  return '';
}

function isPrivateIp(ip) {
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return lower === '::1' || lower.startsWith('fe80') || lower.startsWith('fc') || lower.startsWith('fd');
  }
  return true;
}

async function publicUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null;
  if (net.isIP(host)) return isPrivateIp(host) ? null : url;
  let records = [];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    return null;
  }
  if (!records.length || records.some((record) => isPrivateIp(record.address))) return null;
  return url;
}

function decode(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function meta(html, key) {
  const property = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decode(match[1]);
  }
  return '';
}

function clip(value, max) {
  const text = decode(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function readHtml(response) {
  const reader = response.body?.getReader?.();
  if (!reader) return (await response.text()).slice(0, 200000);
  const chunks = [];
  let received = 0;
  while (received < 200000) {
    const step = await reader.read();
    if (step.done) break;
    received += step.value.length;
    chunks.push(Buffer.from(step.value));
    if (/<\/head>/i.test(Buffer.concat(chunks).toString('utf8'))) break;
  }
  reader.cancel().catch(() => {});
  return Buffer.concat(chunks).toString('utf8');
}

async function readLinkPreview(raw) {
  let current = raw;
  for (let hop = 0; hop < 3; hop += 1) {
    const url = await publicUrl(current);
    if (!url) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    let response;
    try {
      response = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'HBMSLinkPreview/1.0',
        },
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      current = new URL(location, url).toString();
      continue;
    }
    if (!response.ok) return null;
    const type = String(response.headers.get('content-type') || '');
    const domain = url.hostname.replace(/^www\./, '');
    if (type.startsWith('image/')) {
      return { url: url.toString(), title: domain, description: '', image: url.toString(), domain };
    }
    if (!type.includes('html') && !type.includes('xml')) {
      return { url: url.toString(), title: domain, description: '', image: '', domain };
    }
    const html = await readHtml(response);
    const title = clip(meta(html, 'og:title') || meta(html, 'twitter:title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1], 140);
    const description = clip(meta(html, 'og:description') || meta(html, 'description'), 180);
    const imageRaw = meta(html, 'og:image') || meta(html, 'twitter:image');
    let image = '';
    if (imageRaw) {
      const absolute = new URL(imageRaw, url).toString();
      if (absolute.length <= 2000 && await publicUrl(absolute)) image = absolute;
    }
    return {
      url: url.toString(),
      title: title || domain,
      description,
      image,
      domain,
    };
  }
  return null;
}

function presentLink(preview) {
  if (!preview || typeof preview !== 'object') return null;
  const url = String(preview.url || '');
  if (!/^https?:\/\//i.test(url)) return null;
  const image = String(preview.image || '');
  return {
    url,
    title: String(preview.title || '').slice(0, 140),
    description: String(preview.description || '').slice(0, 180),
    image: /^https?:\/\//i.test(image) && image.length <= 2000 ? image : '',
    domain: String(preview.domain || '').slice(0, 80),
  };
}

module.exports = { firstUrl, readLinkPreview, presentLink };
