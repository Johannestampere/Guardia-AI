// content.js

const config = {
  language: 'english',
  textWarning: true,
  voiceWarning: true,
};

const VOICE_LANG_CODES = {
  english: 'en-US',
  spanish: 'es-ES',
  french: 'fr-FR',
};

function initPrefs() {

  chrome.storage.sync.get(
    ['language','textWarning','voiceWarning'],
    prefs => {
      Object.assign(config, prefs);
      analyzePage();
    }
  );

  chrome.storage.onChanged.addListener(changes => {
    if (changes.language) config.language = changes.language.newValue;
    if (changes.textWarning) config.textWarning = changes.textWarning.newValue;
    if (changes.voiceWarning) config.voiceWarning = changes.voiceWarning.newValue;
    analyzePage();
  });
}

function extractPageSnapshot() {
  const titleEl    = document.title || '';
  const metaDesc   = document.querySelector('meta[name="description"]')?.content || '';
  const headHtml   = document.head.innerHTML.slice(0,5000) + (document.head.innerHTML.length>5000?'…':'');
  const textBody   = document.body.innerText.slice(0,10000) + (document.body.innerText.length>10000?'…':'');
  const htmlBody   = document.body.innerHTML.slice(0,10000) + (document.body.innerHTML.length>10000?'…':'');
  const links = Array.from(document.querySelectorAll('a[href]'))
                      .map(a => `${a.innerText.trim()||'(no text)'} → ${a.href}`)
                      .join('\n');
  const forms = Array.from(document.querySelectorAll('form'))
                      .map(f => {
                          const method = (f.method||'GET').toUpperCase();
                          const names = Array.from(f.querySelectorAll('input,textarea,select')).map(i=>i.name||i.type||'(unnamed)').join(', ');
                          return `action=${f.action} method=${method} inputs=[${names}]`;
                        }).join('\n');
  const scripts = Array.from(document.querySelectorAll('script[src]'))
                        .map(s=>s.src).join('\n');

  return [
    `TITLE:\n${titleEl}`,
    `META-DESC:\n${metaDesc}`,
    `HEAD-SNIPPET:\n${headHtml}`,
    `TEXT-SNIPPET:\n${textBody}`,
    `HTML-SNIPPET:\n${htmlBody}`,
    `LINKS:\n${links}`,
    `FORMS:\n${forms}`,
    `SCRIPTS:\n${scripts}`,
  ].join('\n\n');
}

function base64ToBlob(b64, mime) {
  const bytes = atob(b64), arrs = [];
  for (let i = 0; i < bytes.length; i += 512) {
    const slice = bytes.slice(i, i+512);
    arrs.push(new Uint8Array(Array.from(slice, c=>c.charCodeAt(0))));
  }
  return new Blob(arrs, { type: mime });
}

function showWarning(summary, confidence, audioBase64) {
  const lvl = confidence > 0.66 ? 'High'
            : confidence> 0.33 ? 'Medium'
            : 'Low';
  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'fixed',
    top:      '20px',
    right:    '20px',
    background:'white',
    color:    'black',
    border:   '1px solid black',
    padding:  '10px',
    borderRadius: '6px',
    zIndex:   '999999',
    maxWidth: '300px',
    fontFamily:'sans-serif'
  });

  const title = document.createElement('div');
  title.innerText = `Risk: ${lvl}`;
  title.style.fontWeight = 'bold';
  bubble.appendChild(title);

  const msg = document.createElement('div');
  msg.innerText = summary;
  msg.style.margin = '8px 0';
  bubble.appendChild(msg);

  const btn = document.createElement('button');
  btn.innerText = '🔊 Listen';
  Object.assign(btn.style, {
    cursor: 'pointer',
    background: '#007bff',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px'
  });
  btn.addEventListener('click', () => {
    if (audioBase64) {
      const player = new Audio(URL.createObjectURL(base64ToBlob(audioBase64,'audio/mpeg')));
      player.play().catch(() => {
        const utter = new SpeechSynthesisUtterance(summary);
        utter.lang = VOICE_LANG_CODES[config.language] || 'en-US';
        speechSynthesis.speak(utter);
      });
    } else {
      const utter = new SpeechSynthesisUtterance(summary);
      utter.lang = VOICE_LANG_CODES[config.language];
      speechSynthesis.speak(utter);
    }
  });

  bubble.appendChild(btn);
  document.body.appendChild(bubble);
  setTimeout(()=>bubble.remove(), 15000);
}

let lastSnapshot = '';
function analyzePage() {
  const snap = extractPageSnapshot();
  if (snap === lastSnapshot) return;
  lastSnapshot = snap;

  console.log('[Content] sending to backend:\n', snap);
  chrome.runtime.sendMessage(
    { type:'analyzePage', html:snap, language:config.language },
    resp => {
      if (chrome.runtime.lastError) {
        console.warn('[Content] msg error:', chrome.runtime.lastError.message);
        return;
      }
      if (resp.error) {
        console.error('[Content] server error:', resp.error);
        return;
      }
      const data = resp.data;
      console.log('[Content] analysis:', data);

      if (data.is_scam && config.textWarning) {

        showWarning(data.summary, data.confidence, data.audio);
        if (config.voiceWarning && 'speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(data.summary);
          utter.lang = VOICE_LANG_CODES[config.language] || 'en-US';
          speechSynthesis.speak(utter);
        }
      }
    }
  );
}

// ———————————————————————————————
// 5) SPA navigation hooks
// ———————————————————————————————
function hookHistory(type) {
  const orig = history[type];
  history[type] = function(...args) {
    const ret = orig.apply(this,args);
    setTimeout(analyzePage,500);
    return ret;
  };
}
function initNavigationHooks() {
  hookHistory('pushState');
  hookHistory('replaceState');
  window.addEventListener('popstate',   ()=>setTimeout(analyzePage,500));
  window.addEventListener('hashchange', ()=>setTimeout(analyzePage,500));
}

// ———————————————————————————————
// 6) Bootstrap
// ———————————————————————————————
initPrefs();
initNavigationHooks();
