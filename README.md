# Morrow

Morrow is an installable music-player PWA with YouTube Music search, InnerTube radio/autoplay and background playback.

## Included
- YouTube Music search through the unofficial InnerTube endpoints
- Real track playback
- YouTube Music `next`/radio queue for autoplay
- Background playback + lock-screen/media controls
- Queue, seek, previous/next, shuffle and likes
- Local library/history, public playlist discovery and following
- Contextual song actions for queueing, playlists, radio and taste controls
- Dedicated fullscreen Now Playing view with an audio-reactive visualizer
- iPhone, iPad and desktop UI
- Installable PWA + offline app shell

## Deploy
This build is configured for **Netlify**.

1. Upload/push the whole project folder to Netlify.
2. Netlify reads `netlify.toml` automatically.
3. The included Function handles InnerTube search/home/radio requests.
4. The included Edge Function streams audio through `/api/audio` so Safari can play it reliably without browser CORS issues.

There is no separate server for you to run or maintain. Morrow uses InnerTube exclusively; if the bridge is unavailable, no local audio fallback is shown.

## iPhone / iPad
Start the first track with a tap. Morrow now uses the native HTML audio pipeline instead of relying on the hidden YouTube iframe, which gives browsers and operating systems the best chance to keep playback alive in the background. Media Session controls expose play/pause, previous/next, seeking and artwork where supported. Adding Morrow to the Home Screen is the most reliable iPhone/iPad setup.

Background playback remains subject to browser and operating-system limits. Low Power Mode, memory pressure, network loss or a browser that does not expose Media Session can still suspend a web app; Morrow reports that capability honestly in Settings instead of claiming universal support.

## Files
- `public/app.js` — Morrow UI, player, search, queue and autoplay
- `netlify/functions/innertube.mjs` — InnerTube search/home/next/player bridge
- `netlify/edge-functions/audio.mjs` — streamed audio/HLS bridge
- `netlify.toml` — Netlify routing
- `public/sw.js` — offline app shell

## InnerTube
The implementation follows the same private YouTube/YouTube Music endpoints exposed by the open-source `tombulled/innertube` project. Client values are kept in one place at the top of `netlify/functions/innertube.mjs` so they are easy to update when YouTube changes them.
