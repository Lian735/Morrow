# Morrow

Morrow is an installable music-player PWA with YouTube Music search, InnerTube radio/autoplay and Media Session controls.

## Included
- YouTube Music search through the unofficial InnerTube endpoints
- Real track playback
- YouTube Music `next`/radio queue for autoplay
- Lock-screen/media controls where supported
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
4. Playback uses YouTube's IFrame API in a permanently mounted, visually hidden surface. The Morrow MiniPlayer remains the only visible playback UI.

There is no separate server for you to run or maintain. Morrow uses InnerTube exclusively; if the bridge is unavailable, no local audio fallback is shown.

## iPhone / iPad
Start the first track with a tap. Morrow keeps the required YouTube player mounted outside the visible viewport and connects play/pause, previous/next, seeking and artwork to Media Session where supported. Adding Morrow to the Home Screen generally gives the browser the best chance to preserve the session.

Safari suspends embedded YouTube playback when the app is backgrounded or the device is locked. YouTube's API policies also prohibit extracting audio from videos or enabling background play for the embedded player. Reliable iPhone/iPad background audio therefore requires a separately licensed direct audio source; Morrow reports the current limitation honestly in Settings.

## Icons
Interface icons come from the official `@phosphor-icons/web` package (Phosphor Icons, MIT). The font files are vendored in `public/vendor/phosphor` so the interface does not depend on an icon CDN.

## Files
- `public/app.js` — Morrow UI, player, search, queue and autoplay
- `netlify/functions/innertube.mjs` — InnerTube search/home/next/player bridge
- `netlify/edge-functions/audio.mjs` — retained direct-stream fallback infrastructure
- `netlify.toml` — Netlify routing
- `public/sw.js` — offline app shell

## InnerTube
The implementation follows the same private YouTube/YouTube Music endpoints exposed by the open-source `tombulled/innertube` project. Client values are kept in one place at the top of `netlify/functions/innertube.mjs` so they are easy to update when YouTube changes them.
