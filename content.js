// content.js

const config = {
  language: 'english',
  textWarning: true,
  voiceWarning: true,
  textSize: 18,
};

const VOICE_LANG_CODES = {
  english: 'en-US',
  spanish: 'es-ES',
  french: 'fr-FR',
};

function initPrefs() {

  chrome.storage.sync.get(
    ['language','textWarning','voiceWarning','textSize'],
    prefs => {
      Object.assign(config, prefs);
      analyzePage();
    }
  );

  chrome.storage.onChanged.addListener(changes => {
    if (changes.language) config.language = changes.language.newValue;
    if (changes.textWarning) config.textWarning = changes.textWarning.newValue;
    if (changes.voiceWarning) config.voiceWarning = changes.voiceWarning.newValue;
    if (changes.textSize) config.textSize = changes.textSize.newValue;
    analyzePage();
  });
}

function extractPageSnapshot() {
  const titleEl = document.title || '';
  const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
  const headHtml = document.head.innerHTML.slice(0,5000) + (document.head.innerHTML.length>5000?'…':'');
  const textBody = document.body.innerText.slice(0,10000) + (document.body.innerText.length>10000?'…':'');
  const htmlBody = document.body.innerHTML.slice(0,10000) + (document.body.innerHTML.length>10000?'…':'');

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

function playSpeechSynthesis(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = VOICE_LANG_CODES[config.language] || 'en-US';
  utter.volume = 1.0;
  utter.rate = 0.9;
  speechSynthesis.speak(utter);
}

function showWarning(summary, confidence, audioBase64) {
  const lvl = confidence > 0.66 ? 'High'
            : confidence> 0.33 ? 'Medium'
            : 'Low';
  
  const riskColors = {
    High: { border: '#dc2626', background: '#fef2f2', text: '#dc2626' },
    Medium: { border: '#ea580c', background: '#fff7ed', text: '#ea580c' },
    Low: { border: '#ca8a04', background: '#fefce8', text: '#ca8a04' }
  };
  
  const colors = riskColors[lvl];
  
  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: colors.background,
    color: '#1f2937',
    border: `3px solid ${colors.border}`,
    padding: '24px',
    borderRadius: '12px',
    zIndex: '999999',
    maxWidth: '450px',
    minWidth: '400px',
    minHeight: '300px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: `${config.textSize || 14}px`,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  });

  const title = document.createElement('div');
  title.innerText = `${lvl.toUpperCase()} WARNING DETECTED`;
  title.style.fontWeight = 'bold';
  title.style.fontSize = `${(config.textSize || 14) + 4}px`;
  title.style.color = colors.text;
  title.style.marginBottom = '16px';
  title.style.textAlign = 'center';
  title.style.width = '100%';
  bubble.appendChild(title);

  const msg = document.createElement('div');
  msg.innerText = summary;
  msg.style.margin = '16px 0';
  msg.style.fontSize = `${config.textSize || 14}px`;
  msg.style.lineHeight = '1.5';
  msg.style.textAlign = 'center';
  msg.style.width = '100%';
  bubble.appendChild(msg);

  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('image.png');
  img.style.width = '140px';
  img.style.height = 'auto';
  img.style.display = 'block';
  img.style.margin = '20px auto 0 auto';
  img.style.borderRadius = '0';
  img.style.boxShadow = 'none';
  img.style.backgroundColor = colors.background;
  img.alt = 'Warning icon';
  bubble.appendChild(img);

  if (config.voiceWarning) {
    if (audioBase64 && audioBase64.length > 0) {
      try {
        const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);
        const player = new Audio(audioUrl);
        player.volume = 1.0;
        
        player.play().then(() => {
        }).catch((error) => {
          console.error('[Content] Audio playback failed:', error);
          playSpeechSynthesis(summary);
        });
        
        player.addEventListener('error', (error) => {
          console.error('[Content] Audio error:', error);
          playSpeechSynthesis(summary);
        });
        
      } catch (error) {
        console.error('[Content] Error creating audio:', error);
        playSpeechSynthesis(summary);
      }
    } else {
      playSpeechSynthesis(summary);
    }
  } else {
    console.log('[Content] Voice warning disabled in config');
  }

  document.body.appendChild(bubble);
  setTimeout(()=>bubble.remove(), 30000);
}

let lastSnapshot = '';
function analyzePage() {
  const snap = extractPageSnapshot();
  if (snap === lastSnapshot) return;
  lastSnapshot = snap;

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

      if (data.is_scam) {
        showWarning(data.summary, data.confidence, data.audio);
      }
    }
  );
}

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

initPrefs();
initNavigationHooks();
