// texttospeech.js
export async function fetchTTS(text, language) {
  if (!process.env.GOOGLE_CLOUD_TTS_KEY) {
    console.error("[TTS] GOOGLE_CLOUD_TTS_KEY not found in environment variables");
    return null;
  }


  const VOICE_MAP = {
    english: { languageCode: "en-US", name: "en-US-Chirp3-HD-Aoede" },
    french:  { languageCode: "fr-FR", name: "fr-FR-Chirp3-HD-Sulafat" },
    spanish: { languageCode: "es-ES", name: "es-ES-Wavenet-D" },
  };

  const voiceConfig = VOICE_MAP[language] || VOICE_MAP.english;

  try {
    const resp = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_CLOUD_TTS_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: voiceConfig,
          audioConfig: { audioEncoding: "MP3" }
        })
      }
    );

    const responseData = await resp.json();
    
    if (responseData.error) {
      console.error("[TTS] Error from Google TTS:", responseData.error);
      return null;
    }

    const { audioContent } = responseData;
    return audioContent; // Base64-encoded MP3
  } catch (error) {
    console.error("[TTS] Network or other error:", error);
    return null;
  }
}
