const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const PREVIEW_MODE = new URLSearchParams(location.search).has('preview');

const previewTracks = [
  { id:'preview-near-light', videoId:'jfKfPfyJRdk', title:'Near Light', artist:'Ólafur Arnalds', album:'Living Room Songs', duration:228, image:'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85', source:'youtube' },
  { id:'preview-woven-song', videoId:'5qap5aO4i9A', title:'Woven Song', artist:'Hania Rani', album:'Home', duration:307, image:'https://images.unsplash.com/photo-1494253109108-2e30c049369b?auto=format&fit=crop&w=700&q=85', source:'youtube' },
  { id:'preview-four-days', videoId:'DWcJFNfaw9c', title:'Four Long Days', artist:'A Winged Victory for the Sullen', album:'Invisible Cities', duration:252, image:'https://images.unsplash.com/photo-1485470733090-0aae1788d5af?auto=format&fit=crop&w=700&q=85', source:'youtube' },
  { id:'preview-ascent', videoId:'lTRiuFIWV54', title:'An Ending (Ascent)', artist:'Brian Eno', album:'Apollo', duration:266, image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85', source:'youtube' },
  { id:'preview-soothe', videoId:'rUxyKA_-grg', title:'Soothe', artist:'Helios', album:'Eingya', duration:358, image:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=85', source:'youtube' },
  { id:'preview-reflections', videoId:'Na0w3Mz46GA', title:'Piano Reflections', artist:'Nils Frahm', album:'Day', duration:243, image:'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=700&q=85', source:'youtube' },
  { id:'preview-rainy', videoId:'kgx4WGK0oNU', title:'Rainy Morning', artist:'Tom Day', album:'Selected Works', duration:281, image:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=85', source:'youtube' },
  { id:'preview-quiet', videoId:'MYPVQccHhAQ', title:'Quiet Landscapes', artist:'Lena Raine', album:'Oneknowing', duration:296, image:'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=700&q=85', source:'youtube' },
  { id:'preview-night', videoId:'hHW1oY26kxQ', title:'Night Ambient', artist:'Ben Lukas Boysen', album:'Mirage', duration:329, image:'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=700&q=85', source:'youtube' }
];

const catalog = new Map();
const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)); }
  catch { return fallback; }
};

const savedTracks = readJSON('morrow.savedTracks', {});
Object.values(savedTracks).forEach(track => track?.id && catalog.set(track.id, track));
if (PREVIEW_MODE) previewTracks.forEach(track => catalog.set(track.id, track));

const restoredPlayback = readJSON('morrow.playback', null);
if (restoredPlayback?.track?.id) catalog.set(restoredPlayback.track.id, restoredPlayback.track);
(restoredPlayback?.queueTracks || []).forEach(track => track?.id && catalog.set(track.id, track));

const state = {
  view: 'home',
  currentId: restoredPlayback?.track?.id || null,
  queue: (restoredPlayback?.queueTracks || []).map(track => track.id).filter(Boolean),
  queueIndex: Number.isInteger(restoredPlayback?.queueIndex) ? restoredPlayback.queueIndex : -1,
  history: readJSON('morrow.history', []),
  likes: new Set(readJSON('morrow.likes', [])),
  autoplay: readJSON('morrow.autoplay', true),
  shuffle: readJSON('morrow.shuffle', false),
  hidden: new Set(readJSON('morrow.hidden', [])),
  taste: readJSON('morrow.taste', {}),
  following: new Set(readJSON('morrow.following', [])),
  playlists: readJSON('morrow.playlists', { 'saved-for-later': { id:'saved-for-later', name:'Saved for later', trackIds:[] } }),
  playedCount: readJSON('morrow.playedCount', {}),
  query: '',
  searchIds: [],
  searchStatus: 'idle',
  homeIds: PREVIEW_MODE ? previewTracks.map(track => track.id) : [],
  homeStatus: PREVIEW_MODE ? 'ready' : 'loading',
  sourceStatus: PREVIEW_MODE ? 'preview' : 'connecting',
  visitorData: sessionStorage.getItem('morrow.visitorData') || '',
  isPlaying: false,
  playIntent: false,
  radioLoadingFor: null,
  contextTrackId: null,
  streamRecoveryFor: null,
};

const audio = $('#audio');
const view = $('#view');
const search = $('#globalSearch');
const contextLayer = $('#contextMenu');
const contextPanel = $('#contextPanel');
const queueDrawer = $('#queueDrawer');
const nowPlaying = $('#nowPlaying');
const settingsModal = $('#settingsModal');
const toast = $('#toast');
const visualizerCanvas = $('#visualizer');

audio.volume = Number(localStorage.getItem('morrow.volume') || restoredPlayback?.volume || 0.78);
$('#volume').value = String(audio.volume);
let lastAudibleVolume = audio.volume || 0.78;
let toastTimer;
let searchTimer;
let searchSerial = 0;
let recoverySerial = 0;
let visualizerFrame = 0;
let analyser = null;
let analyserData = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function cssUrl(url) {
  if (!url) return 'none';
  return `url('${String(url).replace(/'/g, '%27')}')`;
}

function artStyle(track) {
  return `--art-image:${cssUrl(track?.image)}`;
}

function fmt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const value = Math.floor(seconds);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function locale() {
  const [hl = 'en', region = 'US'] = (navigator.language || 'en-US').split('-');
  return { hl, gl: region.toUpperCase() };
}

function currentTrack() { return catalog.get(state.currentId) || null; }
function getTrack(id) { return catalog.get(id) || null; }
function visibleTracks(ids) { return ids.map(getTrack).filter(track => track && !state.hidden.has(track.id)); }
function homeTracks() { return visibleTracks(state.homeIds); }
function allKnownTracks() { return [...catalog.values()].filter(track => !state.hidden.has(track.id)); }

function updateVisitorData(value) {
  if (!value) return;
  state.visitorData = value;
  sessionStorage.setItem('morrow.visitorData', value);
}

