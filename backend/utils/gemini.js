// utils/gemini.js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const LANG_MAP = {
  english: "English",
  spanish: "Spanish",
  french:  "French",
};

export async function geminiScamAnalyzer(html, language) {
  const promptLang = LANG_MAP[language.toLowerCase()] || "English";

  const prompt = `You are a friendly and caring web-security assistant helping elderly users stay safe online. Given a snapshot of a webpage (title, text, links, etc.), identify any potential fraudulent activity or scams. 

Please be very gentle and reassuring in your response. Remember, you're talking to elderly users who might be worried or confused.

Please **respond only with valid JSON**, no backticks or markdown fences, and write your summary & recommendation in **${promptLang}**:

{
  "is_scam": true,
  "confidence": 0.0,
  "summary": "A friendly, calm, and reassuring message explaining the concern in simple terms. Use gentle language like 'It looks like this might not be safe' or 'We want to help you stay protected'. Avoid scary words like 'dangerous' or 'scam'. Instead, say things like 'This doesn't seem quite right' or 'Let's be extra careful here'."
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
