const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const icons = {
  home: '<svg viewBox="0 0 24 24"><path d="M3.5 10.5 12 3l8.5 7.5v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M9 20.5v-6h6v6"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24"><path d="m12 3 1.1 3.2a6.2 6.2 0 0 0 3.7 3.7L20 11l-3.2 1.1a6.2 6.2 0 0 0-3.7 3.7L12 19l-1.1-3.2a6.2 6.2 0 0 0-3.7-3.7L4 11l3.2-1.1a6.2 6.2 0 0 0 3.7-3.7z"/><path d="m19 3 .4 1.2A2.7 2.7 0 0 0 21 5.8l1 .4-1 .4a2.7 2.7 0 0 0-1.6 1.6L19 9.4l-.4-1.2A2.7 2.7 0 0 0 17 6.6l-1-.4 1-.4a2.7 2.7 0 0 0 1.6-1.6z"/></svg>',
  library: '<svg viewBox="0 0 24 24"><path d="M5 4.5h3v15H5zM11 4.5h3v15h-3zM17 6l2.8-.8 3.7 13.5-2.8.8z"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  queue: '<svg viewBox="0 0 24 24"><path d="M5 7h10M5 12h10M5 17h7"/><path d="m17 15 4 2.5-4 2.5z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m8.6 5.8 10.2 6.2-10.2 6.2z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M7 5.5h3.6v13H7zM13.4 5.5H17v13h-3.6z"/></svg>',
  previous: '<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M6 5h2v14H6zM18 5.8 8.3 12 18 18.2z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M16 5h2v14h-2zM6 5.8 15.7 12 6 18.2z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24"><path d="M4 7h2.5c4.5 0 6.5 10 11 10H20"/><path d="m17 14 3 3-3 3M4 17h2.5c1.3 0 2.4-.8 3.4-2M14.2 8.7C15.2 7.7 16.3 7 17.5 7H20"/><path d="m17 4 3 3-3 3"/></svg>',
  infinity: '<svg viewBox="0 0 24 24"><path d="M8.3 8.2c-2.3 0-4.2 1.7-4.2 3.8s1.9 3.8 4.2 3.8c3.2 0 4.5-7.6 7.4-7.6 2.3 0 4.2 1.7 4.2 3.8s-1.9 3.8-4.2 3.8c-3.2 0-4.5-7.6-7.4-7.6z"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M20.6 5.8a5 5 0 0 0-7.1 0L12 7.3l-1.5-1.5a5 5 0 1 0-7.1 7.1L12 21l8.6-8.1a5 5 0 0 0 0-7.1z"/></svg>',
  heartFill: '<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M20.6 5.8a5 5 0 0 0-7.1 0L12 7.3l-1.5-1.5a5 5 0 1 0-7.1 7.1L12 21l8.6-8.1a5 5 0 0 0 0-7.1z"/></svg>',
  volume: '<svg viewBox="0 0 24 24"><path d="M5 10v4h3l4 3.5v-11L8 10zM16 9a4 4 0 0 1 0 6M18.5 6.7a7 7 0 0 1 0 10.6"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M19.5 15.5A8 8 0 0 1 8.5 4.5a8 8 0 1 0 11 11z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
};

$$('[data-icon]').forEach(el => { const key = el.dataset.icon.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()); el.innerHTML = icons[key] || ''; });

const catalog = new Map();
const savedTracks = JSON.parse(localStorage.getItem('morrow.savedTracks') || '{}');
Object.values(savedTracks).forEach(t => { if (t?.id) catalog.set(t.id, {...t, source:'youtube'}); });

const state = {
  view: 'home',
  currentId: null,
  queue: [],
  queueIndex: -1,
  history: [],
  likes: new Set(JSON.parse(localStorage.getItem('morrow.likes') || '[]')),
  autoplay: JSON.parse(localStorage.getItem('morrow.autoplay') ?? 'true'),
  shuffle: false,
  query: '',
  isPlaying: false,
  playedCount: JSON.parse(localStorage.getItem('morrow.playedCount') || '{}'),
  homeIds: [],
  searchIds: [],
  searchStatus: 'idle',
  sourceStatus: 'connecting',
  visitorData: sessionStorage.getItem('morrow.visitorData') || '',
  radioLoadingFor: null,
};

