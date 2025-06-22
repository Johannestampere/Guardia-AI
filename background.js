chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'analyzePage') {
    fetch("http://localhost:5001/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: msg.html, language: msg.language })
    })
      .then(r => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then(data => {
        sendResponse({ data });
      })
      .catch(err => {
        console.error("Background fetch failed:", err);
        sendResponse({ error: err.message });
      });

    return true;
  }
});