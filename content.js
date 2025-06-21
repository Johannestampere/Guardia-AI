// content.js

// Converts Base64 audio string to a Blob
function base64ToBlob(base64, mime) {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = Array.from(slice, char => char.charCodeAt(0));
    "http://localhost:5001/*"
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  console.log("Converted base64 to blob");
  return new Blob(byteArrays, { type: mime });
}

// Displays a temporary warning bubble in the top-right
function showWarning(summary, confidence) {
  let riskLevel = 'Low';
  if (confidence > 0.66)      riskLevel = 'High';
  else if (confidence > 0.33) riskLevel = 'Medium';

  const bubble = document.createElement('div');
  bubble.innerText = `Risk: ${riskLevel}\n\n${summary}`;
  Object.assign(bubble.style, {
    position:     'fixed',
    top:          '20px',
    right:        '20px',
    background:   'white',
    color:        'black',
    border:       '1px solid black',
    padding:      '10px',
    borderRadius: '6px',
    zIndex:       '999999'
  });

  document.body.appendChild(bubble);
  setTimeout(() => bubble.remove(), 10_000);
  console.log("Showed warning");
}

let lastHtml = '';

function analyzePage() {
  // Load user prefs with defaults
  chrome.storage.sync.get(
    ['language', 'textWarning', 'voiceWarning'],
    prefs => {
      const language     = prefs.language     || 'english';
      const textWarning  = prefs.textWarning  ?? true;
      const voiceWarning = prefs.voiceWarning ?? true;

      // Snapshot full-page HTML, skip if unchanged
      const html = document.documentElement.outerHTML;
      if (html === lastHtml) return;
      lastHtml = html;

      // Send to background for fetch 
      chrome.runtime.sendMessage(
        { type: 'analyzePage', html, language },
        resp => {
          if (resp.error) {
            console.error('Analyze server error:', resp.error);
            return;
          }
          console.log("Received response from background");
          const data = resp.data;
          if (!data || !data.is_scam) return;

          // Honor text/voice prefs
          if (textWarning) showWarning(data.summary, data.confidence);
          if (voiceWarning && data.audio) {
            const blob = base64ToBlob(data.audio, 'audio/mpeg');
            new Audio(URL.createObjectURL(blob)).play();
          }
        }
      );
    }
  );
}

// Initial run + debounce on DOM mutations
analyzePage();
let debounceTimer;
new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(analyzePage, 500);
}).observe(document.body, { childList: true, subtree: true });
