// analyze.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { geminiScamAnalyzer } from '../utils/gemini.js';
import { fetchTTS } from '../utils/texttospeech.js';

const app = express();
const PORT = process.env.PORT || 5001;

// allow large snapshots
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ origin: '*' }));

app.post('/analyze', async (req, res) => {
  try {
    const { html, language } = req.body;
    if (!html || !language) {
      return res.status(400).json({ error: 'Missing html or language in request body' });
    }

    // 1) Ask Gemini for scam analysis
    const analysis = await geminiScamAnalyzer(html, language);

    // 2) Generate TTS in the chosen language
    const audioBase64 = await fetchTTS(analysis.summary, language);

    // 3) Return everything
    res.json({
      is_scam:    analysis.is_scam,
      confidence: analysis.confidence,
      summary:    analysis.summary,
      audio:      audioBase64
    });
    console.log('Sent response back to content script');
  } catch (err) {
    console.error('Error in /analyze:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