function setSourceStatus(status) {
  state.sourceStatus = status;
  const label = { connecting:'Connecting', online:'Online', offline:'Unavailable', preview:'Preview' }[status] || status;
  if ($('#sourceStatus')) $('#sourceStatus').textContent = label;
}

function upsertTracks(items = []) {
  const ids = [];
  for (const raw of items) {
    if (!raw?.id || !raw?.title) continue;
    const existing = catalog.get(raw.id) || {};
    const track = {
      ...existing,
      ...raw,
      id: raw.id,
      videoId: raw.videoId || raw.id,
      artist: raw.artist || existing.artist || 'YouTube Music',
      album: raw.album || existing.album || '',
      image: raw.image || existing.image || null,
      source: raw.source || 'youtube'
    };
    catalog.set(track.id, track);
    ids.push(track.id);
  }
  return ids;
}

function trackSnapshot(track) {
  if (!track) return null;
  return {
    id:track.id, videoId:track.videoId || track.id, playbackVideoId:track.playbackVideoId || null,
    title:track.title, artist:track.artist, album:track.album || '', duration:track.duration || null,
    image:track.image || null, source:track.source || 'youtube'
  };
}

function persist() {
  localStorage.setItem('morrow.likes', JSON.stringify([...state.likes]));
  localStorage.setItem('morrow.autoplay', JSON.stringify(state.autoplay));
  localStorage.setItem('morrow.shuffle', JSON.stringify(state.shuffle));
  localStorage.setItem('morrow.hidden', JSON.stringify([...state.hidden]));
  localStorage.setItem('morrow.taste', JSON.stringify(state.taste));
  localStorage.setItem('morrow.following', JSON.stringify([...state.following]));
  localStorage.setItem('morrow.playlists', JSON.stringify(state.playlists));
  localStorage.setItem('morrow.playedCount', JSON.stringify(state.playedCount));
  localStorage.setItem('morrow.history', JSON.stringify(state.history.slice(0, 80)));
  localStorage.setItem('morrow.volume', String(audio.volume));

  const saved = {};
  const keepIds = new Set([...state.likes, ...Object.values(state.playlists).flatMap(item => item.trackIds || []), ...state.history.slice(0,20)]);
  for (const id of keepIds) {
    const track = getTrack(id);
    if (track) saved[id] = trackSnapshot(track);
  }
  localStorage.setItem('morrow.savedTracks', JSON.stringify(saved));
  localStorage.setItem('morrow.playback', JSON.stringify({
    track: trackSnapshot(currentTrack()),
    queueTracks: state.queue.map(getTrack).filter(Boolean).map(trackSnapshot),
    queueIndex: state.queueIndex,
    position: Number(audio.currentTime || 0),
    volume: audio.volume,
    wasPlaying: state.playIntent
  }));
}

async function api(action, payload = {}) {
  const response = await fetch('/api/innertube', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ action, ...payload, locale:locale(), visitorData:state.visitorData || undefined })
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.error || `Music service ${response.status}`);
  updateVisitorData(data.visitorData);
  setSourceStatus('online');
  return data;
}

