// Leonida Platinum Roadbook v8 — my own tracker build for this entry.
// It loads one local data file (app/data/trophies.json), keeps earned ticks and
// per-trophy counters in localStorage, and never asks the network for anything
// else: no outside fetch, no outside image, no outside font. The spoiler rule
// is deliberately strict — while "Hide story spoilers" is on, an unearned story
// trophy shows nothing of itself anywhere: not its name, not its description,
// not its mission, not its guide. Only "Hidden trophy — covered until earned".
const STORE_KEY = 'gta6-roadbook-v8-progress';
const SPOILER_KEY = 'gta6-roadbook-v8-spoilers';
const COVER_TEXT = 'Hidden trophy — covered until earned';

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailPanel');
const listMetaEl = document.getElementById('listMeta');

let trophies = [];
let earned = new Set();
let counts = {};
let spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
let selectedId = null;
let currentTab = 'trophies';

const filters = { q: '', grade: 'all', kind: 'all', status: 'all', missableOnly: false };

function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    earned = new Set(raw.earned || []);
    counts = raw.counts || {};
  } catch (e) { earned = new Set(); counts = {}; }
}
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned], counts }));
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}
function isStory(t) { return t.kind === 'story'; }
function isCovered(t) { return spoilerOn && isStory(t) && !earned.has(t.id); }
function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function visibleTrophies() {
  const q = filters.q.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.status === 'earned' && !earned.has(t.id)) return false;
    if (filters.status === 'unearned' && earned.has(t.id)) return false;
    if (filters.missableOnly && !t.missable) return false;
    if (q) {
      if (isCovered(t)) return 'hidden trophy'.includes(q);
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (t.steps || []).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderStats() {
  const total = trophies.length || 55;
  const n = earned.size;
  const pct = total ? Math.round((n / total) * 100) : 0;
  document.getElementById('statPct').textContent = pct + '%';
  document.getElementById('statEarned').textContent = n + ' of ' + total + ' earned';
  const byGrade = {};
  for (const t of trophies) byGrade[t.grade] = (byGrade[t.grade] || 0) + (earned.has(t.id) ? 1 : 0);
  document.getElementById('statGrades').textContent =
    'Platinum ' + (byGrade.platinum || 0) + '/1 · Gold ' + (byGrade.gold || 0) + '/2 · Silver ' +
    (byGrade.silver || 0) + '/6 · Bronze ' + (byGrade.bronze || 0) + '/46';
  const missLeft = trophies.filter((t) => t.missable && !earned.has(t.id)).length;
  document.getElementById('statMiss').textContent = 'Missables left: ' + missLeft;
  const next = nextUp();
  document.getElementById('statNext').textContent = next
    ? 'Next up: ' + (isCovered(next) ? 'a covered story trophy' : next.name)
    : 'Next up: platinum earned';
}

function nextUp() {
  const open = trophies.filter((t) => !earned.has(t.id));
  open.sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return open[0] || null;
}

function renderList() {
  const shown = visibleTrophies();
  listMetaEl.textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies';
  listEl.replaceChildren();
  for (const t of shown) {
    const li = el('li');
    if (earned.has(t.id)) li.classList.add('earned');
    if (selectedId === t.id) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark trophy earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); renderAll();
    });
    li.append(box);
    const body = el('div');
    const covered = isCovered(t);
    const name = el('div', 'trophy-name', covered ? COVER_TEXT : t.name);
    if (covered) name.classList.add('covered');
    body.append(name);
    if (!covered) body.append(el('div', 'trophy-desc', t.description));
    const meta = el('div', 'trophy-meta');
    const g = el('span', 'grade grade-' + t.grade, gradeLabel(t.grade));
    meta.append(g, ' ');
    meta.append(el('span', 'kind-tag', t.kind));
    if (t.missable) meta.append(el('span', 'miss-flag', '  Missable — read the warning'));
    if (t.hidden) meta.append(document.createTextNode('  · Hidden'));
    if (t.count) meta.append(document.createTextNode('  · ' + (counts[t.id] || 0) + '/' + t.count.target + ' ' + t.count.unit));
    body.append(meta);
    li.append(body);
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      selectedId = t.id;
      renderList(); renderDetail();
    });
    listEl.append(li);
  }
  if (!shown.length) listEl.append(el('li', 'covered', 'No trophies match these filters.'));
}

