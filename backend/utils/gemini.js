require('dotenv').config();

// sends prompt to Gemini and parses the result
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.action !== "html_loaded" || !sender.tab?.id) return;

  // Truncate if the page is huge
  // const htmlPayload = msg.html.slice(0, 15000); (commented out for now)
  // start of prompt for gemini api
const prompt = `You are a web-security analyst. Given the full HTML of a webpage, identify any potential fraudulent activity or scams. Specifically:
1. Flag phishing forms requesting personal, login, or payment information.
2. Highlight deceptive language promising unrealistic rewards or urgent action (“Click now or lose…”).
3. Spot links whose visible text and actual URLs don't match, or domains that look off.
4. Call out hidden or obfuscated scripts that could exfiltrate user data.
5. Note any other red flags (typosquatting, fake trust seals, mismatched SSL warnings, etc.).

Output a JSON object with these fields:
{
  "is_scam": <true|false>,
  "confidence": <0.0–1.0>,
  "issues": [
    {
      "type": "phishing_form" | "deceptive_language" | "suspicious_link" | "malicious_script" | "...",
      "snippet": "<the relevant HTML or text snippet>",
      "explanation": "Why this is suspicious"
    }
  ],
  "summary": "A one-sentence verdict/explanation",
  "recommendation": "What the user should do (e.g. avoid, report, enable security extension)"
}

HTML:
\`\`\`html
${msg.html}
\`\`\``;
// end of prompt

  try {
    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const raw = response.text || "";

    // Parse it into an object (String -> JSON)
    let result;
    try {
      result = JSON.parse(raw);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON:", parseErr, raw);
      // Fallback: wrap the raw text so the content script can at least display it
      result = { summary: raw, issues: [] };
    }

    // Send structured data to the content script
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "gemini_response",
      data: result
    });

  } catch (err) {
    console.error("Gemini API error:", err);
    chrome.tabs.sendMessage(sender.tab.id, { action: "gemini_error" });
  }

});