function audioUrl(track) {
  const { hl, gl } = locale();
  const params = new URLSearchParams({ v:track.playbackVideoId || track.videoId || track.id, hl, gl });
  if (track.title) params.set('title', String(track.title).slice(0,160));
  if (track.artist) params.set('artist', String(track.artist).slice(0,120));
  if (state.visitorData) params.set('visitorData', state.visitorData);
  return `/api/audio?${params}`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function publicPlaylists() {
  const tracks = homeTracks();
  const definitions = [
    ['quiet-landscapes','Quiet Landscapes','Lena Raine',0],
    ['piano-reflections','Piano Reflections','Hania Rani',2],
    ['rainy-mornings','Rainy Mornings','Tom Day',4],
    ['night-ambient','Night Ambient','Ben Lukas Boysen',6]
  ];
  return definitions.map(([id,title,curator,index], offset) => {
    const seed = tracks[index % Math.max(1,tracks.length)] || previewTracks[offset];
    return { id, title, curator, seedId:seed?.id, image:seed?.image, avatar:tracks[(index+1) % Math.max(1,tracks.length)]?.image || seed?.image };
  }).filter(item => item.seedId);
}

function peopleSuggestions() {
  const seen = new Set();
  const people = [];
  for (const track of [...homeTracks(), ...allKnownTracks()]) {
    const name = track.artist?.split(',')[0]?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    people.push({ id:`artist:${slug(name)}`, name, image:track.image, detail:`${(480 + people.length * 173)}K followers`, seedId:track.id, type:people.length % 3 === 2 ? 'Listener' : 'Artist' });
    if (people.length === 8) break;
  }
  return people;
}

function isFollowing(id) { return state.following.has(id); }

function toggleFollow(id, label) {
  if (state.following.has(id)) state.following.delete(id);
  else state.following.add(id);
  persist();
  render();
  showToast(state.following.has(id) ? `Following ${label}` : `Unfollowed ${label}`);
}

function playlistMarkup(item) {
  const followId = `playlist:${item.id}`;
  return `<article class="playlist-card">
    <button class="art playlist-art" style="${artStyle(item)}" data-playlist="${esc(item.id)}" aria-label="Play ${esc(item.title)}"></button>
    <strong>${esc(item.title)}</strong>
    <span class="playlist-byline"><span class="curator-avatar" style="background-image:${cssUrl(item.avatar)}"></span>${esc(item.curator)}</span>
    <div class="playlist-actions"><button class="follow-button ${isFollowing(followId)?'is-following':''}" data-follow="${esc(followId)}" data-label="${esc(item.title)}">${isFollowing(followId)?'Following':'Follow'}</button></div>
  </article>`;
}

function personMarkup(person) {
  return `<article class="follow-person">
    <button class="follow-avatar" style="background-image:${cssUrl(person.image)}" data-artist="${esc(person.name)}" aria-label="Open ${esc(person.name)}"></button>
    <div class="follow-copy"><strong>${esc(person.name)}</strong><span>${esc(person.type)} · ${esc(person.detail)}</span><button class="follow-button ${isFollowing(person.id)?'is-following':''}" data-follow="${esc(person.id)}" data-label="${esc(person.name)}">${isFollowing(person.id)?'Following':'Follow'}</button></div>
  </article>`;
}

function trackRow(track, { compact = false, showAlbum = false } = {}) {
  const playing = state.currentId === track.id;
  return `<article class="track-row ${playing?'is-playing':''}" data-track-row="${esc(track.id)}">
    <button class="track-main" data-play="${esc(track.id)}">
      <span class="art track-art" style="${artStyle(track)}"><span class="playing-mark"><i class="ph-fill ph-speaker-simple-high" aria-hidden="true"></i></span></span>
      <span class="track-copy"><strong>${esc(track.title)}</strong><span>${esc(track.artist)}</span></span>
    </button>
    ${showAlbum ? `<span class="track-album">${esc(track.album || 'Single')}</span><span class="track-duration">${track.duration?fmt(track.duration):''}</span>` : ''}
    <span class="track-row-actions">
      ${!compact && !showAlbum ? `<span class="track-duration">${track.duration?fmt(track.duration):''}</span>` : ''}
      <button class="icon-button" data-context="${esc(track.id)}" aria-label="More actions for ${esc(track.title)}" aria-haspopup="menu"><i class="ph ph-dots-three" aria-hidden="true"></i></button>
    </span>
  </article>`;
}

function renderHomeSkeleton() {
  view.innerHTML = `<div class="home-skeleton">
    <div><div class="feature-skeleton"><div class="skeleton skeleton-art"></div><div class="feature-skeleton-copy"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div></div></div>
    <div class="list-skeleton">${'<div class="list-skeleton-row skeleton"></div>'.repeat(6)}</div>
  </div>`;
}

function renderHome() {
  if (state.homeStatus === 'loading' && !homeTracks().length) return renderHomeSkeleton();
  const tracks = homeTracks();
  if (!tracks.length) {
    view.innerHTML = `<div class="error-state"><div><strong>We couldn't load your music home.</strong><span>Search still works when the recommendation feed is unavailable.</span><br><button class="secondary-button" data-retry-home><i class="ph ph-arrow-clockwise"></i>Try again</button></div></div>`;
    return;
  }

  const hero = currentTrack() || tracks.sort((a,b)=>(state.playedCount[b.id]||0)-(state.playedCount[a.id]||0))[0] || tracks[0];
  const next = recommendations(5, hero);
  const playlists = publicPlaylists();
  const people = peopleSuggestions().slice(0,4);
  view.innerHTML = `<div class="home-layout">
    <div class="home-primary">
      <section class="radio-feature">
        <button class="art radio-art" style="${artStyle(hero)}" data-radio="${esc(hero.id)}" aria-label="Start radio from ${esc(hero.title)}"></button>
        <div class="radio-copy"><span class="overline">FOR YOU</span><h1>Your evening radio</h1><p>Built around ${esc(hero.artist)} and music you keep returning to.</p><button class="primary-button" data-radio="${esc(hero.id)}"><i class="ph-fill ph-play"></i>Start radio</button></div>
      </section>

      <section class="home-section"><header class="section-heading"><h2>From people you follow</h2><button class="text-button" data-view="following">See all</button></header><div class="playlist-row">${playlists.map(playlistMarkup).join('')}</div></section>
      <section class="home-section"><header class="section-heading"><h2>Artists & listeners to follow</h2><button class="text-button" data-view="following">See all</button></header><div class="follow-row">${people.map(personMarkup).join('')}</div></section>
    </div>

    <aside class="next-panel"><h2>Next for you</h2><div class="track-list">${next.map(track => trackRow(track,{compact:true})).join('')}</div></aside>
  </div>`;
}

function renderSearch() {
  const query = state.query.trim();
  const hits = visibleTracks(state.searchIds);
  if (!query) {
    const playlists = publicPlaylists();
    const people = peopleSuggestions();
    view.innerHTML = `<div class="page-intro"><span class="overline">SEARCH</span><h1>Find your next listen.</h1><p>Songs, artists, public playlists and radios.</p></div>
      <section class="content-section"><header class="section-heading"><h2>Public playlists</h2></header><div class="entity-grid">${playlists.map(playlistMarkup).join('')}</div></section>
      <section class="content-section"><header class="section-heading"><h2>Artists & listeners</h2></header><div class="follow-row">${people.slice(0,4).map(personMarkup).join('')}</div></section>`;
    return;
  }
  if (state.searchStatus === 'loading') {
    view.innerHTML = `<div class="page-intro"><span class="overline">SEARCH</span><h1>Searching for “${esc(query)}”</h1></div><div class="wide-list track-list">${Array.from({length:7},()=>'<div class="list-skeleton-row skeleton"></div>').join('')}</div>`;
    return;
  }
  const body = hits.length
    ? `<div class="wide-list track-list">${hits.map(track => trackRow(track,{showAlbum:true})).join('')}</div>`
    : `<div class="empty-state"><div><strong>${state.searchStatus==='error'?'Search is unavailable right now.':'No exact matches.'}</strong><span>${state.searchStatus==='error'?'Your current music stays available. Try again in a moment.':'Try another title, artist or playlist.'}</span></div></div>`;
  view.innerHTML = `<div class="page-intro"><span class="overline">SEARCH</span><h1>${hits.length ? `${hits.length} results` : 'Nothing found'}</h1><p>for “${esc(query)}”</p></div><section class="content-section">${body}</section>`;
}

function renderLibrary() {
  const liked = [...state.likes].map(getTrack).filter(Boolean);
  const playlists = Object.values(state.playlists);
  view.innerHTML = `<div class="page-intro"><span class="overline">YOUR MUSIC</span><h1>Library</h1><p>Music and playlists saved on this device.</p></div>
    <section class="content-section"><header class="section-heading"><h2>Your playlists</h2><button class="text-button" data-create-playlist>New playlist</button></header>
      <div class="entity-grid">${playlists.map(item => { const first=getTrack(item.trackIds?.[0]); return `<button class="entity-card" data-local-playlist="${esc(item.id)}"><span class="art entity-art" style="${artStyle(first)}"></span><strong>${esc(item.name)}</strong><span>${item.trackIds?.length||0} tracks</span></button>`; }).join('')}</div></section>
    <section class="content-section"><header class="section-heading"><h2>Liked songs</h2><p>${liked.length} saved</p></header>${liked.length?`<div class="wide-list track-list">${liked.map(track=>trackRow(track,{showAlbum:true})).join('')}</div>`:'<div class="empty-state"><div><strong>No liked songs yet.</strong><span>Use the heart in the player or a song menu.</span></div></div>'}</section>`;
}

function renderFollowing() {
  const playlists = publicPlaylists().filter(item => isFollowing(`playlist:${item.id}`));
  const people = peopleSuggestions().filter(item => isFollowing(item.id));
  view.innerHTML = `<div class="page-intro"><span class="overline">FOLLOWING</span><h1>Your music circle</h1><p>New music from artists, listeners and public playlists you follow.</p></div>
    <section class="content-section"><header class="section-heading"><h2>Public playlists</h2></header>${playlists.length?`<div class="entity-grid">${playlists.map(playlistMarkup).join('')}</div>`:'<div class="empty-state"><div><strong>No followed playlists yet.</strong><span>Follow a public playlist from For You.</span></div></div>'}</section>
    <section class="content-section"><header class="section-heading"><h2>Artists & listeners</h2></header>${people.length?`<div class="follow-row">${people.map(personMarkup).join('')}</div>`:'<div class="empty-state"><div><strong>No one here yet.</strong><span>Follow artists and listeners to shape this feed.</span></div></div>'}</section>`;
}

function render() {
  closeContextMenu();
  if (state.view === 'search') renderSearch();
  else if (state.view === 'library') renderLibrary();
  else if (state.view === 'following') renderFollowing();
  else renderHome();
  syncNav();
}

function syncNav() {
  $$('[data-view]').forEach(button => button.classList.toggle('is-active', button.dataset.view === state.view));
}

function recommendations(limit = 5, seed = currentTrack()) {
  const pool = homeTracks().length ? homeTracks() : allKnownTracks();
  return pool.map((track,index) => {
    let score = (state.likes.has(track.id) ? 1.4 : 0) + (state.taste[track.id] || 0) - (state.playedCount[track.id] || 0) * .08;
    if (track.id === seed?.id) score -= 10;
    score += ((index * 17 + state.history.length * 7) % 13) / 20;
    return { track, score };
  }).sort((a,b)=>b.score-a.score).slice(0,limit).map(item=>item.track);
}

async function loadHome() {
  if (PREVIEW_MODE) { state.homeStatus = 'ready'; render(); return; }
  state.homeStatus = state.homeIds.length ? 'refreshing' : 'loading';
  setSourceStatus('connecting');
  render();
  try {
    const data = await api('home');
    state.homeIds = upsertTracks(data.tracks || []);
    state.homeStatus = 'ready';
  } catch (error) {
    setSourceStatus('offline');
    state.homeStatus = 'error';
    console.warn('Morrow home unavailable:', error);
  }
  render();
}

async function searchRemote(query, serial) {
  state.searchStatus = 'loading';
  state.searchIds = [];
  render();
  try {
    const data = await api('search',{ query });
    if (serial !== searchSerial || state.query.trim() !== query) return;
    state.searchIds = upsertTracks(data.tracks || []);
    state.searchStatus = 'done';
  } catch (error) {
    if (serial !== searchSerial) return;
    state.searchStatus = 'error';
    setSourceStatus('offline');
    console.warn('Morrow search unavailable:', error);
  }
  render();
}

async function hydrateRadio(seedId) {
  const seed = getTrack(seedId);
  if (!seed || seed.source !== 'youtube' || state.radioLoadingFor === seedId || PREVIEW_MODE) return;
  state.radioLoadingFor = seedId;
  renderQueue();
  try {
    const data = await api('next',{ videoId:seed.videoId || seed.id });
    const ids = upsertTracks(data.tracks || []).filter(id => id !== seedId && !state.hidden.has(id));
    const existing = new Set(state.queue);
    for (const id of ids) if (!existing.has(id)) { state.queue.push(id); existing.add(id); }
  } catch (error) {
    console.warn('Radio unavailable:', error);
  } finally {
    state.radioLoadingFor = null;
    persist();
    renderQueue();
  }
}

function setAudioSource(track, position = 0) {
  recoverySerial += 1;
  audio.src = audioUrl(track);
  audio.load();
  if (position > 0) {
    const applyPosition = () => { try { audio.currentTime = Math.min(position,audio.duration || position); } catch {} };
    audio.addEventListener('loadedmetadata', applyPosition, { once:true });
  }
}

async function recoverStream(track) {
  if (!track || state.streamRecoveryFor === track.id || PREVIEW_MODE) {
    state.playIntent = false;
    setPlaying(false);
    showToast(PREVIEW_MODE ? 'Playback is disabled in visual preview.' : 'This track is unavailable right now.');
    return;
  }
  state.streamRecoveryFor = track.id;
  const serial = ++recoverySerial;
  try {
    const data = await api('public',{ title:track.title, artist:track.artist, rejectedId:track.playbackVideoId || track.videoId || track.id });
    if (serial !== recoverySerial) return;
    track.playbackVideoId = data.videoId;
    audio.src = audioUrl(track);
    audio.load();
    await audio.play();
  } catch (error) {
    state.playIntent = false;
    setPlaying(false);
    showToast('This track is unavailable right now.');
    console.warn('Audio recovery failed:', error);
  }
}

async function playTrack(id, { keepQueue = false, buildRadio = true } = {}) {
  const track = getTrack(id);
  if (!track) return;

  if (!keepQueue || !state.queue.includes(id)) {
    state.queue = [id];
    state.queueIndex = 0;
  } else state.queueIndex = state.queue.indexOf(id);

  const changed = state.currentId !== id;
  state.playIntent = true;
  if (changed) {
    state.currentId = id;
    state.streamRecoveryFor = null;
    state.playedCount[id] = (state.playedCount[id] || 0) + 1;
    state.history = [id, ...state.history.filter(item => item !== id)].slice(0,80);
    updateMediaSession(track);
    syncPlayerMeta();
    setAudioSource(track);
  }

  if (PREVIEW_MODE) {
    setPlaying(false);
    showToast('Visual preview — connect the deployed audio service to play.');
  } else {
    try { await audio.play(); }
    catch (error) { await recoverStream(track); }
  }
  persist();
  renderQueue();
  renderActiveRows();
  if (buildRadio && state.autoplay) hydrateRadio(id);
}

function togglePlay() {
  if (!currentTrack()) return showToast('Choose a song or radio to begin.');
  if (audio.paused) {
    state.playIntent = true;
    if (PREVIEW_MODE) return showToast('Visual preview — playback is not connected.');
    audio.play().catch(() => recoverStream(currentTrack()));
  } else {
    state.playIntent = false;
    audio.pause();
  }
}

async function nextTrack(manual = true) {
  let nextId;
  if (state.shuffle) nextId = recommendations(1)[0]?.id;
  else nextId = state.queue[state.queueIndex + 1];

  if (!nextId && state.autoplay && currentTrack()) {
    await hydrateRadio(state.currentId);
    nextId = state.queue[state.queueIndex + 1] || recommendations(1)[0]?.id;
    if (nextId && !state.queue.includes(nextId)) state.queue.push(nextId);
  }
  if (nextId) playTrack(nextId,{ keepQueue:true });
  else if (!manual) { state.playIntent = false; setPlaying(false); }
}

function previousTrack() {
  if (audio.currentTime > 4) { audio.currentTime = 0; return; }
  const previousId = state.queue[state.queueIndex - 1];
  if (previousId) playTrack(previousId,{ keepQueue:true });
  else audio.currentTime = 0;
}

function startRadio(id) {
  const seed = getTrack(id);
  if (!seed) return;
  state.queue = [id];
  state.queueIndex = 0;
  playTrack(id,{ keepQueue:true, buildRadio:true });
}

function playPlaylist(id) {
  const playlist = publicPlaylists().find(item => item.id === id);
  if (playlist?.seedId) startRadio(playlist.seedId);
}

function setPlaying(playing) {
  state.isPlaying = !!playing;
  syncPlaybackUI();
  renderActiveRows();
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

function setAutoplay(enabled) {
  state.autoplay = enabled;
  ['#drawerAutoplay','#settingsAutoplay'].forEach(selector => $(selector)?.setAttribute('aria-checked', String(enabled)));
  ['#autoplayBtn','#fullAutoplayBtn'].forEach(selector => $(selector)?.classList.toggle('is-active',enabled));
  persist();
  if (enabled && currentTrack()) hydrateRadio(state.currentId);
}

function setShuffle(enabled) {
  state.shuffle = enabled;
  ['#shuffleBtn','#fullShuffleBtn'].forEach(selector => $(selector)?.classList.toggle('is-active',enabled));
  persist();
}

function toggleLike(id = state.currentId) {
  if (!id) return showToast('Nothing is playing.');
  if (state.likes.has(id)) state.likes.delete(id); else state.likes.add(id);
  persist();
  syncPlayerMeta();
  if (state.view === 'library') render();
  showToast(state.likes.has(id) ? 'Added to Liked Songs' : 'Removed from Liked Songs');
}

function syncPlayerMeta() {
  const track = currentTrack();
  const title = track?.title || 'Nothing playing';
  const artist = track?.artist || 'Choose something to begin';
  ['#playerTitle','#fullTitle'].forEach(selector => { $(selector).textContent = title; });
  ['#playerArtist','#fullArtist'].forEach(selector => { $(selector).textContent = artist; });
  ['#playerArt','#fullArt'].forEach(selector => $(selector).style.setProperty('--art-image', cssUrl(track?.image)));
  const liked = !!track && state.likes.has(track.id);
  [['#likeCurrentBtn',liked],['#fullLikeBtn',liked]].forEach(([selector,on]) => {
    const button = $(selector); if (!button) return;
    const icon = $('i',button); icon.className = `${on?'ph-fill':'ph'} ph-heart`;
    button.setAttribute('aria-label', on ? 'Unlike current track' : 'Like current track');
  });
}

function syncPlaybackUI() {
  const playing = state.isPlaying && !!currentTrack();
  ['#playBtn','#fullPlayBtn'].forEach(selector => {
    const button = $(selector); if (!button) return;
    const icon = $('i',button);
    icon.className = `ph-fill ${playing?'ph-pause':'ph-play'}`;
    button.setAttribute('aria-label',playing?'Pause':'Play');
  });
}

function setRangeProgress(element, ratio) {
  if (!element) return;
  element.style.setProperty('--pct', `${Math.max(0,Math.min(1,ratio))*100}%`);
}

function syncTime() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : Number(currentTrack()?.duration || 0);
  const current = Number(audio.currentTime || 0);
  const ratio = duration ? current / duration : 0;
  const value = Math.round(ratio * 1000);
  ['#seek','#fullSeek'].forEach(selector => { const input=$(selector); input.value=String(value); setRangeProgress(input,ratio); });
  ['#elapsed','#fullElapsed'].forEach(selector => { $(selector).textContent=fmt(current); });
  ['#duration','#fullDuration'].forEach(selector => { $(selector).textContent=fmt(duration); });
  if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && duration > 0) {
    try { navigator.mediaSession.setPositionState({ duration, playbackRate:audio.playbackRate || 1, position:Math.min(current,duration) }); } catch {}
  }
}

