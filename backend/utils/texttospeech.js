// texttospeech.js
export async function fetchTTS(text, language) {
  // map your config.language → Google TTS voice settings
  const VOICE_MAP = {
    english: { languageCode: "en-US", name: "en-US-Wavenet-F" },
    french:  { languageCode: "fr-FR", name: "fr-FR-Chirp3-HD-Sulafat" },
    spanish: { languageCode: "es-ES", name: "es-ES-Wavenet-D" },
  };

  const voiceConfig = VOICE_MAP[language] || VOICE_MAP.english;

  const resp = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_CLOUD_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: voiceConfig,
        audioConfig: { audioEncoding: "MP3" }
      })
    }
  );

  const { audioContent } = await resp.json();
  console.log("Called TTS with", voiceConfig.languageCode, " and ", voiceConfig.name);
  return audioContent; // Base64-encoded MP3
}
