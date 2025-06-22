// content.js
import cheerio from 'cheerio';

function extractHTML(html, baseDomain = '') {
  const $ = cheerio.load(html);

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
    anchors: [],     // { text, href }
    forms: [],       // { action, method, inputs: [{ tag, type, name, placeholder, value? }] }
    scripts: [],     // { src?, inlineSnippet? }
    metaRefresh: null,
    metas: [],       // { nameOrProperty, content }
    links: [],       // { rel, href }
    iframes: [],     // { src, style? }
    jsonLd: [],      // parsed JSON objects
    eventHandlers: []// { element, handlerAttr, code }
  };

  // base href
  const baseTag = $('base').attr('href');
  if (baseTag) result.baseHref = baseTag.trim();

  // Anchors
  $('a[href]').each((i, el) => {
    const hrefRaw = $(el).attr('href').trim();
    const href = resolveUrl(hrefRaw);
    const text = $(el).text().trim();
    result.anchors.push({ text, href });
  });

  // Forms and inputs
  $('form').each((i, el) => {
    const actionRaw = $(el).attr('action') || '';
    const action = resolveUrl(actionRaw.trim());
    const method = ($(el).attr('method') || 'GET').toUpperCase();
    const inputs = [];
    $(el).find('input, textarea, select').each((j, inp) => {
      const tag = inp.tagName.toLowerCase();
      const type = inp.attribs.type || '';
      const name = inp.attribs.name || '';
      const placeholder = inp.attribs.placeholder || '';
      const value = inp.attribs.value || '';
      inputs.push({ tag, type, name, placeholder, value });
    });
    result.forms.push({ action, method, inputs });
  });

  // Scripts
  $('script').each((i, el) => {
    const srcRaw = $(el).attr('src');
    if (srcRaw) {
      const src = resolveUrl(srcRaw.trim());
      result.scripts.push({ src });
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
    const content = $(el).attr('content') || '';
    result.metas.push({ nameOrProperty: nameOrProperty.trim(), content: content.trim() });
  });

  // Link tags
  $('link[rel][href]').each((i, el) => {
    const rel = $(el).attr('rel').trim();
    const hrefRaw = $(el).attr('href').trim();
    const href = resolveUrl(hrefRaw);
    result.links.push({ rel, href });
  });

  // Iframes
  $('iframe').each((i, el) => {
    const srcRaw = $(el).attr('src') || '';
    const src = resolveUrl(srcRaw.trim());
    const style = $(el).attr('style') || '';
    result.iframes.push({ src, style: style.trim() });
  });

  // JSON-LD
  $('script[type="application/ld+json"]').each((i, el) => {
    const txt = $(el).html() || '';
    try {
      const obj = JSON.parse(txt);
      result.jsonLd.push(obj);
    } catch {
      // ignore parse errors
    }
  });

  // Inline event handlers (e.g., onclick, onerror, etc.)
  $('[onclick], [onerror], [onmouseover], [onsubmit]').each((i, el) => {
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

const config = {
  language:    'english',
  textWarning: true,
  voiceWarning:true,
};

function initPrefs() {
  try {
    chrome.storage.sync.get(
      ['language','textWarning','voiceWarning'],
      prefs => {
        config.language     = prefs.language     ?? config.language;
        config.textWarning  = prefs.textWarning  ?? config.textWarning;
        config.voiceWarning = prefs.voiceWarning ?? config.voiceWarning;
        console.log('[Content] Prefs loaded', config);
      }
    );
    chrome.storage.onChanged.addListener(changes => {
      if (changes.language)     config.language     = changes.language.newValue;
      if (changes.textWarning)  config.textWarning  = changes.textWarning.newValue;
      if (changes.voiceWarning) config.voiceWarning = changes.voiceWarning.newValue;
      console.log('[Content] Prefs changed', config);
    });
  } catch (e) {
    console.warn('[Content] Failed to load prefs, using defaults', e);
  }
}

function base64ToBlob(base64, mime) {
  const bytes = atob(base64);
  const arrs  = [];
  for (let i=0; i<bytes.length; i+=512) {
    const slice = bytes.slice(i, i+512);
    const nums  = Array.from(slice, c=>c.charCodeAt(0));
    arrs.push(new Uint8Array(nums));
  }
  return new Blob(arrs, { type:mime });
}

function showWarning(summary, confidence) {
  const lvl = confidence>0.66 ? 'High' : confidence>0.33 ? 'Medium' : 'Low';
  const bubble = document.createElement('div');
  bubble.innerText = `Risk: ${lvl}\n\n${summary}`;
  Object.assign(bubble.style, {
    position: 'fixed', top: '20px', right: '20px',
    background: 'white', color: 'black', border: '1px solid black',
    padding: '10px', borderRadius: '6px', zIndex: '999999'
  });
  document.body.appendChild(bubble);
  setTimeout(()=>bubble.remove(), 10000);
}

let html = '';

function analyzePage() {
  const html = document.documentElement.outerHTML;
  if (html === lastHtml) return;
  lastHtml = html;

  const baseDomain = new URL(document.location.href).hostname || '';
  const extracted = extractHTML(html, baseDomain);
  console.log('[Content] HTML length:', extracted.length);

  try {
    chrome.runtime.sendMessage(
      { type:'analyzePage', html: snap, language: config.language },
      resp => {
        if (chrome.runtime.lastError) {
          console.warn('[Content] sendMessage error:', chrome.runtime.lastError.message);
          return;
        }
        console.log('[Content] got response:', resp);
        if (resp.error) {
          console.error('[Content] server error:', resp.error);
          return;
        }
        const data = resp.data;
        console.log('[Content] analysis data:', data);

        showWarning(data.summary, data.confidence);
      }
    );
  } catch (e) {
    console.warn('[Content] sendMessage threw:', e);
  }
}

function hookHistory(type) {
  const orig = history[type];
  history[type] = function(...args) {
    const ret = orig.apply(this, args);
    analyzePage();
    return ret;
  };
}

function initNavigationHooks() {
  hookHistory('pushState');
  hookHistory('replaceState');
  window.addEventListener('popstate',   analyzePage);
  window.addEventListener('hashchange', analyzePage);
}

initPrefs();
analyzePage();
initNavigationHooks();