function renderActiveRows() {
  $$('[data-track-row]').forEach(row => row.classList.toggle('is-playing',row.dataset.trackRow === state.currentId));
}

function updateMediaSession(track) {
  if (!('mediaSession' in navigator) || !track) return;
  const metadata = { title:track.title, artist:track.artist, album:track.album || 'Morrow' };
  if (track.image) metadata.artwork = [96,128,192,256,384,512].map(size => ({ src:track.image, sizes:`${size}x${size}` }));
  try { navigator.mediaSession.metadata = new MediaMetadata(metadata); } catch {}
}

function configureMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const handlers = {
    play: () => { state.playIntent = true; audio.play().catch(() => recoverStream(currentTrack())); },
    pause: () => { state.playIntent = false; audio.pause(); },
    previoustrack: previousTrack,
    nexttrack: () => nextTrack(true),
    seekbackward: details => { audio.currentTime = Math.max(0,audio.currentTime-(details.seekOffset || 10)); },
    seekforward: details => { audio.currentTime = Math.min(audio.duration || Infinity,audio.currentTime+(details.seekOffset || 10)); },
    seekto: details => { if (typeof details.seekTime === 'number') audio.currentTime = details.seekTime; },
    stop: () => { state.playIntent = false; audio.pause(); audio.currentTime = 0; }
  };
  Object.entries(handlers).forEach(([action,handler]) => { try { navigator.mediaSession.setActionHandler(action,handler); } catch {} });
}

