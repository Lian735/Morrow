import test from 'node:test';
import assert from 'node:assert/strict';

import { proxyUpstream } from '../netlify/edge-functions/audio.mjs';
import { resolvePlayer } from '../netlify/functions/innertube.mjs';

const realFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = realFetch;
});

test('rejects a successful HTML response instead of sending it to the audio element', async () => {
  globalThis.fetch = async () => new Response('<html>blocked</html>', {
    status: 206,
    headers: { 'content-type': 'text/html', 'content-range': 'bytes 0-19/20' }
  });

  const request = new Request('https://morrow.test/api/audio?v=track', {
    headers: { range: 'bytes=0-1023' }
  });
  await assert.rejects(
    proxyUpstream(request, { streamUrl: 'https://r1.googlevideo.com/audio?c=ANDROID_VR', streamType: 'audio', client: 'ANDROID_VR' }),
    /Invalid audio response/
  );
});

test('preserves range playback headers and the signing client user agent', async () => {
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url, options };
    return new Response(new Uint8Array([0, 1, 2, 3]), {
      status: 206,
      headers: {
        'content-type': 'audio/mp4',
        'content-length': '4',
        'content-range': 'bytes 0-3/100',
        'accept-ranges': 'bytes'
      }
    });
  };

  const request = new Request('https://morrow.test/api/audio?v=track', {
    headers: { range: 'bytes=0-3' }
  });
  const response = await proxyUpstream(request, {
    streamUrl: 'https://r1.googlevideo.com/audio?c=IOS',
    streamType: 'audio',
    client: 'IOS'
  });

  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-type'), 'audio/mp4');
  assert.equal(response.headers.get('content-range'), 'bytes 0-3/100');
  assert.equal(upstreamRequest.options.headers.get('range'), 'bytes=0-3');
  assert.match(upstreamRequest.options.headers.get('user-agent'), /google\.ios\.youtube/);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0, 1, 2, 3]);
});

test('rewrites HLS variants, segments and URI attributes through the same-origin proxy', async () => {
  const playlist = [
    '#EXTM3U',
    '#EXT-X-MAP:URI="init.mp4"',
    '#EXTINF:4,',
    'segment.m4s',
    '#EXT-X-KEY:METHOD=AES-128,URI="https://manifest.googlevideo.com/key"'
  ].join('\n');
  globalThis.fetch = async () => new Response(playlist, {
    headers: { 'content-type': 'application/x-mpegURL' }
  });

  const response = await proxyUpstream(
    new Request('https://morrow.test/api/audio?v=track'),
    { streamUrl: 'https://manifest.googlevideo.com/api/manifest/hls_playlist/track.m3u8', streamType: 'hls', client: 'WEB_SAFARI' }
  );
  const body = await response.text();

  assert.equal(response.headers.get('content-type'), 'application/vnd.apple.mpegurl');
  assert.doesNotMatch(body, /(^|\n)segment\.m4s($|\n)/);
  assert.doesNotMatch(body, /URI="init\.mp4"/);
  assert.match(body, /\/api\/audio\?u=/);
});

test('falls back to the next InnerTube client when a signed stream is unusable', async () => {
  let playerCalls = 0;
  globalThis.fetch = async () => {
    playerCalls += 1;
    const client = playerCalls === 1 ? 'ANDROID_VR' : 'IOS';
    return new Response(JSON.stringify({
      streamingData: {
        adaptiveFormats: [{
          url: `https://${client.toLowerCase()}.googlevideo.com/audio?c=${client}`,
          mimeType: 'audio/mp4',
          bitrate: 128000,
          contentLength: '1000'
        }]
      },
      playabilityStatus: { status: 'OK' },
      videoDetails: { title: 'Song', author: 'Artist', lengthSeconds: '180' }
    }), { headers: { 'content-type': 'application/json' } });
  };

  const checked = [];
  const result = await resolvePlayer('abcdefghijk', { hl: 'en', gl: 'US' }, async candidate => {
    checked.push(candidate.client);
    if (candidate.client === 'ANDROID_VR') throw new Error('upstream rejected URL');
  });

  assert.deepEqual(checked, ['ANDROID_VR', 'IOS']);
  assert.equal(result.client, 'IOS');
  assert.equal(playerCalls, 2);
});
