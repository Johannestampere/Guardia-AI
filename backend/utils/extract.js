// backend/utils/extract.js
import { load } from 'cheerio';

export function extractHTML(html, baseDomain = '') {
  const $ = load(html);

  const resolveUrl = (raw) => {
    if (!raw) return raw;
    if (baseDomain) {
      try {
        return new URL(raw, `https://${baseDomain}`).toString();
      } catch {}
    }
    return raw;
  };

  const result = {
    baseHref: null,
    title: $('head > title').first().text().trim() || null,
    anchors: [],
    forms: [],
    scripts: [],
    metaRefresh: null,
    metas: [],
    links: [],
    iframes: [],
    jsonLd: [],
    eventHandlers: []
  };

  // base href
  const baseTag = $('base').attr('href');
  if (baseTag) result.baseHref = baseTag.trim();

  // Anchors
  $('a[href]').each((i, el) => {
    const hrefRaw = $(el).attr('href').trim();
    const href    = resolveUrl(hrefRaw);
    const text    = $(el).text().trim();
    result.anchors.push({ text, href });
  });

  // Forms and inputs
  $('form').each((i, el) => {
    const actionRaw = $(el).attr('action') || '';
    const action    = resolveUrl(actionRaw.trim());
    const method    = ($(el).attr('method') || 'GET').toUpperCase();
    const inputs    = [];
    $(el).find('input, textarea, select').each((j, inp) => {
      const tag         = inp.tagName.toLowerCase();
      const type        = inp.attribs.type        || '';
      const name        = inp.attribs.name        || '';
      const placeholder = inp.attribs.placeholder || '';
      const value       = inp.attribs.value       || '';
      inputs.push({ tag, type, name, placeholder, value });
    });
    result.forms.push({ action, method, inputs });
  });

  // Scripts
  $('script').each((i, el) => {
    const srcRaw = $(el).attr('src');
    if (srcRaw) {
      result.scripts.push({ src: resolveUrl(srcRaw.trim()) });
    } else {
      const snippet = $(el).html().trim().slice(0, 500);
      result.scripts.push({ inlineSnippet: snippet });
    }
  });

  // Meta-refresh
  $('meta[http-equiv]').each((i, el) => {
    if ($(el).attr('http-equiv').toLowerCase() === 'refresh') {
      result.metaRefresh = $(el).attr('content')?.trim() || null;
    }
  });

  // Other meta tags
  $('meta[name], meta[property]').each((i, el) => {
    const nameOrProperty = $(el).attr('name') || $(el).attr('property');
    const content        = $(el).attr('content') || '';
    result.metas.push({ nameOrProperty: nameOrProperty.trim(), content: content.trim() });
  });

  // Link tags
  $('link[rel][href]').each((i, el) => {
    const rel     = $(el).attr('rel').trim();
    const hrefRaw = $(el).attr('href').trim();
    result.links.push({ rel, href: resolveUrl(hrefRaw) });
  });

  // Iframes
  $('iframe').each((i, el) => {
    const srcRaw = $(el).attr('src') || '';
    const style  = $(el).attr('style') || '';
    result.iframes.push({ src: resolveUrl(srcRaw.trim()), style: style.trim() });
  });

  // JSON-LD
  $('script[type="application/ld+json"]').each((i, el) => {
    const txt = $(el).html() || '';
    try {
      result.jsonLd.push(JSON.parse(txt));
    } catch {
      // ignore invalid JSON-LD
    }
  });

  // Inline event handlers
  $('[onclick],[onerror],[onmouseover],[onsubmit]').each((i, el) => {
    for (const attr of ['onclick','onerror','onmouseover','onsubmit']) {
      const code = $(el).attr(attr);
      if (code) {
        result.eventHandlers.push({
          element: el.tagName.toLowerCase(),
          handlerAttr: attr,
          code: code.trim()
        });
      }
    }
  });

  return result;
}
