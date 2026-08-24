// Morrow InnerTube bridge.
// Endpoint model based on tombulled/innertube and current public InnerTube clients.

const API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

const CLIENTS = {
  YTMUSIC: {
    id: '67', name: 'WEB_REMIX', version: '1.20250219.01.00',
    base: 'https://music.youtube.com/youtubei/v1',
    origin: 'https://music.youtube.com', referer: 'https://music.youtube.com/',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  },
  ANDROID_VR: {
    id: '28', name: 'ANDROID_VR', version: '1.65.10',
    base: 'https://www.youtube.com/youtubei/v1',
    origin: 'https://www.youtube.com', referer: 'https://www.youtube.com/',
    userAgent: 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    localeFields: false,
    extra: {
      deviceMake: 'Oculus', deviceModel: 'Quest 3', androidSdkVersion: 32,
      userAgent: 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
      osName: 'Android', osVersion: '12L'
    }
  },
  IOS: {
    id: '5', name: 'iOS', version: '20.11.6',
    base: 'https://youtubei.googleapis.com/youtubei/v1',
    origin: 'https://www.youtube.com', referer: 'https://www.youtube.com/',
    userAgent: 'com.google.ios.youtube/20.11.6 (iPhone10,4; U; CPU iOS 16_7_7 like Mac OS X)',
    extra: { deviceModel: 'iPhone10,4', osName: 'iOS', osVersion: '16.7.7.20H330', clientScreen: 'WATCH' }
  },
  ANDROID: {
    id: '3', name: 'ANDROID', version: '21.03.36',
    base: 'https://youtubei.googleapis.com/youtubei/v1',
    origin: 'https://www.youtube.com', referer: 'https://www.youtube.com/',
    userAgent: 'com.google.android.youtube/21.03.36 (Linux; U; Android 16; en_US; SM-S908E Build/TP1A.220624.014) gzip',
    extra: { androidSdkVersion: 36, osName: 'Android', osVersion: '16' }
  },
  WEB_SAFARI: {
    id: '1', name: 'WEB', version: '2.20260114.08.00',
    base: 'https://www.youtube.com/youtubei/v1',
    origin: 'https://www.youtube.com', referer: 'https://www.youtube.com/',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15,gzip(gfe)'
  },
  MWEB: {
    id: '2', name: 'MWEB', version: '2.20260205.04.01',
    base: 'https://www.youtube.com/youtubei/v1',
    origin: 'https://m.youtube.com', referer: 'https://m.youtube.com/',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1,gzip(gfe)'
  }
};

const SONG_FILTER = 'EgWKAQIIAWoKEAkQBRAKEAMQBA%3D%3D';

const text = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.simpleText) return value.simpleText;
  if (Array.isArray(value.runs)) return value.runs.map(r => r?.text || '').join('');
  return '';
};

function walk(node, key, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Object.prototype.hasOwnProperty.call(node, key)) out.push(node[key]);
  if (Array.isArray(node)) {
    for (const item of node) walk(item, key, out);
  } else {
    for (const value of Object.values(node)) walk(value, key, out);
  }
  return out;
}

function findWatchEndpoint(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.watchEndpoint?.videoId) return node.watchEndpoint;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findWatchEndpoint(item);
      if (found) return found;
    }
  } else {
    for (const value of Object.values(node)) {
      const found = findWatchEndpoint(value);
      if (found) return found;
    }
  }
  return null;
}

function bestThumb(node) {
  const lists = walk(node, 'thumbnails');
  const thumbs = lists.flatMap(v => Array.isArray(v) ? v : []).filter(t => t?.url);
  if (!thumbs.length) return null;
  thumbs.sort((a, b) => (Number(a.width || 0) * Number(a.height || 0)) - (Number(b.width || 0) * Number(b.height || 0)));
  let url = thumbs.at(-1).url;
  if (url.startsWith('//')) url = `https:${url}`;
  return url;
}

function parseDuration(value) {
  const s = text(value).trim();
  if (!/^\d+(?::\d{1,2}){1,2}$/.test(s)) return null;
  return s.split(':').reduce((n, part) => n * 60 + Number(part), 0);
}

function runsFromFlex(renderer) {
  return (renderer.flexColumns || []).flatMap(col => col?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []);
}