const audio = $('#audio');
audio.volume = Number(localStorage.getItem('morrow.volume') || 0.78);
$('#volume').value = audio.volume;

const view = $('#view');
const search = $('#globalSearch');
const queueDrawer = $('#queueDrawer');
const nowPlayingSheet = $('#nowPlayingSheet');
const settingsModal = $('#settingsModal');
const toast = $('#toast');
let toastTimer;
let searchTimer;
let searchSerial = 0;
let streamRetryId = null;

function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function getTrack(id) { return catalog.get(id) || null; }
function currentTrack() { return getTrack(state.currentId); }
function allKnownTracks() { return [...catalog.values()]; }
function fmt(sec) { if (!Number.isFinite(sec)) return '0:00'; sec = Math.max(0, Math.floor(sec)); return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`; }
function esc(s) { return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function artValue(t) {
  if (t?.image) return `url('${String(t.image).replace(/'/g, '%27')}') center / cover no-repeat`;
  return t?.art || 'linear-gradient(145deg,#3f3f48,#17171d)';
}
function artStyle(t) { return `--art:${artValue(t)}`; }
function trackDetail(t) { return t?.album || t?.mood || (t?.source === 'youtube' ? 'YouTube Music' : 'Morrow'); }
function locale() {
  const raw = navigator.language || 'en-US';
  const [hl, region] = raw.split('-');
  return { hl: hl || 'en', gl: region || 'US' };
}
function updateVisitorData(value) {
  if (!value) return;
  state.visitorData = value;
  sessionStorage.setItem('morrow.visitorData', value);
}
function setSourceStatus(status) {
  state.sourceStatus = status;
  const el = $('#sourceStatus');
  if (!el) return;
  const labels = { connecting:'Connecting', online:'InnerTube', offline:'Unavailable' };
  el.textContent = labels[status] || status;
  el.classList.toggle('muted', status !== 'online');
}

function upsertTracks(items = []) {
  const ids = [];
  for (const raw of items) {
    if (!raw?.id || !raw?.title) continue;
    const existing = catalog.get(raw.id) || {};
    const t = {
      ...existing,
      ...raw,
      id: raw.id,
      videoId: raw.videoId || raw.id,
      source: raw.source || 'youtube',
      artist: raw.artist || existing.artist || 'YouTube Music',
      album: raw.album || existing.album || '',
      image: raw.image || existing.image || null,
    };
    catalog.set(t.id, t);
    ids.push(t.id);
  }
  return ids;
}

function persist() {
  localStorage.setItem('morrow.likes', JSON.stringify([...state.likes]));
  localStorage.setItem('morrow.autoplay', JSON.stringify(state.autoplay));
  localStorage.setItem('morrow.playedCount', JSON.stringify(state.playedCount));
  const saved = {};
  for (const id of state.likes) {
    const t = getTrack(id);
    if (t?.source === 'youtube') {
      saved[id] = { id:t.id, videoId:t.videoId, title:t.title, artist:t.artist, album:t.album || '', duration:t.duration || null, image:t.image || null, source:'youtube' };
    }
  }
  localStorage.setItem('morrow.savedTracks', JSON.stringify(saved));
}

async function api(action, payload = {}) {
  const res = await fetch('/api/innertube', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ action, ...payload, locale: locale(), visitorData: state.visitorData || undefined })
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || `InnerTube ${res.status}`);
  updateVisitorData(data.visitorData);
  setSourceStatus('online');
  return data;
}

function audioUrl(t) {
  const {hl, gl} = locale();
  const params = new URLSearchParams({ v:t.videoId || t.id, hl, gl });
  if (state.visitorData) params.set('visitorData', state.visitorData);
  return `/api/audio?${params}`;
}

