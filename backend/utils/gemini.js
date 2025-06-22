// gemini.js
import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

/**
 * Analyzes HTML content for potential fraudulent activity using Gemini API
 * @param {string} html - The page snapshot to analyze (e.g. title, text, links)
 * @param {string} language - Output language for summary/recommendation
 * @returns {Promise<{is_scam: boolean, confidence: number, summary: string}>}
 */
export async function geminiScamAnalyzer(snapshot, language) {
  // 1. Build your prompt, with correct JSON schema
  const prompt = `You are a web-security analyst. Given a snapshot of a webpage (title, text, links, etc.), identify any potential fraudulent activity or scams. Specifically:
1. Flag phishing forms requesting personal or payment information.
2. Highlight deceptive language promising unrealistic rewards or urgent action.
3. Spot mismatched link text vs. href, typosquatting domains, or obfuscated scripts.
4. Note any other red flags (fake trust seals, mismatched SSL warnings, etc.).

Use ${language} for the summary and recommendation.  
**Respond with only valid JSON**—no backticks, no markdown fences:

{
  "is_scam": true,
  "confidence": 0.0,
  "summary": "A one-sentence verdict and recommendation (e.g. avoid, report, enable security extension)."
}

Snapshot:
\`\`\`
${snapshot}
\`\`\``; 

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    console.log("Called Gemini");

    const raw = response.text ?? "";

    let jsonText = raw
      .replace(/```(?:json)?\s*/g, "")
      .replace(/\s*```$/g, "")
      .trim();

    const start = jsonText.indexOf("{");
    const end   = jsonText.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      jsonText = jsonText.substring(start, end + 1);
    }

    const parsed = JSON.parse(jsonText);

    return {
      is_scam:    parsed.is_scam,
      confidence: parsed.confidence,
      summary:    parsed.summary
    };

  } catch (err) {
    console.error("Gemini API error or parse failure:", err);
    throw err;
  }
}