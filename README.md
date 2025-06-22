**Built as a submission to SpurHacks 2025**

## Authors:

Johannes Tampere, CS @ Waterloo. [Connect](https://www.linkedin.com/in/johannes-tampere/)

Noah Stokes, CS @ Waterloo. [Connect](https://www.linkedin.com/in/noah-stokes-603109254/)

Aaryan Arora, Science and Business @ Waterloo. [Connect](https://www.linkedin.com/in/aaryaan-arora/)

## Guardia AI Fraud Protector 🛡️

A Chrome extension that protects users from online fraud and scams using AI-powered analysis and voice alerts, focused specifically on protecting the elderly. Built with React frontend and Node.js backend.

## Features

- **AI-Powered Scam Detection**: Uses Google's Gemini AI to analyze web pages for fraudulent content
- **Real-time Analysis**: Automatically scans pages as you browse
- **Voice Alerts**: Text-to-speech warnings in multiple languages
- **Visual Warnings**: Pop-up notifications with risk levels and explanations
- **Multi-language Support**: English, Spanish, and French
- **Customizable Settings**: Adjust text size, warning preferences, and language

## How It Works

1. **Content Analysis**: The extension extracts key page elements (title, meta description, forms, links, scripts)
2. **AI Processing**: Sends page data to Gemini AI for fraud detection analysis
3. **Risk Assessment**: Returns confidence scores and detailed explanations
4. **User Alerts**: Displays warnings and plays voice alerts for high-risk pages

1. **Browse normally** - The extension automatically analyzes pages
2. **View warnings** - High-risk pages show pop-up notifications
3. **Listen to alerts** - Voice warnings play for detected scams
4. **Customize settings** - Click the extension icon to adjust preferences

## Project Structure

```
SpurHacks/
├── backend/                 # Node.js server
│   ├── index.js            # Main server file
│   ├── utils/
│   │   └── gemini.js       # AI analysis functions
│   └── routes/
│       └── analyze.js      # API endpoints
├── frontend/               # React application
│   ├── src/               # Source code
│   └── build/             # Built files
├── content.js             # Chrome content script
├── background.js          # Chrome background script
├── manifest.json          # Extension manifest
└── README.md             # This file
```

## API Endpoints

- `GET /` - Health check
- `POST /analyze` - Analyze HTML content for fraud

### Analyze Request
```json
{
  "html": "page content",
  "language": "english"
}
```

### Analyze Response
```json
{
  "is_scam": true,
  "confidence": 0.85,
  "summary": "This page appears to be a phishing attempt...",
  "audio": "base64_encoded_audio"
}
```

## Configuration

The extension supports the following settings:

- **Language**: English, Spanish, French
- **Text Warning**: Enable/disable visual alerts
- **Voice Warning**: Enable/disable audio alerts
- **Text Size**: Adjust warning popup font size

## Security Features

- **Form Detection**: Identifies suspicious input forms
- **Link Analysis**: Checks for mismatched URLs and domains
- **Script Scanning**: Detects potentially malicious JavaScript
- **Content Analysis**: Analyzes text for deceptive language
- **Trust Indicators**: Evaluates security seals and certificates