function detectBackgroundPlayback() {
  const status = $('#backgroundPlaybackStatus');
  const note = $('#backgroundPlaybackNote');
  const platformNote = $('#platformNote');
  const hasNativeAudio = typeof HTMLMediaElement !== 'undefined';
  const hasMediaSession = 'mediaSession' in navigator;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!hasNativeAudio) {
    status.textContent = 'Unavailable';
    note.textContent = 'This browser does not expose native media playback.';
  } else if (hasMediaSession) {
    status.textContent = 'Supported';
    note.textContent = 'Native audio with lock-screen and system media controls.';
  } else {
    status.textContent = 'Best effort';
    note.textContent = 'Audio can continue, but system controls are not available here.';
  }
  platformNote.textContent = isiOS && !standalone
    ? 'For the most reliable iPhone and iPad playback, add Morrow to the Home Screen and start the first track with a tap. iOS may still stop web audio under Low Power Mode or memory pressure.'
    : 'Morrow uses the browser’s native audio pipeline. The operating system can still suspend any web app under battery, memory or network pressure.';
}

function openContextMenu(id, anchor) {
  const track = getTrack(id);
  if (!track) return;
  state.contextTrackId = id;
  contextPanel.innerHTML = `<div class="context-track"><strong>${esc(track.title)}</strong><span>${esc(track.artist)}</span></div>
    <button class="context-action" role="menuitem" data-context-action="play-next"><i class="ph ph-skip-forward"></i>Play next</button>
    <button class="context-action" role="menuitem" data-context-action="add-queue"><i class="ph ph-queue"></i>Add to queue</button>
    <button class="context-action" role="menuitem" data-context-action="add-playlist"><i class="ph ph-plus"></i>Add to playlist</button>
    <button class="context-action" role="menuitem" data-context-action="start-radio"><i class="ph ph-broadcast"></i>Start radio</button>
    <div class="context-separator"></div>
    <button class="context-action" role="menuitem" data-context-action="taste-more"><i class="ph ph-sliders-horizontal"></i>More like this</button>
    <button class="context-action" role="menuitem" data-context-action="taste-less"><i class="ph ph-prohibit"></i>Less like this</button>
    <button class="context-action danger" role="menuitem" data-context-action="hide"><i class="ph ph-eye-slash"></i>Hide track</button>
    <div class="context-separator"></div>
    <button class="context-action" role="menuitem" data-context-action="artist"><i class="ph ph-user"></i>Go to artist</button>
    <button class="context-action" role="menuitem" data-context-action="share"><i class="ph ph-share-network"></i>Share</button>`;

  if (innerWidth > 700) {
    const rect = anchor.getBoundingClientRect();
    const width = 232;
    const estimatedHeight = 474;
    const left = Math.min(innerWidth-width-12,Math.max(12,rect.right-width));
    const top = rect.bottom+8+estimatedHeight > innerHeight ? Math.max(12,rect.top-estimatedHeight-8) : rect.bottom+8;
    contextPanel.style.left = `${left}px`;
    contextPanel.style.top = `${top}px`;
  }
  contextLayer.classList.add('is-open');
  contextLayer.setAttribute('aria-hidden','false');
  requestAnimationFrame(() => $('[role="menuitem"]',contextPanel)?.focus());
}

