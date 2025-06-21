// gemini.js
import 'dotenv/config';

// sends prompt to Gemini and parses the result
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

/**
 * Analyzes HTML content for potential fraudulent activity using Gemini API
 * @param {string} html - The HTML content to analyze
 * @param {string} language - the output language of the analysis
 * @returns {Promise<Object>} - Parsed JSON result with scam analysis
 */
export async function geminiScamAnalyzer(html, language) {
  // start of prompt for gemini api
  const prompt = `You are a web-security analyst. Given the full HTML of a webpage, identify any potential fraudulent activity or scams. Specifically:
1. Flag phishing forms requesting personal, login, or payment information.
2. Highlight deceptive language promising unrealistic rewards or urgent action ("Click now or lose…").
3. Spot links whose visible text and actual URLs don't match, or domains that look off.
4. Call out hidden or obfuscated scripts that could exfiltrate user data.
5. Note any other red flags (typosquatting, fake trust seals, mismatched SSL warnings, etc.).

Use the following language for the summary and recommendation output: ${language}
Output a JSON object with these fields:
{
  "is_scam": <true|false>,
  "confidence": <0.0–1.0>,
  "summary: "A one-sentence verdict/explanation, and a recommendation on what the user should do (e.g. avoid, report, enable security extension)"
}

HTML:
\`\`\`html
${html}
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

    return result;

  } catch (err) {
    console.error("Gemini API error:", err);
    throw err;
  }
}