function parseResponsive(renderer) {
  const endpoint = renderer.navigationEndpoint?.watchEndpoint || findWatchEndpoint(renderer.flexColumns) || findWatchEndpoint(renderer.overlay);
  const videoId = endpoint?.videoId || renderer.playlistItemData?.videoId;
  if (!videoId) return null;

  const flex = renderer.flexColumns || [];
  const title = text(flex[0]?.musicResponsiveListItemFlexColumnRenderer?.text) || 'Unknown title';
  const runs = runsFromFlex(renderer);
  const artists = runs.filter(r => r?.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('UC')).map(r => r.text).filter(Boolean);
  const albumRun = runs.find(r => r?.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('MPR'));
  const fixed = renderer.fixedColumns || [];
  const durationValue = fixed.map(c => c?.musicResponsiveListItemFixedColumnRenderer?.text).find(v => parseDuration(v) != null)
    || flex.map(c => c?.musicResponsiveListItemFlexColumnRenderer?.text).find(v => parseDuration(v) != null);

  return {
    id: videoId, videoId, title,
    artist: artists.join(', ') || runs.find(r => r?.text && r.text !== title && !/[•·]/.test(r.text))?.text || 'YouTube Music',
    album: albumRun?.text || '', duration: parseDuration(durationValue),
    image: bestThumb(renderer), source: 'youtube'
  };
}

function parseTwoRow(renderer) {
  const endpoint = renderer.navigationEndpoint?.watchEndpoint || findWatchEndpoint(renderer);
  const videoId = endpoint?.videoId;
  if (!videoId) return null;
  const title = text(renderer.title) || 'Unknown title';
  const runs = renderer.subtitle?.runs || [];
  const artistRuns = runs.filter(r => r?.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('UC'));
  const albumRun = runs.find(r => r?.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('MPR'));
  return {
    id: videoId, videoId, title,
    artist: artistRuns.map(r => r.text).join(', ') || runs.filter(r => r?.text && ![' • ', ' · '].includes(r.text)).map(r => r.text).slice(0, 1).join('') || 'YouTube Music',
    album: albumRun?.text || '', duration: null,
    image: bestThumb(renderer), source: 'youtube'
  };
}

function parsePanel(renderer) {
  const videoId = renderer.videoId || renderer.navigationEndpoint?.watchEndpoint?.videoId;
  if (!videoId) return null;
  const title = text(renderer.title) || 'Unknown title';
  const bylineRuns = renderer.longBylineText?.runs || renderer.shortBylineText?.runs || [];
  const artists = bylineRuns.filter(r => r?.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('UC')).map(r => r.text).filter(Boolean);
  const albumRun = bylineRuns.find(r => r?.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('MPR'));
  return {
    id: videoId, videoId, title,
    artist: artists.join(', ') || text(renderer.shortBylineText) || 'YouTube Music',
    album: albumRun?.text || '', duration: parseDuration(renderer.lengthText),
    image: bestThumb(renderer), source: 'youtube'
  };
}

function parseVideo(renderer) {
  const videoId = renderer.videoId;
  if (!videoId) return null;
  return {
    id: videoId,
    videoId,
    title: text(renderer.title) || 'Unknown title',
    artist: text(renderer.ownerText) || text(renderer.longBylineText) || 'YouTube',
    album: '',
    duration: parseDuration(renderer.lengthText),
    image: bestThumb(renderer),
    source: 'youtube'
  };
}

function uniqueTracks(items, limit = 50) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item?.videoId || seen.has(item.videoId)) continue;
    seen.add(item.videoId);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

function extractTracks(data, limit = 40) {
  const responsive = walk(data, 'musicResponsiveListItemRenderer').map(parseResponsive);
  const twoRow = walk(data, 'musicTwoRowItemRenderer').map(parseTwoRow);
  return uniqueTracks([...responsive, ...twoRow].filter(Boolean), limit);
}

function extractPanelTracks(data, limit = 50) {
  return uniqueTracks(walk(data, 'playlistPanelVideoRenderer').map(parsePanel).filter(Boolean), limit);
}

function extractPublicVideos(data, limit = 30) {
  return uniqueTracks(walk(data, 'videoRenderer').map(parseVideo).filter(Boolean), limit);
}