function card(t) {
  return `<button class="music-card" data-play="${esc(t.id)}">
    <div class="art card-art" style="${artStyle(t)}"><span class="card-play">${icons.play}</span></div>
    <strong>${esc(t.title)}</strong><span>${esc(t.artist)}</span>
  </button>`;
}
function quick(t) {
  return `<button class="quick-track" data-play="${esc(t.id)}">
    <div class="art" style="${artStyle(t)}"></div>
    <div class="quick-copy"><strong>${esc(t.title)}</strong><span>${esc(t.artist)} · ${esc(trackDetail(t))}</span></div>
    <span class="quick-action">${icons.play}</span>
  </button>`;
}
function row(t) {
  const liked = state.likes.has(t.id);
  const right = t.duration ? fmt(t.duration) : (t.bpm ? `${t.bpm} BPM` : '');
  return `<div class="list-row">
    <button class="list-main" data-play="${esc(t.id)}" style="background:transparent;text-align:left;border:0;color:inherit;">
      <div class="art" style="${artStyle(t)}"></div>
      <div class="list-copy"><strong>${esc(t.title)}</strong><span>${esc(t.artist)}</span></div>
    </button>
    <span class="list-meta">${esc(trackDetail(t))}</span>
    <span class="list-meta list-duration">${esc(right)}</span>
    <button class="list-action" data-like="${esc(t.id)}" aria-label="${liked?'Unlike':'Like'} ${esc(t.title)}"><span class="icon">${liked?icons.heartFill:icons.heart}</span></button>
  </div>`;
}

function homeTracks() {
  const remote = state.homeIds.map(getTrack).filter(Boolean);
  return remote;
}

function renderHome() {
  const source = homeTracks();
  const hero = source[0];
  const quicks = source.slice(0, 6);
  const repeats = source.slice(6, 10).length >= 3 ? source.slice(6, 10) : source.slice(0, 4);
  const recent = source.slice(2, 8);
  view.innerHTML = `
    <div class="hero">
      <div class="hero-content">
        <div class="eyebrow">MORROW RADIO</div>
        <h1>Keep listening.</h1>
        <p>Search YouTube Music, start one track and Morrow builds a continuous radio around it.</p>
        <div class="hero-actions">
          ${hero ? `<button class="primary-btn" data-play="${esc(hero.id)}">${icons.play}<span>Play radio</span></button>` : ''}
          <button class="secondary-btn" data-open-queue>${icons.queue}<span>View queue</span></button>
        </div>
      </div>
    </div>

    <section class="section">
      <div class="section-head"><div><h2>Made for now</h2><p>${state.sourceStatus === 'online' ? 'Fresh from YouTube Music.' : 'Search YouTube Music to begin.'}</p></div><button class="text-btn" data-view="discover">Explore more</button></div>
      <div class="quick-grid">${quicks.map(quick).join('')}</div>
    </section>

    <section class="section">
      <div class="section-head"><div><h2>On repeat</h2><p>Start anywhere — autoplay handles the rest.</p></div></div>
      <div class="card-grid">${repeats.map(card).join('')}</div>
    </section>

    <section class="section">
      <div class="section-head"><div><h2>More to play</h2><p>Your current Morrow feed.</p></div></div>
      <div class="list">${recent.map(row).join('')}</div>
    </section>`;
}

function renderDiscover() {
  const source = recommendations(8);
  view.innerHTML = `
    <div class="discover-hero">
      <div class="feature-panel">
        <div class="eyebrow">DISCOVER</div>
        <h1>Something that fits.</h1>
        <p>Pick a direction and Morrow searches YouTube Music, then keeps the radio going.</p>
        <div class="hero-actions"><button class="primary-btn" data-mood="discover mix">${icons.play}<span>Start discovery</span></button></div>
      </div>
      <div class="mood-panel">
        ${['late night','focus','drive','morning'].map(m => `<button class="mood" data-mood="${m}"><span>MOOD</span><strong>${m.replace(/\b\w/g,c=>c.toUpperCase())}</strong></button>`).join('')}
      </div>
    </div>
    <section class="section">
      <div class="section-head"><div><h2>For you</h2><p>From your current feed and listening history.</p></div></div>
      <div class="card-grid">${source.map(card).join('')}</div>
    </section>
    <section class="section">
      <div class="section-head"><div><h2>Everything here</h2><p>${allKnownTracks().length} tracks currently loaded.</p></div></div>
      <div class="list">${homeTracks().slice(0, 14).map(row).join('')}</div>
    </section>`;
}

