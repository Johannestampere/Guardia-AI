// Converts base64 audio string to a Blob (binary large object)
function base64ToBlob(base64, mime) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mime });
  }
  
  function showWarning(summary, confidence) {
    let riskLevel = "Low";
    if (confidence > 0.66) riskLevel = "High";
    else if (confidence > 0.33) riskLevel = "Medium";
  
    const bubble = document.createElement("div");
    bubble.innerText = `Risk: ${riskLevel}\n\n${summary}`;
    Object.assign(bubble.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: "white",
      color: "black",
      border: "1px solid black",
      padding: "10px",
      borderRadius: "6px",
      zIndex: 999999
    });
    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 10000);
  }
  
  let lastHtml = "";
  async function analyzePage() {
    chrome.storage.sync.get(
      ["textWarning", "voiceWarning", "language"],
      async prefs => {
        const html = document.documentElement.outerHTML;
        if (html === lastHtml) return;  // skip duplicates
        lastHtml = html;
  
        const language = prefs.language || "english";
        const textWarning = prefs.textWarning ?? true;
        const voiceWarning = prefs.voiceWarning ?? true;
  
        try {
          const res = await fetch("http://localhost:5000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html, language })
          });
          const data = await res.json();
          if (data?.is_scam) {
            if (textWarning) showWarning(data.summary, data.confidence);
            if (voiceWarning && data.audio) {
              const blob = base64ToBlob(data.audio, "audio/mpeg");
              new Audio(URL.createObjectURL(blob)).play();
            }
          }
        } catch (err) {
          console.error("Error analyzing page:", err);
        }
      }
    );
  }
  
  // initial run + debounce on DOM changes
analyzePage();
let debounceTimer;
const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(analyzePage, 500);
});
observer.observe(document.body, { childList: true, subtree: true });
  