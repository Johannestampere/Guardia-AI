// content.js

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
  console.log('[Content] HTML length:', extracted.length);

  try {
    chrome.runtime.sendMessage(
      { type:'analyzePage', html: html, baseDomain: baseDomain, language: config.language },
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