function renderLibrary() {
  const liked = [...state.likes].map(getTrack).filter(Boolean);
  const rotation = allKnownTracks().filter(t => state.playedCount[t.id]).sort((a,b)=>(state.playedCount[b.id]||0)-(state.playedCount[a.id]||0)).slice(0,4);
  view.innerHTML = `
    <section style="padding-top:10px">
      <div class="eyebrow">YOUR MUSIC</div>
      <h1 style="font-size:42px;letter-spacing:-.05em;margin:0 0 8px">Library</h1>
      <p style="color:var(--muted);margin:0;max-width:520px;line-height:1.5">Likes and listening history stay on this device.</p>
    </section>
    <section class="section">
      <div class="section-head"><div><h2>Liked tracks</h2><p>${liked.length} saved</p></div></div>
      ${liked.length ? `<div class="list">${liked.map(row).join('')}</div>` : `<div class="empty-state"><strong>No liked tracks yet.</strong>Tap the heart on anything you want to keep.</div>`}
    </section>
    <section class="section">
      <div class="section-head"><div><h2>Your rotation</h2><p>Based on local play count.</p></div></div>
      ${rotation.length ? `<div class="card-grid">${rotation.map(card).join('')}</div>` : `<div class="empty-state"><strong>Nothing here yet.</strong>Play a few tracks and Morrow will fill this in.</div>`}
    </section>`;
}

function renderSearch() {
  const q = state.query.trim();
  const hits = state.searchIds.map(getTrack).filter(Boolean);
  const heading = state.searchStatus === 'loading' ? 'Searching…' : hits.length ? `${hits.length} result${hits.length===1?'':'s'}` : 'No results';
  let body;
  if (state.searchStatus === 'loading' && !hits.length) body = `<div class="empty-state"><strong>Searching YouTube Music…</strong>Morrow is loading songs for “${esc(q)}”.</div>`;
  else if (hits.length) body = `<div class="list">${hits.map(row).join('')}</div>`;
  else if (state.searchStatus === 'error') body = `<div class="empty-state"><strong>InnerTube isn’t reachable.</strong>Check the Netlify functions and try again.</div>`;
  else body = `<div class="empty-state"><strong>Nothing matched.</strong>Try another title or artist.</div>`;

  view.innerHTML = `
    <section style="padding-top:10px">
      <div class="eyebrow">YOUTUBE MUSIC</div>
      <h1 style="font-size:38px;letter-spacing:-.05em;margin:0">${heading}</h1>
      <p style="color:var(--muted);margin:8px 0 0">for “${esc(q)}”</p>
    </section>
    <section class="section">${body}</section>`;
}

function render() {
  if (state.query.trim()) renderSearch();
  else if (state.view === 'discover') renderDiscover();
  else if (state.view === 'library') renderLibrary();
  else renderHome();
  syncNav();
}

function syncNav() {
  $$('[data-view]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.view === state.view && !state.query));
}

function recommendations(limit = 8, seed = currentTrack()) {
  const pool = homeTracks().length ? homeTracks() : allKnownTracks();
  const scored = pool.map(t => {
    let score = Math.random() * .45;
    score -= (state.playedCount[t.id] || 0) * .08;
    if (state.likes.has(t.id)) score += .28;
    if (t.id === state.currentId) score -= 10;
    return {t,score};
  });
  return scored.sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.t);
}

