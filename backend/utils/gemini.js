// utils/gemini.js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

// Map our config.language → proper language names for Gemini
const LANG_MAP = {
  english: "English",
  spanish: "Spanish",
  french:  "French",
};

export async function geminiScamAnalyzer(html, language) {
  const promptLang = LANG_MAP[language.toLowerCase()] || "English";

  const prompt = `You are a web-security analyst. Given a snapshot of a webpage (title, text, links, etc.), identify any potential fraudulent activity or scams. Specifically:
1. Flag phishing forms requesting personal or payment information.
2. Highlight deceptive language promising unrealistic rewards or urgent action.
3. Spot mismatched link text vs. href, typosquatting domains, or obfuscated scripts.
4. Note any other red flags (fake trust seals, mismatched SSL warnings, etc.).

Please **respond only with valid JSON**, no backticks or markdown fences, and write your summary & recommendation in **${promptLang}**:

{
  "is_scam": true,
  "confidence": 0.0,
  "summary": "One-sentence verdict & recommendation (e.g. avoid, report, enable security extension)."
}

Snapshot:
${html}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    console.log("Called Gemini");

    // clean out any stray fences
    let raw = response.text ?? "";
    let jsonText = raw
      .replace(/```(?:json)?\s*/g, "")
      .replace(/\s*```$/g, "")
      .trim();

    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start >= 0 && end > start) {
      jsonText = jsonText.slice(start, end + 1);
    }

    const parsed = JSON.parse(jsonText);
    return {
      is_scam:    parsed.is_scam,
      confidence: parsed.confidence,
      summary:    parsed.summary,
    };

  } catch (err) {
    console.error("Gemini API error or parse failure:", err);
    throw err;
  }
}
