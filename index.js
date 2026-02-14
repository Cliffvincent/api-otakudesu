const express = require('express');
const cors = require('cors');
const app = express();
const route = require("./src/router/route")
const { inject } = require("@vercel/analytics")

inject();



const API_KEY = 'b7dced12866eeef7ada4537c3fa952135e6c9680b0b332bcad99866823b6199b';

app.get('/song-details', async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const response = await axios.get(`https://spotdown.org/api/song-details?url=${encodeURIComponent(search)}`, {
      headers: { 'x-api-key': API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/Spotify/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const response = await axios.post('https://spotdown.org/api/download', { url }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'origin': 'https://spotdown.org',
        'referer': 'https://spotdown.org/',
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.use(cors());
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'yo.html'));
});

const port = process.env.port || 8000;

app.listen(port, () => {
    try {
        console.log(`Running on localhost:${port}`);
    } catch (error) {
        throw error;
    }
}); 
