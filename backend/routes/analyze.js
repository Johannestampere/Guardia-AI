// analyze.js
import 'dotenv/config';

const express = require('express');
const app = express();

app.use(express.text({ type: 'text/html' }));

app.post('/analyze', async (req, res) => {
    const { html, language } = req.body;
    analysis = await geminiScamAnalyzer(html, language);
    const key = "audio"
    const value = await fetchTTS(analysis.summary);
    const response = {
        "is_scam": analysis.is_scam,
        "confidence": analysis.confidence,
        "summary": analysis.summary,
        [key]: value
    } 
    res.json(response)
})

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})