import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, app] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8')
]);

test('normal app shell exposes one MiniPlayer and keeps full screen Now Playing closed', () => {
  assert.equal((html.match(/class="mini-player"/g) || []).length, 1);
  assert.equal((html.match(/<audio /g) || []).length, 1);
  assert.match(html, /id="nowPlaying" class="now-playing" aria-hidden="true"/);
  assert.match(css, /\.now-playing \{[^}]*visibility: hidden/s);
  assert.match(css, /\.now-playing\.is-open \{[^}]*visibility: visible/s);
});

test('song action menu is contextual and closed by default', () => {
  assert.match(html, /id="contextMenu" class="context-menu-layer" aria-hidden="true"/);
  assert.match(css, /\.context-menu-layer \{[^}]*visibility: hidden/s);
  assert.match(app, /function openContextMenu\(/);
  assert.match(app, /data-context-action="hide"/);
  assert.match(app, /data-context-action="taste-more"/);
  assert.match(app, /data-context-action="add-playlist"/);
  assert.match(app, /data-context-action="add-queue"/);
});

test('hidden YouTube surface is the primary playback lifecycle', () => {
  assert.match(app, /const audio = \$\('#audio'\)/);
  assert.match(app, /new YT\.Player\('youtubePlayerHost'/);
  assert.match(app, /player\.loadVideoById/);
  assert.match(app, /navigator\.mediaSession\.setActionHandler/);
  assert.match(app, /document\.addEventListener\('visibilitychange'/);
  assert.match(css, /left:\s*-10000px/);
  assert.doesNotMatch(css, /#youtubePlayerHost\s*\{[^}]*display:\s*none/s);
});

test('visual tokens stay neutral instead of using a fixed accent color', () => {
  assert.doesNotMatch(css, /--accent:/);
  assert.match(css, /--white: #f7f7f5/);
  assert.match(css, /--bg: #0b0b0c/);
});