async function hydrateRadio(seedId) {
  const seed = getTrack(seedId);
  if (!seed || seed.source !== 'youtube' || state.radioLoadingFor === seedId) return;
  state.radioLoadingFor = seedId;
  renderQueue();
  try {
    const data = await api('next', { videoId: seed.videoId || seed.id });
    const ids = upsertTracks(data.tracks || []).filter(id => id !== seedId);
    const existing = new Set(state.queue);
    for (const id of ids) if (!existing.has(id)) { state.queue.push(id); existing.add(id); }
  } catch (err) {
    setSourceStatus('offline');
    console.warn('Autoplay queue failed:', err);
  } finally {
    if (state.radioLoadingFor === seedId) state.radioLoadingFor = null;
    renderQueue();
  }
}

async function playTrack(id, {keepQueue=false} = {}) {
  const t = getTrack(id);
  if (!t) return;

  if (!keepQueue || !state.queue.includes(id)) {
    if (t.source === 'youtube') {
      state.queue = [id];
      state.queueIndex = 0;
    }
  } else state.queueIndex = state.queue.indexOf(id);

  if (state.currentId !== id || !audio.src) {
    state.currentId = id;
    streamRetryId = null;
    audio.src = audioUrl(t);
    audio.load();
    state.playedCount[id] = (state.playedCount[id] || 0) + 1;
    state.history.unshift(id);
    state.history = state.history.slice(0,20);
    persist();
    updateMediaSession(t);
    syncPlayerMeta();
  }

  // This call happens immediately after a tap. That matters on iPhone/iPad.
  try {
    await audio.play();
    state.isPlaying = true;
  } catch (err) {
    state.isPlaying = false;
    if (t.source === 'youtube') showToast('Stream wird geladen…');
  }
  syncPlaybackUI();
  renderQueue();

  if (t.source === 'youtube' && state.autoplay) hydrateRadio(id);
}

function togglePlay() {
  if (!state.currentId) return showToast('Search for a song to start playback.');
  if (audio.paused) audio.play().then(()=>{state.isPlaying=true;syncPlaybackUI();}).catch(()=>showToast('Could not start playback.'));
  else { audio.pause(); state.isPlaying=false; syncPlaybackUI(); }
}

async function nextTrack(manual = true) {
  if (state.shuffle) {
    const next = recommendations(1)[0];
    if (next) return playTrack(next.id);
  }

  let nextId = state.queue[state.queueIndex + 1];
  if (nextId) return playTrack(nextId, {keepQueue:true});

  const current = currentTrack();
  if (state.autoplay && current?.source === 'youtube') {
    await hydrateRadio(current.id);
    nextId = state.queue[state.queueIndex + 1];
    if (nextId) return playTrack(nextId, {keepQueue:true});
  }

  if (state.autoplay) {
    const next = recommendations(1)[0];
    if (next) {
      state.queue.push(next.id);
      state.queueIndex = state.queue.length - 1;
      return playTrack(next.id,{keepQueue:true});
    }
  }
  if (!manual) { state.isPlaying=false; syncPlaybackUI(); }
}

function prevTrack() {
  if (audio.currentTime > 4) { audio.currentTime = 0; return; }
  const prevId = state.queue[state.queueIndex - 1];
  if (prevId) playTrack(prevId,{keepQueue:true});
  else audio.currentTime = 0;
}

function toggleLike(id = state.currentId) {
  if (!id) return;
  state.likes.has(id) ? state.likes.delete(id) : state.likes.add(id);
  persist();
  syncPlayerMeta();
  if (state.view === 'library' || state.query) render();
  else $$(`[data-like="${CSS.escape(id)}"] .icon`).forEach(el => el.innerHTML = state.likes.has(id) ? icons.heartFill : icons.heart);
  showToast(state.likes.has(id) ? 'Added to Library' : 'Removed from Library');
}