function closeContextMenu() {
  contextLayer.classList.remove('is-open');
  contextLayer.setAttribute('aria-hidden','true');
  state.contextTrackId = null;
}

function addToQueue(id, next = false) {
  if (!getTrack(id)) return;
  const existing = state.queue.indexOf(id);
  if (existing >= 0 && existing !== state.queueIndex) state.queue.splice(existing,1);
  const insertAt = next ? Math.max(0,state.queueIndex+1) : state.queue.length;
  state.queue.splice(insertAt,0,id);
  if (state.queueIndex < 0) state.queueIndex = 0;
  persist(); renderQueue(); showToast(next?'Playing next':'Added to queue');
}

function addToPlaylist(id) {
  const playlist = state.playlists['saved-for-later'];
  if (!playlist.trackIds.includes(id)) playlist.trackIds.push(id);
  persist(); showToast(`Added to ${playlist.name}`);
}

function hideTrack(id) {
  state.hidden.add(id);
  state.queue = state.queue.filter(item => item !== id);
  persist(); render(); renderQueue(); showToast('Track hidden from recommendations');
}

async function shareTrack(track) {
  const data = { title:`${track.title} — ${track.artist}`, text:`Listen to ${track.title} by ${track.artist} on Morrow`, url:location.origin };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(`${data.text} ${data.url}`); showToast('Link copied'); }
  } catch (error) { if (error.name !== 'AbortError') showToast('Sharing is unavailable here'); }
}

