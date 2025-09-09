import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { files } = await parseForm(req);
    const audioFile = files.audio;

    if (!audioFile) {
      res.status(400).json({ error: 'No audio file uploaded.' });
      return;
    }

    const formData = new FormData();
    formData.append('audio_file', fs.createReadStream(audioFile.filepath), audioFile.originalFilename);

    const splitterRes = await fetch('https://api.splitter.ai/api/v1/stems', {
      method: 'POST',
      body: formData
    });

    if (!splitterRes.ok) {
      const err = await splitterRes.text();
      res.status(500).json({ error: 'Splitter.ai failed', details: err });
      return;
    }

    const result = await splitterRes.json();
    res.status(200).json(result);

  } catch (e) {
    res.status(500).json({ error: 'Failed to split stem', details: String(e) });
  }
}