function counterRow(t) {
  const row = el('div', 'counter');
  const minus = el('button', '', '−');
  minus.type = 'button';
  minus.addEventListener('click', () => {
    counts[t.id] = Math.max(0, (counts[t.id] || 0) - 1);
    save(); renderAll();
  });
  const plus = el('button', '', '+');
  plus.type = 'button';
  plus.addEventListener('click', () => {
    counts[t.id] = Math.min(t.count.target, (counts[t.id] || 0) + 1);
    save(); renderAll();
  });
  row.append(minus, el('span', '', (counts[t.id] || 0) + ' / ' + t.count.target + ' ' + t.count.unit), plus);
  return row;
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId) || trophies[0];
  if (!t) { detailEl.replaceChildren(el('p', 'covered', 'Loading trophies…')); return; }
  detailEl.replaceChildren();
  const covered = isCovered(t);
  detailEl.append(el('h2', '', covered ? COVER_TEXT : t.name));
  const meta = el('p', 'trophy-meta');
  meta.append(el('span', 'grade grade-' + t.grade, gradeLabel(t.grade)), ' ');
  meta.append(el('span', 'kind-tag', t.kind));
  meta.append(document.createTextNode('  · Roadmap stage ' + t.stage + (t.missable ? '  · Missable' : '')));
  detailEl.append(meta);
  if (covered) {
    detailEl.append(el('p', 'covered', 'This is a story trophy you have not earned yet. Turn "Hide story spoilers" off, or earn it in the game, to see its name, description and guide.'));
    return;
  }
  detailEl.append(el('p', 'official', 'Official description: ' + t.description));
  const earnBtn = el('button', '', earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned');
  earnBtn.type = 'button';
  earnBtn.style.cssText = 'padding:8px 12px;border-radius:7px;border:1px solid #f2b134;background:#f2b134;color:#241a05;font-weight:700;cursor:pointer;';
  earnBtn.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    save(); renderAll();
  });
  detailEl.append(earnBtn);
  if (t.count) {
    detailEl.append(el('h3', '', 'Progress counter'));
    detailEl.append(counterRow(t));
  }
  if (t.unconfirmed) {
    detailEl.append(el('p', 'unconfirmed', 'UNCONFIRMED — no guide has pinned this down yet. Nothing below invents a method for it.'));
  }
  detailEl.append(el('h3', '', 'How to get it'));
  detailEl.append(el('p', '', t.guide));
  if (t.steps && t.steps.length) {
    const ol = el('ol', 'steps');
    for (const s of t.steps) ol.append(el('li', '', s));
    detailEl.append(ol);
  }
  detailEl.append(el('h3', '', 'Can it be missed?'));
  detailEl.append(el('p', '', t.missed || 'Cannot be missed.'));
  if (t.honesty) detailEl.append(el('p', 'honesty', 'Honesty note: ' + t.honesty));
  if (t.sources && t.sources.length) {
    detailEl.append(el('h3', '', 'Sources — per claim'));
    const ul = el('ul', 'sources');
    for (const s of t.sources) {
      const li = el('li');
      li.append(el('span', '', s.fact + ' — '));
      li.append(el('span', 'src-name', s.source));
      li.append(el('span', 'src-role', s.role));
      ul.append(li);
    }
    detailEl.append(ul);
  }
}

function chapterRow(ch, spoiler) {
  const card = el('div', 'step-card');
  card.append(el('h3', '', 'Chapter ' + ch.n + ' — ' + ch.hours));
  const names = ch.trophies.filter((id) => {
    const t = trophies.find((x) => x.id === id);
    return t && !(spoiler && isStory(t) && !earned.has(t.id));
  });
  const hiddenCount = ch.trophies.length - names.length;
  const line = names.map((id) => trophies.find((x) => x.id === id).name).join(' · ');
  card.append(el('p', '', ch.text));
  card.append(el('p', '', 'Trophies here: ' + (line || '—') + (hiddenCount ? ' · plus ' + hiddenCount + ' covered story trophy' + (hiddenCount > 1 ? 'ies' : '') + ' (hidden until earned)' : '')));
  return card;
}

