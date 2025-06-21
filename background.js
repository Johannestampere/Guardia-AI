chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https?:\/\//.test(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      }).catch(err => {
        console.error('Injection failed:', err);
      });
    }
  });
  