function findAutomix(data) {
  for (const item of walk(data, 'automixPlaylistVideoRenderer')) {
    const ep = item?.navigationEndpoint?.watchPlaylistEndpoint || item?.navigationEndpoint?.watchEndpoint;
    if (ep?.playlistId || ep?.videoId) return ep;
  }
  return null;
}

function responseVisitorData(data) {
  return data?.responseContext?.visitorData || null;
}

async function innerTube(endpoint, body = {}, clientKey = 'YTMUSIC', session = {}) {
  const client = CLIENTS[clientKey] || CLIENTS.YTMUSIC;
  const hl = String(session.hl || 'en').slice(0, 8);
  const gl = String(session.gl || 'US').slice(0, 3).toUpperCase();
  const clientBody = {
    clientName: client.name,
    clientVersion: client.version,
    ...(client.localeFields === false ? {} : { hl, gl }),
    ...(client.extra || {})
  };
  if (session.visitorData) clientBody.visitorData = String(session.visitorData).slice(0, 500);

  const requestBody = { context: { client: clientBody }, ...body };
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': API_KEY,
    'X-Goog-Api-Format-Version': '1',
    'X-YouTube-Client-Name': client.id,
    'X-YouTube-Client-Version': client.version,
    'Origin': client.origin,
    'Referer': client.referer,
    'User-Agent': client.userAgent,
    'Accept-Language': `${hl},en;q=0.8`
  };
  if (session.visitorData) headers['X-Goog-Visitor-Id'] = String(session.visitorData).slice(0, 500);

  const res = await fetch(`${client.base}/${endpoint}?key=${encodeURIComponent(API_KEY)}&prettyPrint=false`, {
    method: 'POST', headers, body: JSON.stringify(requestBody)
  });

  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { raw: raw.slice(0, 500) }; }
  if (!res.ok || data?.error) {
    const message = data?.error?.message || `InnerTube request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status || 502;
    err.details = data;
    throw err;
  }
  return data;
}

async function searchTracks(query, session) {
  const data = await innerTube('search', { query, params: SONG_FILTER }, 'YTMUSIC', session);
  let tracks = extractTracks(data, 30);
  let visitorData = responseVisitorData(data);
  if (!tracks.length) {
    const fallback = await innerTube('search', { query }, 'YTMUSIC', { ...session, visitorData: visitorData || session.visitorData });
    tracks = extractTracks(fallback, 30);
    visitorData = responseVisitorData(fallback) || visitorData;
  }
  return { tracks, visitorData };
}

async function homeTracks(session) {
  let visitorData = session.visitorData || null;
  for (const browseId of ['FEmusic_home', 'FEmusic_explore']) {
    try {
      const data = await innerTube('browse', { browseId }, 'YTMUSIC', { ...session, visitorData });
      visitorData = responseVisitorData(data) || visitorData;
      const tracks = extractTracks(data, 36);
      if (tracks.length >= 6) return { tracks, visitorData };
    } catch {}
  }
  const fallback = await searchTracks('Top songs', { ...session, visitorData });
  return { tracks: fallback.tracks, visitorData: fallback.visitorData || visitorData };
}

async function autoplayTracks(videoId, session) {
  let data = await innerTube('next', {
    videoId, enablePersistentPlaylistPanel: true, isAudioOnly: true
  }, 'YTMUSIC', session);

  let visitorData = responseVisitorData(data) || session.visitorData || null;
  let tracks = extractPanelTracks(data, 50).filter(t => t.videoId !== videoId);
  if (tracks.length < 4) {
    const auto = findAutomix(data);
    if (auto) {
      try {
        data = await innerTube('next', {
          videoId: auto.videoId || videoId,
          playlistId: auto.playlistId,
          params: auto.params,
          enablePersistentPlaylistPanel: true,
          isAudioOnly: true
        }, 'YTMUSIC', { ...session, visitorData });
        visitorData = responseVisitorData(data) || visitorData;
        tracks = uniqueTracks([...tracks, ...extractPanelTracks(data, 50)].filter(t => t.videoId !== videoId), 50);
      } catch {}
    }
  }
  return { tracks, visitorData };
}

export async function lookupTrackMetadata(videoId, session = {}) {
  const data = await innerTube('next', {
    videoId, enablePersistentPlaylistPanel: true, isAudioOnly: true
  }, 'YTMUSIC', session);
  const track = extractPanelTracks(data, 50).find(item => item.videoId === videoId);
  if (!track) throw new Error('Track metadata could not be resolved.');
  return {
    title: track.title,
    artist: track.artist,
    visitorData: responseVisitorData(data) || session.visitorData || null
  };
}

function chooseAudioFormat(data) {
  const formats = [
    ...(data?.streamingData?.adaptiveFormats || []),
    ...(data?.streamingData?.formats || [])
  ].filter(f => String(f?.mimeType || '').startsWith('audio/') && f?.url);

  formats.sort((a, b) => {
    const aMp4 = String(a.mimeType || '').includes('audio/mp4') ? 1 : 0;
    const bMp4 = String(b.mimeType || '').includes('audio/mp4') ? 1 : 0;
    if (aMp4 !== bMp4) return bMp4 - aMp4;
    return Number(b.averageBitrate || b.bitrate || 0) - Number(a.averageBitrate || a.bitrate || 0);
  });
  return formats[0] || null;
}

async function tryPlayer(videoId, clientKey, session) {
  const body = {
    videoId,
    racyCheckOk: true,
    contentCheckOk: true,
    playbackContext: { contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' } }
  };
  const data = await innerTube('player', body, clientKey, session);
  const format = chooseAudioFormat(data);
  const hls = data?.streamingData?.hlsManifestUrl || null;
  const meta = {
    expiresInSeconds: Number(data?.streamingData?.expiresInSeconds || 0) || 0,
    duration: Number(data?.videoDetails?.lengthSeconds || 0) || null,
    title: data?.videoDetails?.title || null,
    artist: data?.videoDetails?.author || null,
    image: bestThumb(data?.videoDetails?.thumbnail) || null,
    visitorData: responseVisitorData(data) || session.visitorData || null,
    client: clientKey
  };
  return { data, format, hls, meta };
}

function playerCandidates(result, preferHls = false) {
  const audio = result.format ? {
    streamUrl: result.format.url,
    streamType: 'audio',
    mimeType: result.format.mimeType || '',
    bitrate: Number(result.format.averageBitrate || result.format.bitrate || 0) || null,
    contentLength: result.format.contentLength ? Number(result.format.contentLength) : null,
    ...result.meta
  } : null;
  const hls = result.hls ? {
    streamUrl: result.hls,
    streamType: 'hls',
    mimeType: 'application/vnd.apple.mpegurl',
    bitrate: null,
    contentLength: null,
    ...result.meta
  } : null;
  return (preferHls ? [hls, audio] : [audio, hls]).filter(Boolean);
}

export async function resolvePlayer(videoId, session = {}, verifyCandidate = null) {
  const errors = [];
  const clients = [
    { key: 'ANDROID_VR', preferHls: false },
    { key: 'IOS', preferHls: false },
    { key: 'ANDROID', preferHls: false },
    { key: 'WEB_SAFARI', preferHls: true },
    { key: 'MWEB', preferHls: true }
  ];

  // A player response can contain a signed URL that is already unusable from the
  // current edge location. When supplied, verifyCandidate must actually open the
  // stream; a failed candidate then falls through to the next InnerTube client.
  for (const client of clients) {
    try {
      const result = await tryPlayer(videoId, client.key, session);
      const candidates = playerCandidates(result, client.preferHls);
      if (!candidates.length) {
        errors.push(`${client.key}: ${result.data?.playabilityStatus?.status || 'no playable stream'}`);
        continue;
      }

      for (const candidate of candidates) {
        try {
          if (verifyCandidate) await verifyCandidate(candidate);
          return candidate;
        } catch (err) {
          errors.push(`${client.key}/${candidate.streamType}: ${err.message}`);
        }
      }
    } catch (err) {
      errors.push(`${client.key}: ${err.message}`);
    }
  }

  const err = new Error('No playable stream was returned for this track.');
  err.status = 502;
  err.details = errors;
  throw err;
}

const normalizedSearchText = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export function rankPublicFallbacks(tracks, title, artist, rejectedId = '') {
  const wantedTitle = normalizedSearchText(title);
  const wantedArtist = normalizedSearchText(artist);
  const unwantedVersions = /\b(live|karaoke|cover|remix|mashup|instrumental|slowed|sped up|reaction)\b/;

  return tracks
    .filter(track => track?.videoId && track.videoId !== rejectedId)
    .map((track, index) => {
      const trackTitle = normalizedSearchText(track.title);
      const trackArtist = normalizedSearchText(track.artist);
      let score = -index / 100;
      if (trackTitle === wantedTitle) score += 120;
      else if (trackTitle.includes(wantedTitle) || wantedTitle.includes(trackTitle)) score += 55;
      if (wantedArtist && trackArtist === wantedArtist) score += 60;
      else if (wantedArtist && (trackArtist.includes(wantedArtist) || wantedArtist.includes(trackArtist))) score += 35;
      if (/\bofficial\b/.test(trackTitle)) score += 8;
      if (!unwantedVersions.test(wantedTitle) && unwantedVersions.test(trackTitle)) score -= 35;
      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.track);
}

async function publicFallbackTracks({ title, artist, rejectedId }, session = {}) {
  const query = `${String(title || '').trim()} ${String(artist || '').trim()}`.trim().slice(0, 240);
  if (!query) throw new Error('Missing metadata for public playback fallback.');

  const data = await innerTube('search', { query }, 'WEB_SAFARI', session);
  const visitorData = responseVisitorData(data) || session.visitorData || null;
  const tracks = rankPublicFallbacks(extractPublicVideos(data, 30), title, artist, rejectedId).slice(0, 6);
  return { tracks, visitorData };
}

export async function findPublicVideo({ title, artist, rejectedId }, session = {}) {
  const { tracks, visitorData } = await publicFallbackTracks({ title, artist, rejectedId }, session);
  const track = tracks[0];
  if (!track) throw new Error('No public YouTube video was found for this track.');
  return { ...track, visitorData };
}

export async function resolvePublicFallback({ title, artist, rejectedId }, session = {}, verifyCandidate = null) {
  const { tracks, visitorData } = await publicFallbackTracks({ title, artist, rejectedId }, session);
  const errors = [];

  for (const track of tracks) {
    try {
      const resolved = await resolvePlayer(track.videoId, { ...session, visitorData }, verifyCandidate);
      return { ...resolved, fallbackVideoId: track.videoId, fallbackTitle: track.title };
    } catch (err) {
      const details = Array.isArray(err.details) && err.details.length ? err.details.join(' | ') : err.message;
      errors.push(`${track.videoId}: ${details}`);
    }
  }

  const err = new Error('No public playback fallback was available for this track.');
  err.status = 502;
  err.details = errors;
  throw err;
}

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  }
});

export default async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
  });
  if (request.method !== 'POST') return json(405, { error: 'POST only' });

  try {
    const body = await request.json();
    const action = body.action;
    const session = {
      hl: body.locale?.hl,
      gl: body.locale?.gl,
      visitorData: body.visitorData || null
    };

    if (action === 'search') {
      const query = String(body.query || '').trim();
      if (!query) return json(400, { error: 'Missing query' });
      return json(200, await searchTracks(query, session));
    }
    if (action === 'home') return json(200, await homeTracks(session));
    if (action === 'next') {
      const videoId = String(body.videoId || '').trim();
      if (!videoId) return json(400, { error: 'Missing videoId' });
      return json(200, await autoplayTracks(videoId, session));
    }
    if (action === 'player') {
      const videoId = String(body.videoId || '').trim();
      if (!videoId) return json(400, { error: 'Missing videoId' });
      return json(200, await resolvePlayer(videoId, session));
    }
    if (action === 'public') {
      const title = String(body.title || '').trim();
      if (!title) return json(400, { error: 'Missing title' });
      return json(200, await findPublicVideo({
        title,
        artist: String(body.artist || '').trim(),
        rejectedId: String(body.rejectedId || '').trim()
      }, session));
    }
    return json(400, { error: 'Unknown action' });
  } catch (err) {
    return json(Number(err.status || 500), {
      error: err.message || 'InnerTube request failed',
      details: err.details || undefined
    });
  }
};
