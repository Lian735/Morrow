# Morrow

Morrow is an installable music-player PWA with YouTube Music search, InnerTube radio/autoplay and background playback.

## Included
- YouTube Music search through the unofficial InnerTube endpoints
- Real track playback
- YouTube Music `next`/radio queue for autoplay
- Background playback + lock-screen/media controls
- Queue, seek, previous/next, shuffle and likes
- Local library/history
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
Start the first track with a tap. After that, autoplay can continue automatically and Media Session controls allow background/lock-screen playback. Adding Morrow to the Home Screen gives the most app-like experience.

## Files
- `public/app.js` — Morrow UI, player, search, queue and autoplay
- `netlify/functions/innertube.mjs` — InnerTube search/home/next/player bridge
- `netlify/edge-functions/audio.mjs` — streamed audio/HLS bridge
- `netlify.toml` — Netlify routing
- `public/sw.js` — offline app shell

## InnerTube
The implementation follows the same private YouTube/YouTube Music endpoints exposed by the open-source `tombulled/innertube` project. Client values are kept in one place at the top of `netlify/functions/innertube.mjs` so they are easy to update when YouTube changes them.