function setAutoplay(on) {
  state.autoplay = on;
  persist();
  ['#sidebarAutoplay','#drawerAutoplay','#settingsAutoplay'].forEach(s => $(s)?.setAttribute('aria-checked', String(on)));
  ['#autoplayBtn','#sheetAutoplayBtn'].forEach(s => $(s)?.classList.toggle('is-active', on));
  if (on && currentTrack()?.source === 'youtube') hydrateRadio(state.currentId);
}
function setShuffle(on) {
  state.shuffle = on;
  $('#shuffleBtn')?.classList.toggle('is-active', on);
  $('#sheetShuffleBtn')?.classList.toggle('is-active', on);
}

function syncPlayerMeta() {
  const t = currentTrack();
  const title = t?.title || 'Nothing playing';
  const artist = t?.artist || 'Choose something to begin';
  $('#playerTitle').textContent = title;
  $('#playerArtist').textContent = artist;
  $('#sheetTitle').textContent = title;
  $('#sheetArtist').textContent = artist;
  [$('#playerArt'),$('#sheetArt')].forEach(el => el.style.setProperty('--art', artValue(t)));
  const liked = t && state.likes.has(t.id);
  $('#likeCurrentBtn .icon').innerHTML = liked ? icons.heartFill : icons.heart;
  $('#sheetLikeBtn .icon').innerHTML = liked ? icons.heartFill : icons.heart;
}
function syncPlaybackUI() {
  const playing = !audio.paused && !!state.currentId;
  state.isPlaying = playing;
  [$('#playBtn'),$('#sheetPlayBtn')].forEach(btn => {
    btn.querySelector('.icon').innerHTML = playing ? icons.pause : icons.play;
    btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  });
}
function syncTime() {
  const d = audio.duration || currentTrack()?.duration || 0;
  const p = d ? audio.currentTime / d : 0;
  const val = Math.round(p * 1000);
  [$('#seek'),$('#sheetSeek')].forEach(el => { el.value = val; el.style.setProperty('--pct', `${p*100}%`); });
  $('#elapsed').textContent = fmt(audio.currentTime);
  $('#duration').textContent = fmt(d);
  $('#sheetElapsed').textContent = fmt(audio.currentTime);
  $('#sheetDuration').textContent = fmt(d);
  if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && Number.isFinite(d) && d > 0) {
    try { navigator.mediaSession.setPositionState({duration:d, playbackRate:audio.playbackRate, position:Math.min(audio.currentTime,d)}); } catch {}
  }
}

function renderQueue() {
  const root = $('#queueList');
  if (!root) return;
  const rows = state.queue.map((id,i) => {
    const t = getTrack(id); if(!t) return '';
    return `<button class="queue-row ${i===state.queueIndex?'is-current':''}" data-queue-index="${i}" style="width:100%;background:${i===state.queueIndex?'rgba(255,255,255,.045)':'transparent'};text-align:left;color:inherit;border:0;">
      <div class="art" style="${artStyle(t)}"></div>
      <div><strong>${esc(t.title)}</strong><span>${esc(t.artist)}</span></div>
      <span class="list-action">${i===state.queueIndex && state.isPlaying ? icons.pause : icons.play}</span>
    </button>`;
  }).join('');
  const loading = state.radioLoadingFor ? `<div class="queue-loading">Finding what plays next…</div>` : '';
  root.innerHTML = rows || `<div class="empty-state"><strong>Your queue is empty.</strong>Play anything to start a Morrow session.</div>`;
  if (rows && loading) root.insertAdjacentHTML('beforeend', loading);
}

function updateMediaSession(t) {
  if (!('mediaSession' in navigator)) return;
  const metadata = { title:t.title, artist:t.artist, album:t.album || 'Morrow' };
  if (t.image) metadata.artwork = [{ src:t.image, sizes:'512x512' }];
  try { navigator.mediaSession.metadata = new MediaMetadata(metadata); } catch {}
  const handlers = {
    play: () => audio.play(),
    pause: () => audio.pause(),
    previoustrack: prevTrack,
    nexttrack: () => nextTrack(true),
    seekbackward: d => audio.currentTime = Math.max(0,audio.currentTime-(d.seekOffset||10)),
    seekforward: d => audio.currentTime = Math.min(audio.duration||Infinity,audio.currentTime+(d.seekOffset||10)),
    seekto: d => { if (typeof d.seekTime === 'number') audio.currentTime = d.seekTime; },
  };
  Object.entries(handlers).forEach(([action,fn]) => { try { navigator.mediaSession.setActionHandler(action,fn); } catch {} });
}

