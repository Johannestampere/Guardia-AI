// analyze.js
import 'dotenv/config';
import express from 'express';
import { geminiScamAnalyzer } from '../utils/gemini.js';
import { fetchTTS } from '../utils/texttospeech.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/analyze', async (req, res) => {
  try {
    const { html, language } = req.body;
    if (!html || !language) {
      return res.status(400).json({ error: 'Missing html or language in request body' });
    }

    const analysis = await geminiScamAnalyzer(html, language);
    const audioBase64 = await fetchTTS(analysis.summary);

    res.json({
      is_scam:    analysis.is_scam,
      confidence: analysis.confidence,
      summary:    analysis.summary,
      audio:      audioBase64
    });
    console.log("Sent response back to content script");
  } catch (err) {
    console.error('Error in /analyze:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});