# Web Scraping API

## Overview
A Node.js Express API providing web scraping endpoints for anime, movies, music, and streaming content. Includes a Spotify Dashboard frontend.

## Project Architecture
- **Entry point**: `index.js` - Express server on port 5000
- **Routes**: `src/router/route.js` - API route definitions
- **Controllers**: `src/controller/services.js` - Request handlers
- **Helpers**: `src/helper/` - Scraping utilities
- **Constants**: `src/constant/url.js` - Base URL config
- **Frontend**: `src/yo.html` - Spotify Dashboard UI

## Tech Stack
- Node.js 20 with Express
- Cheerio for HTML parsing
- Axios for HTTP requests

## Key Endpoints
- `/` - Spotify Dashboard frontend
- `/song-details` - Spotify song search
- `/spotify/download` - Spotify download proxy
- `/api/v1/` - Anime, movies, streaming scraping APIs

## Running
- `node index.js` starts the server on 0.0.0.0:5000