async function loadHome() {
  setSourceStatus('connecting');
  try {
    const data = await api('home');
    state.homeIds = upsertTracks(data.tracks || []);
    if (state.homeIds.length) render();
  } catch (err) {
    setSourceStatus('offline');
    console.warn('InnerTube home unavailable:', err);
    render();
  }
}

async function searchRemote(query, serial) {
  state.searchStatus = 'loading';
  state.searchIds = [];
  render();
  try {
    const data = await api('search', { query });
    if (serial !== searchSerial || state.query.trim() !== query) return;
    state.searchIds = upsertTracks(data.tracks || []);
    state.searchStatus = 'done';
  } catch (err) {
    if (serial !== searchSerial) return;
    state.searchStatus = 'error';
    setSourceStatus('offline');
    console.warn('InnerTube search unavailable:', err);
  }
  render();
}

function startMood(mood) {
  state.view = 'discover';
  state.query = mood;
  search.value = mood;
  const serial = ++searchSerial;
  clearTimeout(searchTimer);
  searchRemote(mood, serial);
}

function openDrawer() { queueDrawer.classList.add('is-open'); queueDrawer.setAttribute('aria-hidden','false'); renderQueue(); }
function closeDrawer() { queueDrawer.classList.remove('is-open'); queueDrawer.setAttribute('aria-hidden','true'); }
function openSheet() { if (innerWidth>760) return; nowPlayingSheet.classList.add('is-open'); nowPlayingSheet.setAttribute('aria-hidden','false'); }
function closeSheet() { nowPlayingSheet.classList.remove('is-open'); nowPlayingSheet.setAttribute('aria-hidden','true'); }
function openSettings() { settingsModal.classList.add('is-open'); settingsModal.setAttribute('aria-hidden','false'); setSourceStatus(state.sourceStatus); }
function closeSettings() { settingsModal.classList.remove('is-open'); settingsModal.setAttribute('aria-hidden','true'); }
function seekFrom(el) { if (audio.duration) audio.currentTime = (Number(el.value)/1000)*audio.duration; }

view.addEventListener('click', e => {
  const play = e.target.closest('[data-play]'); if (play) return playTrack(play.dataset.play);
  const like = e.target.closest('[data-like]'); if (like) return toggleLike(like.dataset.like);
  const mood = e.target.closest('[data-mood]'); if (mood) return startMood(mood.dataset.mood);
  const go = e.target.closest('[data-view]'); if (go) { state.view=go.dataset.view; state.query=''; search.value=''; render(); }
  if (e.target.closest('[data-open-queue]')) openDrawer();
});

document.addEventListener('click', e => {
  const viewBtn = e.target.closest('[data-view]');
  if (viewBtn && !view.contains(viewBtn)) { state.view=viewBtn.dataset.view; state.query=''; search.value=''; render(); }
});

search.addEventListener('input', () => {
  state.query = search.value;
  clearTimeout(searchTimer);
  const q = state.query.trim();
  if (!q) {
    searchSerial++;
    state.searchIds = [];
    state.searchStatus = 'idle';
    render();
    return;
  }
  state.searchStatus = 'loading';
  state.searchIds = [];
  render();
  const serial = ++searchSerial;
  searchTimer = setTimeout(() => searchRemote(q, serial), 320);
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k') { e.preventDefault(); search.focus(); }
  if (e.key==='Escape') { closeDrawer(); closeSheet(); closeSettings(); }
  if (e.code==='Space' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); togglePlay(); }
});

