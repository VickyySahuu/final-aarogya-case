// test-gemini-file-api.cjs
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function testFileUploadAndGenerate() {
  const testPdf = path.join(__dirname, '..', 'sample_documents', 'CBC_Lab_Report.pdf');
  const buffer = fs.readFileSync(testPdf);

  console.log('Uploading PDF via Gemini Files API...');
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'start, upload, finalize',
      'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
      'X-Goog-Upload-Header-Content-Type': 'application/pdf',
      'Content-Type': 'application/pdf'
    },
    body: buffer
  });

  console.log('Upload status:', uploadRes.status, uploadRes.statusText);
  const uploadData = await uploadRes.json();
  console.log('Upload response:', JSON.stringify(uploadData, null, 2));

  if (!uploadData.file || !uploadData.file.uri) {
    console.error('File upload failed!');
    return;
  }

  const fileUri = uploadData.file.uri;
  console.log('\nQuerying gemini-3.6-flash and gemini-3.1-flash-lite with fileData...');

  for (const model of ['gemini-3.6-flash', 'gemini-3.1-flash-lite']) {
    try {
      const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const genRes = await fetch(genUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { fileData: { mimeType: 'application/pdf', fileUri } },
              { text: 'Extract all clinical lab test names and values as JSON: {"tests": [{"name": "...", "value": "..."}]}' }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      console.log(`[${model}] status:`, genRes.status);
      const text = await genRes.text();
      console.log(`[${model}] result:`, text.slice(0, 400));
    } catch (e) {
      console.error(`[${model}] error:`, e.message);
    }
  }
}

testFileUploadAndGenerate();
