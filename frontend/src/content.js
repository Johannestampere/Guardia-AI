(async () => {
    chrome.storage.sync.get(["textWarning", "voiceWarning", "language"], async (prefs) => {
        const html = document.documentElement.outerHTML;
  
        const language = prefs.language || "english";
        const textWarning = prefs.textWarning ?? true;
        const voiceWarning = prefs.voiceWarning ?? true;
    
        try {
            const res = await fetch("http://localhost:5000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html, language }),
            });
    
            // is_scam, confidence, summary, audio (base64 string)
            const data = await res.json();
    
            if (data?.is_scam) {
            if (textWarning) {
                showWarning(data.summary, data.confidence);
            }
    
            if (voiceWarning && data.audio) {
                const audioBlob = base64ToBlob(data.audio, "audio/mpeg");
                const audioUrl = URL.createObjectURL(audioBlob);
                new Audio(audioUrl).play();
            }
            }
        } catch (err) {
            console.error("Error analyzing page:", err);
        }
        });
    
        // turns the b64 audio string to a blob
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
            if (confidence > 0.66) {
                riskLevel = "High";
            } else if (confidence > 0.33) {
                riskLevel = "Medium";
            }
        
            const bubble = document.createElement("div");
            bubble.innerText = `Risk: ${riskLevel}\n\n${summary}`;
            bubble.style.position = "fixed";
            bubble.style.top = "20px";
            bubble.style.right = "20px";
            bubble.style.backgroundColor = "white";
            bubble.style.color = "black";
            bubble.style.border = "1px solid black";
            bubble.style.padding = "10px";
            bubble.style.borderRadius = "6px";
            bubble.style.zIndex = 999999;
        
            document.body.appendChild(bubble);
            setTimeout(() => bubble.remove(), 10000);
        }
})();
    