$('#playBtn').addEventListener('click', togglePlay);
$('#sheetPlayBtn').addEventListener('click', togglePlay);
$('#nextBtn').addEventListener('click', ()=>nextTrack(true));
$('#sheetNextBtn').addEventListener('click', ()=>nextTrack(true));
$('#prevBtn').addEventListener('click', prevTrack);
$('#sheetPrevBtn').addEventListener('click', prevTrack);
$('#shuffleBtn').addEventListener('click', ()=>setShuffle(!state.shuffle));
$('#sheetShuffleBtn').addEventListener('click', ()=>setShuffle(!state.shuffle));
$('#autoplayBtn').addEventListener('click', ()=>setAutoplay(!state.autoplay));
$('#sheetAutoplayBtn').addEventListener('click', ()=>setAutoplay(!state.autoplay));
$('#likeCurrentBtn').addEventListener('click', ()=>toggleLike());
$('#sheetLikeBtn').addEventListener('click', ()=>toggleLike());
$('#seek').addEventListener('input', e=>seekFrom(e.currentTarget));
$('#sheetSeek').addEventListener('input', e=>seekFrom(e.currentTarget));
$('#volume').addEventListener('input', e=>{audio.volume=Number(e.target.value); localStorage.setItem('morrow.volume',audio.volume); e.target.style.setProperty('--pct',`${audio.volume*100}%`);});
$('#volume').style.setProperty('--pct',`${audio.volume*100}%`);

[$('#sidebarAutoplay'),$('#drawerAutoplay'),$('#settingsAutoplay')].forEach(btn => btn.addEventListener('click',()=>setAutoplay(!state.autoplay)));
[$('#queueBtn'),$('#playerQueueBtn'),$('#sheetQueueBtn')].forEach(btn=>btn.addEventListener('click',()=>{closeSheet();openDrawer();}));
$$('[data-close-drawer]').forEach(b=>b.addEventListener('click',closeDrawer));
$('#openNowPlaying').addEventListener('click',openSheet);
$$('[data-close-sheet]').forEach(b=>b.addEventListener('click',closeSheet));
$('#settingsBtn').addEventListener('click',openSettings);
$$('[data-close-modal]').forEach(b=>b.addEventListener('click',closeSettings));

$('#queueList').addEventListener('click', e => {
  const qrow = e.target.closest('[data-queue-index]'); if (!qrow) return;
  const i = Number(qrow.dataset.queueIndex); const id = state.queue[i];
  if (id === state.currentId) togglePlay(); else playTrack(id,{keepQueue:true});
});

audio.addEventListener('play',()=>{state.isPlaying=true;syncPlaybackUI();renderQueue(); if('mediaSession'in navigator) navigator.mediaSession.playbackState='playing';});
audio.addEventListener('pause',()=>{state.isPlaying=false;syncPlaybackUI();renderQueue(); if('mediaSession'in navigator) navigator.mediaSession.playbackState='paused';});
audio.addEventListener('timeupdate',syncTime);
audio.addEventListener('loadedmetadata',()=>{
  const t = currentTrack();
  if (t && Number.isFinite(audio.duration) && audio.duration > 0 && !t.duration) t.duration = audio.duration;
  syncTime();
});
audio.addEventListener('ended',()=>nextTrack(false));
audio.addEventListener('error',()=>{
  const t = currentTrack();
  if (t?.source === 'youtube' && streamRetryId !== t.id) {
    streamRetryId = t.id;
    const pos = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    setTimeout(() => {
      audio.src = `${audioUrl(t)}&retry=${Date.now()}`;
      audio.load();
      audio.addEventListener('loadedmetadata', () => {
        if (pos > 0 && audio.duration > pos) audio.currentTime = pos;
        audio.play().catch(() => {});
      }, {once:true});
      audio.play().catch(() => {});
    }, 250);
  } else showToast('This track could not be loaded.');
});

setAutoplay(state.autoplay);
setSourceStatus('connecting');
syncPlayerMeta();
syncPlaybackUI();
renderQueue();
render();
loadHome();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