function renderRoadmap() {
  const v = document.getElementById('roadmapView');
  v.replaceChildren();
  v.append(el('h2', '', 'Roadmap to the platinum — about 200 hours'));
  v.append(el('p', '', 'Time estimate: about 200 hours (PowerPyx), up to 300+ hours (Push Square). One playthrough is enough, there is no difficulty setting and no New Game+. Cheats switch trophies and saving off, so leave them alone. Keep a manual save at the start and end of every chapter — there are 15 manual slots plus one autosave (PowerPyx).'));
  const s1 = el('div', 'step-card');
  s1.append(el('h3', '', 'Step 1 — Play the story (60–80 hours)'));
  s1.append(el('p', '', 'Play Chapters 1 to 5 in order and let the story trophies land as you go. The one thing to do early: the first meditation spot only opens in Chapter 1 — miss it and the Positive Mental Attitude trophy is gone for this playthrough. Everything else story-related can be finished later in free roam.'));
  v.append(s1);
  const chapters = [
    { n: 1, hours: 'opening', text: 'Learn the two leads, the controls and the map. Do the Chapter 1 meditation the morning after the first chapter mission, while you still can.', trophies: [2, 3] },
    { n: 2, hours: 'early story', text: 'The map opens up. Stranger missions start appearing; take them when you see them, they come back in free roam if a giver is busy during the story.', trophies: [4, 8] },
    { n: 3, hours: 'mid story', text: 'Vice City proper. Keep an eye on the 100% checklist as you pass things — vehicles, animals and weapons you scan or pick up now count later.', trophies: [5, 9] },
    { n: 4, hours: 'late story', text: 'The longest chapter. Several story trophies land here, and the final mission of the chapter closes it out.', trophies: [6, 10, 11, 12] },
    { n: 5, hours: 'finale', text: 'The last chapter and the final mission. After the credits, the whole map stays open for cleanup.', trophies: [7, 13] },
  ];
  for (const ch of chapters) v.append(chapterRow(ch, spoilerOn));
  const s2 = el('div', 'step-card');
  s2.append(el('h3', '', 'Step 2 — The 100% checklist (about 100 hours)'));
  s2.append(el('p', '', 'Open Progress, then Stats, then 100% Completion. It is not a true 100% — PowerPyx puts it nearer 60% of everything in the game. The checklist asks for: 200 of 277 base vehicle models (scan them with the WAiNK app), 100 of 255 animals (study them with binoculars), 50 of 66 weapons, 70 of 80 challenges, 100 optional missions, every robbery type, every underwater discovery, every shooting range, every drone race, every Bret quest, and 15 of 18 collectible card sets. Track each count in this guide as you go.'));
  v.append(s2);
  const s3 = el('div', 'step-card');
  s3.append(el('h3', '', 'Step 3 — Strangers and cleanup (about 10 hours)'));
  s3.append(el('p', '', 'Finish 8 of the 14 stranger mission strands (PowerPyx counts 14 in the game, so you can pick the ones you like), then sweep whatever counters are left: stunts to 250, WAiNK spots to 100, vehicles discovered to 100, races won to 20, and the money trophies. The platinum pops when the last of the other 54 does.'));
  v.append(s3);
  v.append(el('p', 'honesty', 'Sources for this roadmap: the hour counts and chapter plan come from the PowerPyx GTA 6 Trophy Guide and Roadmap and the Push Square GTA 6 Trophy Guide and Roadmap; the 100% checklist detail comes from the PowerPyx 100% Completion Checklist and Guide. The chapter-by-chapter trophy order is built from the official descriptions.'));
}