function handleContextAction(action) {
  const id = state.contextTrackId;
  const track = getTrack(id);
  if (!track) return closeContextMenu();
  if (action === 'play-next') addToQueue(id,true);
  else if (action === 'add-queue') addToQueue(id,false);
  else if (action === 'add-playlist') addToPlaylist(id);
  else if (action === 'start-radio') startRadio(id);
  else if (action === 'taste-more') { state.taste[id]=(state.taste[id]||0)+1; persist(); showToast('Taste profile updated'); }
  else if (action === 'taste-less') { state.taste[id]=(state.taste[id]||0)-1; persist(); showToast('Taste profile updated'); }
  else if (action === 'hide') hideTrack(id);
  else if (action === 'artist') openArtist(track.artist);
  else if (action === 'share') shareTrack(track);
  closeContextMenu();
}

function openArtist(artist) {
  state.view = 'search'; state.query = artist; search.value = artist;
  const serial = ++searchSerial; searchRemote(artist,serial);
}

function renderQueue() {
  const root = $('#queueList');
  const rows = state.queue.map((id,index) => {
    const track = getTrack(id); if (!track) return '';
    return `<article class="queue-row ${index===state.queueIndex?'is-current':''}"><span class="art" style="${artStyle(track)}"></span><button class="track-main" data-queue-index="${index}"><span class="track-copy"><strong>${esc(track.title)}</strong><span>${esc(track.artist)}</span></span></button><button class="icon-button" data-remove-queue="${index}" aria-label="Remove ${esc(track.title)} from queue"><i class="ph ph-x"></i></button></article>`;
  }).join('');
  root.innerHTML = rows || '<div class="empty-state"><div><strong>Your queue is empty.</strong><span>Start a radio or add a song.</span></div></div>';
  if (state.radioLoadingFor) root.insertAdjacentHTML('beforeend','<div class="setting-note">Finding what fits next…</div>');
}

function openDrawer() {
  closeContextMenu();
  queueDrawer.classList.add('is-open'); queueDrawer.setAttribute('aria-hidden','false'); renderQueue();
}
function closeDrawer() { queueDrawer.classList.remove('is-open'); queueDrawer.setAttribute('aria-hidden','true'); }
function openSettings() { settingsModal.classList.add('is-open'); settingsModal.setAttribute('aria-hidden','false'); detectBackgroundPlayback(); setSourceStatus(state.sourceStatus); }
function closeSettings() { settingsModal.classList.remove('is-open'); settingsModal.setAttribute('aria-hidden','true'); }

function openFullPlayer() {
  closeDrawer(); closeContextMenu(); syncPlayerMeta(); syncPlaybackUI(); syncTime();
  nowPlaying.classList.add('is-open'); nowPlaying.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; startVisualizer();
}
function closeFullPlayer() {
  nowPlaying.classList.remove('is-open'); nowPlaying.setAttribute('aria-hidden','true'); document.body.style.overflow=''; stopVisualizer();
}

function setupVisualizer() {
  if (analyser || !audio.captureStream || !window.AudioContext) return;
  try {
    const context = new AudioContext();
    const stream = audio.captureStream();
    const source = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = .82;
    source.connect(analyser);
    analyserData = new Uint8Array(analyser.frequencyBinCount);
  } catch { analyser = null; }
}

function drawVisualizer() {
  const context = visualizerCanvas.getContext('2d');
  const width = visualizerCanvas.width;
  const height = visualizerCanvas.height;
  context.clearRect(0,0,width,height);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (analyser && !reduced) analyser.getByteFrequencyData(analyserData);
  const bars = 44;
  const gap = 7;
  const barWidth = (width-gap*(bars-1))/bars;
  context.fillStyle = 'rgba(247,247,245,.72)';
  for (let index=0; index<bars; index+=1) {
    const signal = analyserData ? analyserData[Math.floor(index/bars*analyserData.length)]/255 : 0;
    const barHeight = reduced ? 2 : Math.max(2,signal*height*.8);
    context.fillRect(index*(barWidth+gap),(height-barHeight)/2,barWidth,barHeight);
  }
  if (nowPlaying.classList.contains('is-open')) visualizerFrame=requestAnimationFrame(drawVisualizer);
}
function startVisualizer() { setupVisualizer(); cancelAnimationFrame(visualizerFrame); drawVisualizer(); }
function stopVisualizer() { cancelAnimationFrame(visualizerFrame); visualizerFrame=0; }

function seekFrom(input) {
  if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(input.value)/1000*audio.duration;
}

view.addEventListener('click', event => {
  const play = event.target.closest('[data-play]'); if (play) return playTrack(play.dataset.play);
  const radio = event.target.closest('[data-radio]'); if (radio) return startRadio(radio.dataset.radio);
  const playlist = event.target.closest('[data-playlist]'); if (playlist) return playPlaylist(playlist.dataset.playlist);
  const follow = event.target.closest('[data-follow]'); if (follow) return toggleFollow(follow.dataset.follow,follow.dataset.label);
  const artist = event.target.closest('[data-artist]'); if (artist) return openArtist(artist.dataset.artist);
  const context = event.target.closest('[data-context]'); if (context) return openContextMenu(context.dataset.context,context);
  const nav = event.target.closest('[data-view]'); if (nav) { state.view=nav.dataset.view; if (state.view!=='search') { state.query=''; search.value=''; } render(); return; }
  if (event.target.closest('[data-retry-home]')) loadHome();
  if (event.target.closest('[data-create-playlist]')) { const name=prompt('Playlist name'); if (name?.trim()) { const id=`local-${Date.now()}`; state.playlists[id]={id,name:name.trim(),trackIds:[]}; persist(); render(); } }
  const localPlaylist = event.target.closest('[data-local-playlist]');
  if (localPlaylist) { const item=state.playlists[localPlaylist.dataset.localPlaylist]; const first=item?.trackIds?.[0]; if (first) playTrack(first); else showToast('This playlist is empty'); }
});

document.addEventListener('click', event => {
  const nav = event.target.closest('[data-view]');
  if (nav && !view.contains(nav)) {
    state.view=nav.dataset.view;
    if (state.view==='search') search.focus(); else { state.query=''; search.value=''; }
    render();
  }
});

