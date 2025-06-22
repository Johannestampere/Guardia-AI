// App.js
/* global chrome */

import React, { useEffect, useState } from "react";

export default function App() {
  const [textWarning, setTextWarning] = useState(true);
  const [voiceWarning, setVoiceWarning] = useState(true);
  const [language, setLanguage] = useState("english");
  const [textSize, setTextSize] = useState(14);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(["textWarning", "voiceWarning", "language", "textSize"], (result) => {
        setTextWarning(result.textWarning ?? true);
        setVoiceWarning(result.voiceWarning ?? true);
        setLanguage(result.language ?? "english");
        setTextSize(result.textSize ?? 14);
      });
    }
  }, []);

  const handleToggle = (type) => {
    const newValue = type === "text" ? !textWarning : !voiceWarning;

    if (type === "text") {
      setTextWarning(newValue);
      if (typeof chrome !== "undefined" && chrome.storage?.sync) {
        chrome.storage.sync.set({ textWarning: newValue });
      }
    } else {
      setVoiceWarning(newValue);
      if (typeof chrome !== "undefined" && chrome.storage?.sync) {
        chrome.storage.sync.set({ voiceWarning: newValue });
      }
    }
  };

  const handleLanguageChange = (e) => {
    const selected = e.target.value;
    setLanguage(selected);
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.set({ language: selected });
    }
  };

  const handleTextSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setTextSize(newSize);
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.set({ textSize: newSize });
    }
  };

  return (
    <div className="w-96 p-8 bg-white rounded-2xl shadow-lg font-sans text-base text-gray-800">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">Guardia AI🛡</h1>
      <h2 className="text-center mb-6 text-gray-900">Your personal AI security assistant</h2>

      <p className="font-semibold mb-3 text-gray-700 text-lg">Alert Options:</p>

      <div className="flex flex-col gap-4 mb-6">
        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={textWarning}
            onChange={() => handleToggle("text")}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="font-medium text-base">Text Warning</span>
        </label>

        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={voiceWarning}
            onChange={() => handleToggle("voice")}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="font-medium text-base">Voice Warning</span>
        </label>
      </div>

      <div className="mb-6">
        <p className="font-semibold mb-2 text-gray-700 text-lg">Language:</p>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-blue-500 focus:outline-none transition-colors text-base"
        >
          <option value="english">🇺🇸 English</option>
          <option value="spanish">🇪🇸 Spanish</option>
          <option value="french">🇫🇷 French</option>
        </select>
      </div>

      <div>
        <p className="font-semibold mb-2 text-gray-700 text-lg">Text Size: {textSize}px</p>
        <input
          type="range"
          min="12"
          max="32"
          value={textSize}
          onChange={handleTextSizeChange}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>
    </div>
  );
}