function renderMissables() {
  const v = document.getElementById('missablesView');
  v.replaceChildren();
  v.append(el('h2', '', 'Missables — only one trophy can truly be missed'));
  const pma = trophies.find((t) => t.id === 28);
  const card = el('div', 'step-card');
  card.append(el('h3', '', 'Positive Mental Attitude — the only missable trophy'));
  if (pma) {
    card.append(el('p', '', pma.guide));
    card.append(el('p', 'warn', 'WARNING: the first meditation spot exists only in Chapter 1, at Jason\u2019s home. The morning after the first chapter mission, talk to Lucia in the kitchen — she says she is going to meditate — follow her to the balcony and choose to accept. That first meditation adds +1 to the counter but is not marked as a "Meditation Spot", and it is not settled whether it is required; do it anyway, it costs nothing. The last spot only opens after the Chapter 2 mission "Coffee Break", when both characters are playable. 18 meditations across 10 spots (PowerPyx); 15 of 18 is enough for 100%.'));
    card.append(el('p', '', 'Sources: the 18 meditations / 10 spots and the Chapter 1 detail come from the PowerPyx All Meditation Spot Locations guide; the "zen" finish animation and the tracking screens come from the Push Square trophy guide.'));
  }
  v.append(card);
  v.append(el('h3', '', 'Everything else — cannot be missed'));
  v.append(el('p', '', 'Every other trophy can be finished after the story in free roam: story trophies pop as the missions are played; activities, races, robberies and collectibles stay open; stranger mission givers who are busy during the story come back afterwards (PowerPyx). Optional missions marked with a black icon and pink letter can disappear, but there are far more than the 100 the checklist needs, so losing a few changes nothing. One permanent trap: the Irredeemable profile is forever — avoid it (PowerPyx).'));
  const table = el('table', 'plain');
  const head = el('tr');
  head.append(el('th', '', 'Group'), el('th', '', 'Why it cannot be missed'));
  table.append(head);
  const rows = [
    ['Story (12 trophies)', 'Each pops when its mission or chapter is finished; missions cannot be skipped past.'],
    ['Strangers (6 trophies)', 'Givers return in free roam; 8 of 14 strands is enough for the silver.'],
    ['Collectibles', 'Cards, WAiNK spots and meditations (after Chapter 1) stay on the map.'],
    ['Activities & races', 'Ranges, drone races and races can be replayed as often as you like.'],
    ['Money & robbery', 'Shops, vaults, trucks and garages stay available after the story.'],
    ['Combat & exploration', 'Wanted levels, Combat Focus and the whole map stay open.'],
  ];
  for (const [a, b] of rows) {
    const tr = el('tr');
    tr.append(el('td', '', a), el('td', '', b));
    table.append(tr);
  }
  v.append(table);
}

function renderNextUp() {
  const v = document.getElementById('nextupView');
  v.replaceChildren();
  v.append(el('h2', '', 'Next up'));
  const t = nextUp();
  if (!t) {
    v.append(el('p', '', 'Every trophy is earned. The platinum is yours — congratulations, Leonida Legend.'));
    return;
  }
  if (isCovered(t)) {
    v.append(el('p', 'covered', COVER_TEXT + ' — your next trophy is a story trophy. Play the next story mission to reveal it.'));
    return;
  }
  v.append(el('p', '', 'Your closest trophy by roadmap stage is:'));
  const card = el('div', 'step-card');
  card.append(el('h3', '', t.name + ' — ' + gradeLabel(t.grade)));
  card.append(el('p', 'official', t.description));
  card.append(el('p', '', t.guide));
  if (t.count) card.append(el('p', '', 'Counter: ' + (counts[t.id] || 0) + ' / ' + t.count.target + ' ' + t.count.unit + '.'));
  card.append(el('p', '', t.missed || ''));
  v.append(card);
  const btn = el('button', '', 'Open it in the trophy list');
  btn.type = 'button';
  btn.style.cssText = 'padding:9px 14px;border-radius:7px;border:1px solid #f2b134;background:#f2b134;color:#241a05;font-weight:700;cursor:pointer;';
  btn.addEventListener('click', () => { selectedId = t.id; switchTab('trophies'); });
  v.append(btn);
}

