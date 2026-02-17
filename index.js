const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const route = require("./src/router/route");

const app = express();

app.use(cors());
app.use(express.json());

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '4c4fc8c3496243cbba99b39826e2841f';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'd598f89aba0946e2b85fb8aefa9ae4c8';

let tokenCache = {
  access_token: null,
  expires_at: 0,
};

app.get('/spotify/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  const apikey = (req.query.apikey || '').trim();
  const type = (req.query.type || 'track').trim();
  const limitRaw = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 20;

  const status = {
    text: { creator: 'Cliff', status: false, msg: "Input 'text' parameter" },
    link: { creator: 'Cliff', status: false, msg: "Input 'link' parameter" },
    query: { creator: 'Cliff', status: false, msg: "Missing 'q' parameter!" },
    url: { creator: 'Cliff', status: false, msg: "Missing 'url' parameter!" },
    apikey: { creator: 'Cliff', status: false, msg: "Missing 'apikey' parameter!" },
    invalidKey: { creator: 'Cliff', status: false, msg: 'ApiKey is invalid!' },
    invalidURL: { creator: 'Cliff', status: false, msg: 'URL is invalid' },
    error: { status: false, creator: 'Cliff', msg: 'Page Not Found!' }
  };

  if (!q) return res.json(status.query);
  if (!apikey) return res.json(status.apikey);
  if (!['syugg'].includes(apikey)) return res.json(status.invalidKey);

  const result = await searching(q, type, limit);
  res.header('Content-Type', 'application/json');
  return res.status(result && result.status ? 200 : 400).type('json').send(JSON.stringify(result, null, 2));
});

function msToTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

function pickThumbnails(images) {
  const arr = Array.isArray(images) ? images.filter(Boolean) : [];
  if (arr.length === 0) return { large: null, medium: null, small: null, images: [] };
  const sorted = [...arr].sort((a, b) => (b.width || 0) - (a.width || 0));
  const large = sorted[0]?.url || null;
  const medium = sorted[Math.floor(sorted.length / 2)]?.url || large;
  const small = sorted[sorted.length - 1]?.url || medium || large;
  return { large, medium, small, images: sorted.map(i => ({ url: i.url, width: i.width, height: i.height })) };
}

async function spotifyCreds() {
  try {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return { creator: 'Cliff', status: false, msg: 'Missing Spotify client credentials' };
    }

    const now = Date.now();
    if (tokenCache.access_token && tokenCache.expires_at > now + 5000) {
      return { creator: 'Cliff', status: true, data: { access_token: tokenCache.access_token } };
    }

    const resp = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const json = resp.data || {};
    if (!json.access_token) {
      return { creator: 'Cliff', status: false, msg: 'Unable to generate token' };
    }

    const expiresIn = Number(json.expires_in) || 3600;
    tokenCache.access_token = json.access_token;
    tokenCache.expires_at = Date.now() + expiresIn * 1000;

    return { creator: 'Cliff', status: true, data: json };
  } catch (e) {
    return { creator: 'Cliff', status: false, msg: e?.response?.data?.error_description || e?.message || 'Unknown error' };
  }
}

async function getTrackById(trackId) {
  try {
    const creds = await spotifyCreds();
    if (!creds.status) return creds;

    const json = (await axios.get('https://api.spotify.com/v1/tracks/' + encodeURIComponent(trackId), {
      headers: { Authorization: 'Bearer ' + creds.data.access_token }
    })).data;

    const thumbs = pickThumbnails(json?.album?.images);
    const artists = Array.isArray(json?.artists) ? json.artists.map(a => ({
      id: a.id,
      name: a.name,
      uri: a.uri,
      href: a.href,
      external_urls: a.external_urls || {}
    })) : [];

    return {
      creator: 'Cliff',
      status: true,
      data: {
        id: json.id,
        name: json.name,
        title: (artists[0]?.name ? artists[0].name + ' - ' : '') + json.name,
        artists,
        artist_names: artists.map(a => a.name),
        album: {
          id: json?.album?.id,
          name: json?.album?.name,
          album_type: json?.album?.album_type,
          release_date: json?.album?.release_date,
          total_tracks: json?.album?.total_tracks,
          external_urls: json?.album?.external_urls || {},
          thumbnails: thumbs
        },
        thumbnails: thumbs,
        duration_ms: json.duration_ms,
        duration: msToTime(json.duration_ms),
        popularity: json.popularity,
        explicit: !!json.explicit,
        preview_url: json.preview_url,
        uri: json.uri,
        href: json.href,
        external_urls: json.external_urls || {},
        track_number: json.track_number,
        disc_number: json.disc_number,
        is_local: !!json.is_local
      }
    };
  } catch (e) {
    return { creator: 'Cliff', status: false, msg: e?.response?.data?.error?.message || e?.message || 'Unknown error' };
  }
}

async function getInfo(url) {
  try {
    if (!url || typeof url !== 'string') return { creator: 'Cliff', status: false, msg: 'URL is invalid' };
    const m = url.match(/track\/([A-Za-z0-9]+)/);
    const trackId = m && m[1] ? m[1] : null;
    if (!trackId) return { creator: 'Cliff', status: false, msg: 'URL is invalid' };
    return await getTrackById(trackId);
  } catch (e) {
    return { creator: 'Cliff', status: false, msg: e?.message || 'Unknown error' };
  }
}

