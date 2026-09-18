// backend/test-gemini-multimodal.cjs
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key present:', !!apiKey, 'Length:', apiKey ? apiKey.length : 0);

async function testModelWithImage(model, imagePath, mimeType) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const buffer = fs.readFileSync(imagePath);
  const base64Data = buffer.toString('base64');

  console.log(`\nTesting model: ${model} with ${path.basename(imagePath)} (${mimeType}, size: ${buffer.length} bytes)...`);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: 'Describe what this image/document is and what text it contains in JSON format: {"description": "...", "text": "..."}' }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response body (first 300 chars): ${text.slice(0, 300)}`);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function run() {
  const models = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  const testImg = path.join(__dirname, '..', 'sample_documents', 'Previous_Prescription.png');
  const testPdf = path.join(__dirname, '..', 'sample_documents', 'CBC_Lab_Report.pdf');

  for (const m of models) {
    await testModelWithImage(m, testImg, 'image/png');
    await testModelWithImage(m, testPdf, 'application/pdf');
  }
}

run();