const SOURCE_LIST = [
  { name: 'Exophase — Grand Theft Auto VI trophy list', role: 'The official PlayStation list as published: every name, description and grade in this guide comes from it.', url: 'www.exophase.com/game/grand-theft-auto-vi-psn/trophies/' },
  { name: 'PSNProfiles — Grand Theft Auto VI trophies', role: 'The PSN trophy targets PlayStation tracks: the counts of 42 shooting range challenges and 100 vehicles and 100 WAiNK locations.', url: 'psnprofiles.com/trophies/43531-grand-theft-auto-vi' },
  { name: 'PowerPyx — GTA 6 Trophy Guide & Roadmap', role: 'Step-by-step trophy methods, the roadmap hours, the 100% checklist and the missable warning.', url: 'www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/' },
  { name: 'PowerPyx — All Meditation Spot Locations', role: 'The 18 meditations across 10 spots and the Chapter 1-only first spot.', url: 'www.powerpyx.com/gta-6-all-meditation-spot-locations/' },
  { name: 'Push Square — GTA 6 Trophy Guide & Roadmap', role: 'Garage prices, the WAiNK breakdown, the 200–300 hour range and the 100% checklist cross-check.', url: 'www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap' },
  { name: 'KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap', role: 'All 55 trophies in one place; the 42 drone time trials and the still-unconfirmed methods.', url: 'www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/' },
  { name: 'GTABase / TrueTrophies', role: 'Cross-checks that the 55 names, descriptions and grades match the official list.', url: 'Names checked against the official list; no step in this guide is copied from them.' },
];

function renderSources() {
  const v = document.getElementById('sourcesView');
  v.replaceChildren();
  v.append(el('h2', '', 'Sources'));
  v.append(el('p', '', 'Every guide in this entry is written in its own words. The facts underneath it are tied to a named source inside each trophy\u2019s detail panel — name, description and grade to the PlayStation list on Exophase; counts to the PSN trophy targets on PSNProfiles; steps to the named guide that published them. Steps worked out from the official description alone are labelled as own advice, not yet checked in the game.'));
  const ul = el('ul', 'src-list');
  for (const s of SOURCE_LIST) {
    const li = el('li');
    li.append(el('div', 'src-name', s.name));
    li.append(el('div', '', s.role));
    li.append(el('div', 'url', s.url));
    ul.append(li);
  }
  v.append(ul);
}

function renderAll() {
  renderStats();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
  renderNextUp();
  renderSources();
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach((s) => s.classList.toggle('active', s.id === 'view-' + tab));
  if (tab === 'trophies') renderList();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ earned: [...earned], counts }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-roadbook-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function seedDemo() {
  earned = new Set([2, 3, 8, 16, 19, 21, 29, 33, 35, 42, 44, 46, 53]);
  counts = { 15: 61, 17: 12, 18: 5, 28: 3, 30: 1, 31: 24, 32: 11, 35: 47, 52: 62000, 53: 21400 };
  save();
  renderAll();
}

async function init() {
  loadSaved();
  const res = await fetch('data/trophies.json');
  const doc = await res.json();
  trophies = doc.trophies;
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') seedDemo();
  if (params.get('spoiler') === 'on') spoilerOn = true;
  if (params.get('spoiler') === 'off') spoilerOn = false;
  if (params.get('select')) {
    const id = Number(params.get('select'));
    if (trophies.some((t) => t.id === id)) selectedId = id;
  }
  if (params.get('tab')) switchTab(params.get('tab'));
  document.getElementById('spoilerToggle').checked = spoilerOn;
  document.getElementById('search').addEventListener('input', (e) => { filters.q = e.target.value; renderList(); });
  document.getElementById('gradeFilter').addEventListener('change', (e) => { filters.grade = e.target.value; renderList(); });
  document.getElementById('kindFilter').addEventListener('change', (e) => { filters.kind = e.target.value; renderList(); });
  document.getElementById('statusFilter').addEventListener('change', (e) => { filters.status = e.target.value; renderList(); });
  document.getElementById('missableOnly').addEventListener('change', (e) => { filters.missableOnly = e.target.checked; renderList(); });
  document.getElementById('spoilerToggle').addEventListener('change', (e) => {
    spoilerOn = e.target.checked;
    save(); renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      earned = new Set(data.earned || []);
      counts = data.counts || {};
      save(); renderAll();
    } catch (err) { alert('That file is not a progress export from this guide.'); }
  });
  document.getElementById('demoBtn').addEventListener('click', seedDemo);
  document.getElementById('resetBtn').addEventListener('click', () => {
    earned = new Set(); counts = {}; save(); renderAll();
  });
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  renderAll();
}

init();
