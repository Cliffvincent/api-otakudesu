const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const app = express();
const cheerio = require('cheerio');
const route = require("./src/router/route")

app.use(cors());
app.use(express.json());

app.get('/spotify/home', async (req, res) => {
    try {
        const { data } = await axios.get('https://open.spotify.com');
        const $ = cheerio.load(data);

        const trendingSongs = [];
        const popularArtists = [];
        const popularAlbums = [];
        const popularRadio = [];
        const featuredCharts = [];

        // Parse Trending Songs
        $('div[data-testid="carousel-mwp"]').eq(0).find('div[data-testid="home-card"]').each((i, el) => {
            const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
            const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
const spot = `https://open.spotify.com${href}`;
const embedUrl = spot.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
            const image = $(el).find('img[data-encore-id="image"]').attr('src');
            if (title && href && image) {
                trendingSongs.push({ title, thumbnail: image, href:spot, embedUrl: embedUrl });
            }
        });

        // Parse Popular Artists
        $('div[data-testid="carousel-mwp"]').eq(1).find('div[data-testid="home-card"]').each((i, el) => {
            const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
            const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
const spotify = `https://open.spotify.com${href}`;
const embedUrl = spotify.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
            const image = $(el).find('img[data-encore-id="image"]').attr('src');
            if (title && href && image) {
                popularArtists.push({ title, thumbnail: image, href: spotify, embedUrl: embedUrl});
            }
        });

        // Parse Popular Albums
        $('div[data-testid="carousel-mwp"]').eq(2).find('div[data-testid="home-card"]').each((i, el) => {
            const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
            const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
const spotify = `https://open.spotify.com${href}`;
const embedUrl = spotify.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
            const image = $(el).find('img[data-encore-id="image"]').attr('src');
            if (title && href && image) {
                popularAlbums.push({ title, thumbnail: image, href: spotify,  embedUrl: embedUrl });
            }
        });

        // Parse Popular Radio
        $('div[data-testid="carousel-mwp"]').eq(3).find('div[data-testid="home-card"]').each((i, el) => {
            const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
            const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
            const spotify = `https://open.spotify.com${href}`;
const embedUrl = spotify.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
            const image = $(el).find('img[data-encore-id="image"]').attr('src');
            if (title && href && image) {
                popularRadio.push({ title, image, href: spotify,  playlist: embedUrl});
            }
        });

        // Parse Featured Charts
        $('div[data-testid="carousel-mwp"]').eq(4).find('div[data-testid="home-card"]').each((i, el) => {
            const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
            const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
            const spotify = `https://open.spotify.com${href}`;
const embedUrl = spotify.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
            const image = $(el).find('img[data-encore-id="image"]').attr('src');
            if (title && href && image) {
                featuredCharts.push({ title, thumbnail: image, href: spotify, playlist: embedUrl });
            }
        });

        res.json({
            author: "yazky",
            results: {
            trendingSongs,
            popularArtists,
            popularAlbums,
            popularRadio,
            featuredCharts
            }});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'src', 'yo.html'));
});



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

app.get('/spotify/download', async (req, res) => {
  try {
    const { url } = req.query;
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
      },
    responseType: 'stream' 
    });


    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename="song.mp3"',
    });
    // I-stream ang video data papunta sa response
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


const port = process.env.PORT || 5000;

app.listen(port, '0.0.0.0', () => {
    console.log(`Running on 0.0.0.0:${port}`);
});
