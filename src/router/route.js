const router = require("express").Router();
const route = router;
const Services = require("../controller/services");

route.get("/", (req, res) => {
    res.send({
        author: "yazky",
        endpoint: {
            // Anime Endpoints
            getOngoingAnime: "/api/v1/ongoing/:page",
            getCompletedAnime: "/api/v1/completed/:page",
            getAnimeSearch: "/api/v1/search/:q",
            getAnimeList: "/api/v1/anime-list",
            getAnimeDetail: "/api/v1/detail/:endpoint",
            getAnimeEpisode: "/api/v1/episode/:endpoint",
            getBatchLink: "/api/v1/batch/:endpoint",
            getGenreList: "/api/v1/genres",
            getGenrePage: "/api/v1/genres/:genre/:page",

            // PinoyMoviePedia Endpoints
            pinoymoviepediaDownload: "/api/v1/pinoymoviepedia/download",
            pinoymoviepediaPinaySexy: "/api/v1/pinoymoviepedia/pinay-sexy",
            pinoymoviepediaRelease: "/api/v1/pinoymoviepedia/release",

            // BluRay Endpoints
            blurayGenre: "/api/v1/bluray/genre/:genre",
            blurayMovies: "/api/v1/bluray/movies",

            // MyInstants Endpoints
            myinstant: "/api/v1/myinstant",
            myinstantApi: "/api/v1/myinstant/api",
            myinstantCategory: "/api/v1/myinstant/category",

            // Streaming
            getEmbedStreaming: "/api/v1/streaming/:content"
        }
    });
});

// Anime Endpoints
router.get("/api/v1/ongoing/:page", Services.getOngoing);
router.get("/api/v1/completed/:page", Services.getCompleted);
router.get("/api/v1/search/:q", Services.getSearch);
router.get("/api/v1/anime-list", Services.getAnimeList);
router.get("/api/v1/detail/:endpoint", Services.getAnimeDetail);
router.get("/api/v1/episode/:endpoint", Services.getAnimeEpisode);
router.get("/api/v1/batch/:endpoint", Services.getBatchLink);
router.get("/api/v1/genres", Services.getGenreList);
router.get("/api/v1/genres/:genre/:page", Services.getGenrePage);

// PinoyMoviePedia Endpoints
router.get("/api/v1/pinoymoviepedia/download", Services.pinoymoviepediaDownload);
router.get("/api/v1/pinoymoviepedia/pinay-sexy", Services.pinoymoviepediaPinaySexy);
router.get("/api/v1/pinoymoviepedia/release", Services.pinoymoviepediaRelease);

// BluRay Endpoints
router.get("/api/v1/bluray/genre/:genre", Services.blurayGenre);
router.get("/api/v1/bluray/movies", Services.blurayMovies);

// MyInstants Endpoints
router.get("/api/v1/myinstant", Services.myinstant);
router.get("/api/v1/myinstant/api", Services.myinstantApi);
router.get("/api/v1/myinstant/category", Services.myinstantCategory);

// Streaming
router.get("/api/v1/streaming/:content", Services.getEmbedByContent);

module.exports = route;