async function searching(query, type = 'track', limit = 20) {
  try {
    const creds = await spotifyCreds();
    if (!creds.status) return creds;

    const qp = new URLSearchParams({
      q: query,
      type: type,
      offset: '0',
      limit: String(limit)
    });

    const json = (await axios.get('https://api.spotify.com/v1/search?' + qp.toString(), {
      headers: { Authorization: 'Bearer ' + creds.data.access_token }
    })).data;

    const tracks = json?.tracks?.items || [];
    if (!Array.isArray(tracks) || tracks.length < 1) {
      return { creator: 'Cliff', status: false, msg: 'Music not found' };
    }

    const data = tracks.map(v => {
      const thumbs = pickThumbnails(v?.album?.images);
      const artists = Array.isArray(v?.artists) ? v.artists.map(a => ({
        id: a.id,
        name: a.name,
        uri: a.uri,
        href: a.href,
        external_urls: a.external_urls || {}
      })) : [];

      return {
        id: v.id,
        name: v.name,
        title: (artists[0]?.name ? artists[0].name + ' - ' : '') + v.name,
        artists,
        artist_names: artists.map(a => a.name),
        album: {
          id: v?.album?.id,
          name: v?.album?.name,
          album_type: v?.album?.album_type,
          release_date: v?.album?.release_date,
          total_tracks: v?.album?.total_tracks,
          external_urls: v?.album?.external_urls || {},
          thumbnails: thumbs
        },
        thumbnails: thumbs,
        duration_ms: v.duration_ms,
        duration: msToTime(v.duration_ms),
        popularity: v.popularity,
        explicit: !!v.explicit,
        preview_url: v.preview_url,
        uri: v.uri,
        href: v.href,
        url: v?.external_urls?.spotify || null,
        external_urls: v.external_urls || {},
        track_number: v.track_number,
        disc_number: v.disc_number,
        is_local: !!v.is_local
      };
    });

    return { creator: 'Cliff', status: true, data };
  } catch (e) {
    return { creator: 'Cliff', status: false, msg: e?.response?.data?.error?.message || e?.message || 'Unknown error' };
  }
}

app.get('/spotify/home', async (req, res) => {
  try {
    const { data } = await axios.get('https://open.spotify.com');
    const $ = cheerio.load(data);

    const trendingSongs = [];
    const popularArtists = [];
    const popularAlbums = [];
    const popularRadio = [];
    const featuredCharts = [];

    $('div[data-testid="carousel-mwp"]').eq(0).find('div[data-testid="home-card"]').each((i, el) => {
      const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
      const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
      const spot = `https://open.spotify.com${href}`;
      const embedUrl = spot.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
      const image = $(el).find('img[data-encore-id="image"]').attr('src');
      if (title && href && image) trendingSongs.push({ title, thumbnail: image, href: spot, embedUrl });
    });

    $('div[data-testid="carousel-mwp"]').eq(1).find('div[data-testid="home-card"]').each((i, el) => {
      const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
      const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
      const spotify = `https://open.spotify.com${href}`;
      const embedUrl = spotify.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
      const image = $(el).find('img[data-encore-id="image"]').attr('src');
      if (title && href && image) popularArtists.push({ title, thumbnail: image, href: spotify, embedUrl });
    });

    $('div[data-testid="carousel-mwp"]').eq(2).find('div[data-testid="home-card"]').each((i, el) => {
      const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
      const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
      const spotify = `https://open.spotify.com${href}`;
      const embedUrl = spotify.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
      const image = $(el).find('img[data-encore-id="image"]').attr('src');
      if (title && href && image) popularAlbums.push({ title, thumbnail: image, href: spotify, embedUrl });
    });

    $('div[data-testid="carousel-mwp"]').eq(3).find('div[data-testid="home-card"]').each((i, el) => {
      const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
      const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
      const spotify = `https://open.spotify.com${href}`;
      const embedUrl = spotify.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
      const image = $(el).find('img[data-encore-id="image"]').attr('src');
      if (title && href && image) popularRadio.push({ title, image, href: spotify, playlist: embedUrl });
    });

    $('div[data-testid="carousel-mwp"]').eq(4).find('div[data-testid="home-card"]').each((i, el) => {
      const title = $(el).find('a[data-encore-id="listRowTitle"]').text().trim();
      const href = $(el).find('a[data-encore-id="listRowTitle"]').attr('href');
      const spotify = `https://open.spotify.com${href}`;
      const embedUrl = spotify.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/").replace("/artist/", "/embed/artist/").replace("/track/", "/embed/track/");
      const image = $(el).find('img[data-encore-id="image"]').attr('src');
      if (title && href && image) featuredCharts.push({ title, thumbnail: image, href: spotify, playlist: embedUrl });
    });

    res.json({
      author: "yazky",
      results: { trendingSongs, popularArtists, popularAlbums, popularRadio, featuredCharts }
    });
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
    if (!search) return res.status(400).json({ error: 'URL parameter is required' });

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
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });

    const response = await axios.post(
      'https://spotdown.org/api/download',
      { url },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'origin': 'https://spotdown.org',
          'referer': 'https://spotdown.org/'
        },
        responseType: 'stream'
      }
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename="song.mp3"'
    });

    response.data.pipe(res);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const port = process.env.PORT || 5000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Running on 0.0.0.0:${port}`);
});