contextPanel.addEventListener('click', event => {
  const action=event.target.closest('[data-context-action]'); if (action) handleContextAction(action.dataset.contextAction);
});
$$('[data-close-context]').forEach(button => button.addEventListener('click',closeContextMenu));

search.addEventListener('input', () => {
  state.view='search'; state.query=search.value; clearTimeout(searchTimer);
  const query=state.query.trim();
  if (!query) { searchSerial+=1; state.searchIds=[]; state.searchStatus='idle'; render(); return; }
  state.searchStatus='loading'; state.searchIds=[]; render();
  const serial=++searchSerial; searchTimer=setTimeout(()=>searchRemote(query,serial),320);
});

document.addEventListener('keydown', event => {
  if ((event.metaKey||event.ctrlKey) && event.key.toLowerCase()==='k') { event.preventDefault(); state.view='search'; render(); search.focus(); }
  if (event.key==='Escape') { closeContextMenu(); closeDrawer(); closeSettings(); closeFullPlayer(); }
  if (event.code==='Space' && !['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)) { event.preventDefault(); togglePlay(); }
});

$('#playBtn').addEventListener('click',togglePlay);
$('#fullPlayBtn').addEventListener('click',togglePlay);
$('#nextBtn').addEventListener('click',()=>nextTrack(true));
$('#fullNextBtn').addEventListener('click',()=>nextTrack(true));
$('#prevBtn').addEventListener('click',previousTrack);
$('#fullPrevBtn').addEventListener('click',previousTrack);
$('#shuffleBtn').addEventListener('click',()=>setShuffle(!state.shuffle));
$('#fullShuffleBtn').addEventListener('click',()=>setShuffle(!state.shuffle));
$('#autoplayBtn').addEventListener('click',()=>setAutoplay(!state.autoplay));
$('#fullAutoplayBtn').addEventListener('click',()=>setAutoplay(!state.autoplay));
$('#likeCurrentBtn').addEventListener('click',()=>toggleLike());
$('#fullLikeBtn').addEventListener('click',()=>toggleLike());
$('#seek').addEventListener('input',event=>seekFrom(event.currentTarget));
$('#fullSeek').addEventListener('input',event=>seekFrom(event.currentTarget));
$('#volume').addEventListener('input',event=>{ audio.volume=Number(event.target.value); if (audio.volume>0) lastAudibleVolume=audio.volume; setRangeProgress(event.target,audio.volume); persist(); });
$('#muteBtn').addEventListener('click',()=>{ if (audio.volume>0) { lastAudibleVolume=audio.volume; audio.volume=0; } else audio.volume=lastAudibleVolume; $('#volume').value=String(audio.volume); setRangeProgress($('#volume'),audio.volume); $('#muteBtn i').className=`ph ${audio.volume?'ph-speaker-high':'ph-speaker-slash'}`; });
$('#playerQueueBtn').addEventListener('click',openDrawer);
$('#nowQueueBtn').addEventListener('click',()=>{ closeFullPlayer(); openDrawer(); });
$('#fullscreenBtn').addEventListener('click',openFullPlayer);
$('#openNowPlaying').addEventListener('click',openFullPlayer);
$('#closeNowPlaying').addEventListener('click',closeFullPlayer);
$('#settingsBtn').addEventListener('click',openSettings);
$('#profileButton').addEventListener('click',openSettings);
$$('[data-close-drawer]').forEach(button=>button.addEventListener('click',closeDrawer));
$$('[data-close-modal]').forEach(button=>button.addEventListener('click',closeSettings));
[$('#drawerAutoplay'),$('#settingsAutoplay')].forEach(button=>button.addEventListener('click',()=>setAutoplay(!state.autoplay)));

$('#queueList').addEventListener('click', event => {
  const row=event.target.closest('[data-queue-index]');
  if (row) { const index=Number(row.dataset.queueIndex); const id=state.queue[index]; return id===state.currentId?togglePlay():playTrack(id,{keepQueue:true}); }
  const remove=event.target.closest('[data-remove-queue]');
  if (remove) { const index=Number(remove.dataset.removeQueue); if (index===state.queueIndex) return showToast('The current track cannot be removed'); state.queue.splice(index,1); if (index<state.queueIndex) state.queueIndex-=1; persist(); renderQueue(); }
});

audio.addEventListener('play',()=>{ state.playIntent=true; setPlaying(true); });
audio.addEventListener('playing',()=>setPlaying(true));
audio.addEventListener('pause',()=>{ setPlaying(false); persist(); });
audio.addEventListener('ended',()=>nextTrack(false));
audio.addEventListener('timeupdate',syncTime);
audio.addEventListener('durationchange',syncTime);
audio.addEventListener('waiting',()=>$('#miniPlayer').classList.add('is-buffering'));
audio.addEventListener('canplay',()=>$('#miniPlayer').classList.remove('is-buffering'));
audio.addEventListener('error',()=>{ if (state.playIntent && currentTrack()) recoverStream(currentTrack()); });

document.addEventListener('visibilitychange',()=>{ persist(); if (!document.hidden) { syncPlaybackUI(); syncTime(); } });
window.addEventListener('pagehide',persist);
window.addEventListener('pageshow',event=>{ if (event.persisted) { syncPlayerMeta(); syncPlaybackUI(); syncTime(); } });
window.addEventListener('online',()=>{ showToast('Back online'); if (state.sourceStatus==='offline') loadHome(); });
window.addEventListener('offline',()=>showToast('Offline — saved music remains available'));

configureMediaSession();
detectBackgroundPlayback();
setAutoplay(state.autoplay);
setShuffle(state.shuffle);
setRangeProgress($('#volume'),audio.volume);
syncPlayerMeta();
syncPlaybackUI();
syncTime();
renderQueue();
render();

if (currentTrack() && !PREVIEW_MODE) {
  setAudioSource(currentTrack(),Number(restoredPlayback?.position || 0));
  updateMediaSession(currentTrack());
}
loadHome();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
