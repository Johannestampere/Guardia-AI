// App.js
/* global chrome */

import React, { useEffect, useState } from "react";

export default function App() {
  const [textWarning, setTextWarning] = useState(true);
  const [voiceWarning, setVoiceWarning] = useState(true);
  const [language, setLanguage] = useState("english");
  const [textSize, setTextSize] = useState(14);
s
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
    <div className="w-64 p-4 bg-white rounded-lg shadow font-sans text-sm text-gray-800">
      <h1 className="text-xl font-bold text-center mb-4">Fraud Protector</h1>

      <p className="font-medium mb-2">Alert Options:</p>

      <div className="flex flex-col gap-3 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={textWarning}
            onChange={() => handleToggle("text")}
            className="w-4 h-4"
          />
          <span>Text Warning</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={voiceWarning}
            onChange={() => handleToggle("voice")}
            className="w-4 h-4"
          />
          <span>Voice Warning</span>
        </label>
      </div>

      <div className="mb-4">
        <p className="font-medium mb-1">Language:</p>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="w-full border rounded px-2 py-1 bg-white"
        >
          <option value="english">English</option>
          <option value="spanish">Spanish</option>
          <option value="french">French</option>
        </select>
      </div>

      <div>
        <p className="font-medium mb-1">Text Size: {textSize}px</p>
        <input
          type="range"
          min="10"
          max="24"
          value={textSize}
          onChange={handleTextSizeChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>
    </div>
  );
}