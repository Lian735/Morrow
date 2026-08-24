import { resolvePlayer } from '../functions/innertube.mjs';

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

async function proxyUpstream(request, upstreamUrl) {
  if (!allowedUpstream(upstreamUrl)) return new Response('Blocked upstream', { status: 403 });
  const headers = new Headers();
  const range = request.headers.get('range');
  if (range) headers.set('range', range);
  headers.set('accept', '*/*');
  headers.set('origin', 'https://www.youtube.com');
  headers.set('referer', 'https://www.youtube.com/');
  const signedClient = new URL(upstreamUrl).searchParams.get('c');
  if (signedClient === 'ANDROID_VR') headers.set('user-agent', 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip');
  else if (signedClient === 'IOS') headers.set('user-agent', 'com.google.ios.youtube/20.11.6 (iPhone10,4; U; CPU iOS 16_7_7 like Mac OS X)');
  else headers.set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15');

  const upstream = await fetch(upstreamUrl, { headers, redirect: 'follow' });
  const type = upstream.headers.get('content-type') || '';
  const resolvedUpstreamUrl = upstream.url || upstreamUrl;
  const isHls = type.includes('mpegurl') || new URL(resolvedUpstreamUrl).pathname.endsWith('.m3u8');

  if (isHls) {
    const source = await upstream.text();
    const base = resolvedUpstreamUrl;
    const rewritten = source.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      let absolute;
      try { absolute = new URL(trimmed, base).href; } catch { return line; }
      if (!allowedUpstream(absolute)) return line;
      return `/api/audio?u=${encodeURIComponent(b64url(absolute))}`;
    }).join('\n');
    return new Response(rewritten, {
      status: upstream.status,
      headers: {
        'content-type': 'application/vnd.apple.mpegurl',
        'cache-control': 'private, max-age=30',
        'access-control-allow-origin': '*'
      }
    });
  }

  const out = new Headers();
  for (const name of ['content-type','content-length','content-range','accept-ranges','etag','last-modified']) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  out.set('cache-control', 'private, max-age=60');
  out.set('access-control-allow-origin', '*');
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Range', 'access-control-allow-methods': 'GET,HEAD,OPTIONS' } });
  }
  if (!['GET','HEAD'].includes(request.method)) return new Response('GET only', { status: 405 });

  try {
    const url = new URL(request.url);
    const encoded = url.searchParams.get('u');
    if (encoded) return await proxyUpstream(request, unb64url(encoded));

    const videoId = (url.searchParams.get('v') || '').trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return new Response('Invalid video id', { status: 400 });
    const session = {
      hl: (url.searchParams.get('hl') || 'en').slice(0, 8),
      gl: (url.searchParams.get('gl') || 'US').slice(0, 3),
      visitorData: url.searchParams.get('visitorData') || null
    };
    const info = await resolvePlayer(videoId, session);
    return await proxyUpstream(request, info.streamUrl);
  } catch (error) {
    return new Response(error?.message || 'Audio stream failed', { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  }
};
