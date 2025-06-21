// texttospeech.js
export async function fetchTTS(text) {
  const resp = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_CLOUD_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "en-US", name: "en-US-Wavenet-D" },
        audioConfig: { audioEncoding: "MP3" }
      })
    }
  );
  const { audioContent } = await resp.json();
  return audioContent; // Base64-encoded MP3
}