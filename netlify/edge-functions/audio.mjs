import { resolvePlayer, resolvePublicFallback } from '../functions/innertube.mjs';

const CLIENT_USER_AGENTS = {
  ANDROID_VR: 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
  IOS: 'com.google.ios.youtube/20.11.6 (iPhone10,4; U; CPU iOS 16_7_7 like Mac OS X)',
  ANDROID: 'com.google.android.youtube/21.03.36 (Linux; U; Android 16; en_US; SM-S908E Build/TP1A.220624.014) gzip',
  WEB_SAFARI: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15',
  MWEB: 'Mozilla/5.0 (iPad; CPU OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
};

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Range',
  'access-control-allow-methods': 'GET,HEAD,OPTIONS',
  'access-control-expose-headers': 'Accept-Ranges,Content-Length,Content-Range,Content-Type'
};

const allowedUpstream = (url) => {
  try {
    const host = new URL(url).hostname;
    return host === 'manifest.googlevideo.com' || host.endsWith('.googlevideo.com');
  } catch { return false; }
};

const b64url = (value) => {
  const bytes = new TextEncoder().encode(value);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const unb64url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const proxiedUrl = (upstreamUrl) => `/api/audio?u=${encodeURIComponent(b64url(upstreamUrl))}`;

function rewriteHls(source, base) {
  return source.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (!trimmed.startsWith('#')) {
      try {
        const absolute = new URL(trimmed, base).href;
        return allowedUpstream(absolute) ? proxiedUrl(absolute) : line;
      } catch { return line; }
    }
    return line.replace(/URI="([^"]+)"/g, (match, uri) => {
      try {
        const absolute = new URL(uri, base).href;
        return allowedUpstream(absolute) ? `URI="${proxiedUrl(absolute)}"` : match;
      } catch { return match; }
    });
  }).join('\n');
}

function clientFromUrl(upstreamUrl) {
  const signedClient = new URL(upstreamUrl).searchParams.get('c');
  return signedClient === 'ANDROID_VR' || signedClient === 'IOS' || signedClient === 'ANDROID'
    || signedClient === 'WEB_SAFARI' || signedClient === 'MWEB' ? signedClient : null;
}

export async function proxyUpstream(request, info) {
  const upstreamUrl = typeof info === 'string' ? info : info.streamUrl;
  if (!allowedUpstream(upstreamUrl)) throw new Error('Blocked audio upstream');
  const headers = new Headers();
  const range = request.headers.get('range');
  if (range) headers.set('range', range);
  headers.set('accept', '*/*');
  headers.set('origin', 'https://www.youtube.com');
  headers.set('referer', 'https://www.youtube.com/');
  const client = typeof info === 'object' && info.client ? info.client : clientFromUrl(upstreamUrl);
  headers.set('user-agent', CLIENT_USER_AGENTS[client] || CLIENT_USER_AGENTS.WEB_SAFARI);

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    redirect: 'follow'
  });
  if (!upstream.ok) {
    upstream.body?.cancel().catch(() => {});
    throw new Error(`Audio upstream returned ${upstream.status}`);
  }
  const type = (upstream.headers.get('content-type') || '').toLowerCase();
  const baseType = type.split(';')[0].trim();
  const resolvedUpstreamUrl = upstream.url || upstreamUrl;
  const isHls = (typeof info === 'object' && info.streamType === 'hls')
    || type.includes('mpegurl') || new URL(resolvedUpstreamUrl).pathname.endsWith('.m3u8');

  if (isHls) {
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: upstream.status,
        headers: { ...CORS_HEADERS, 'content-type': 'application/vnd.apple.mpegurl', 'cache-control': 'private, max-age=30' }
      });
    }
    const source = await upstream.text();
    if (!source.trimStart().startsWith('#EXTM3U')) throw new Error(`Invalid HLS response (${baseType || 'unknown type'})`);
    return new Response(rewriteHls(source, resolvedUpstreamUrl), {
      status: upstream.status,
      headers: {
        ...CORS_HEADERS,
        'content-type': 'application/vnd.apple.mpegurl',
        'cache-control': 'private, max-age=30'
      }
    });
  }

  const playableType = baseType.startsWith('audio/') || baseType === 'video/mp4'
    || baseType === 'video/mp2t' || baseType === 'application/octet-stream';
  if (!playableType) {
    upstream.body?.cancel().catch(() => {});
    throw new Error(`Invalid audio response (${baseType || 'unknown type'})`);
  }

  const out = new Headers();
  for (const name of ['content-type','content-length','content-range','accept-ranges','etag','last-modified']) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  for (const [name, value] of Object.entries(CORS_HEADERS)) out.set(name, value);
  out.set('cache-control', 'private, max-age=60');
  out.set('x-content-type-options', 'nosniff');
  return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers: out });
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (!['GET','HEAD'].includes(request.method)) return new Response('GET only', { status: 405 });

  try {
    const url = new URL(request.url);
    const encoded = url.searchParams.get('u');
    if (encoded) return await proxyUpstream(request, { streamUrl: unb64url(encoded), streamType: 'auto' });

    const videoId = (url.searchParams.get('v') || '').trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return new Response('Invalid video id', { status: 400 });
    const session = {
      hl: (url.searchParams.get('hl') || 'en').slice(0, 8),
      gl: (url.searchParams.get('gl') || 'US').slice(0, 3),
      visitorData: url.searchParams.get('visitorData') || null
    };
    const verifyCandidate = async (candidate) => {
      verifiedResponse = await proxyUpstream(request, candidate);
    };
    let verifiedResponse = null;
    try {
      await resolvePlayer(videoId, session, verifyCandidate);
    } catch (primaryError) {
      const title = (url.searchParams.get('title') || '').trim().slice(0, 160);
      const artist = (url.searchParams.get('artist') || '').trim().slice(0, 120);
      if (!title) throw primaryError;
      await resolvePublicFallback({ title, artist, rejectedId: videoId }, session, verifyCandidate);
    }
    return verifiedResponse;
  } catch (error) {
    console.error('Morrow audio error:', error?.message || error);
    return new Response('Audio stream failed', {
      status: 502,
      headers: { ...CORS_HEADERS, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
    });
  }
};
