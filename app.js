/* Slovenčina s Annou — personal Slovak practice app.
 * Plain JS, no build step. Content lives in data/units/*.js, progress in localStorage. */
(function () {
  'use strict';

  // ---------- constants ----------
  const DAY = 86400000;
  const STORE_KEY = 'slovak-anna-v1';
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32]; // days until next review, per box
  const LESSON_QUIZZES = 12;
  const REVIEW_MAX = 20;
  const XP_RIGHT = 2, XP_DONE = 5;
  const SK_KEYS = ['á', 'ä', 'č', 'ď', 'é', 'í', 'ľ', 'ĺ', 'ň', 'ó', 'ô', 'ŕ', 'š', 'ť', 'ú', 'ý', 'ž'];

  // ---------- helpers ----------
  const $app = document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmtDate = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const todayStr = () => fmtDate(new Date());
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const niceDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };
  const alts = (s) => String(s).split(' | ').map((x) => x.trim()).filter(Boolean);
  const norm = (s) => String(s).toLowerCase().replace(/[.,!?;:"“”„'’()…–—\-\/]/g, ' ').replace(/\s+/g, ' ').trim();
  const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  function lev(a, b) {
    const m = a.length, n = b.length; if (Math.abs(m - n) > 1) return 2;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }

  // ---------- content ----------
  const META = window.SK_META || {};
  const UNITS = (window.SK_UNITS || []).slice().sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  const CARDS = new Map();
  const TABLES = new Map();

  UNITS.forEach((u, ui) => {
    u.num = ui + 1;
    u.keys = [];
    (u.items || []).forEach((it) => {
      const o = Array.isArray(it) ? { sk: it[0], en: it[1], note: it[2] } : it;
      const a = alts(o.sk);
      const key = 'w:' + a[0];
      if (CARDS.has(key)) { console.warn('Duplicate item skipped:', key, 'in', u.id); return; }
      CARDS.set(key, { key, kind: 'item', unit: u, sk: a[0], skAlts: a, en: o.en, note: o.note || '', isPhrase: /\s/.test(a[0]) || /[.?!…]$/.test(a[0]) });
      u.keys.push(key);
    });
    (u.grammar || []).forEach((t) => {
      t.unit = u; TABLES.set(t.id, t);
      if (t.drill === false) return;
      t.rows.forEach((r) => {
        const key = 'g:' + t.id + ':' + r[0];
        const a = alts(r[1]);
        CARDS.set(key, { key, kind: 'grammar', unit: u, table: t, label: r[0], sk: a[0], skAlts: a, en: t.title + ' — ' + r[0] });
        u.keys.push(key);
      });
    });
    (u.dialogues || []).forEach((d) => {
      const key = 'd:' + d.q;
      if (CARDS.has(key)) return;
      CARDS.set(key, { key, kind: 'dialogue', unit: u, sk: d.q, en: d.en, answers: d.a });
      u.keys.push(key);
    });
  });
  const ALL_ITEMS = [...CARDS.values()].filter((c) => c.kind === 'item');
  const ALL_DIALOGUES = [...CARDS.values()].filter((c) => c.kind === 'dialogue');

  // ---------- state ----------
  function defaultState() { return { v: 1, cards: {}, xp: 0, days: {}, lessons: 0, settings: { goal: 30, autoplay: true, theme: 'auto' } }; }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.v === 1) { const d = defaultState(); return Object.assign(d, s, { settings: Object.assign(d.settings, s.settings || {}) }); }
    } catch (e) { /* storage blocked or corrupt */ }
    return defaultState();
  }
  let state = load();
  let session = null;      // the lesson in progress
  let view = 'learn';      // current tab
  let unitView = null;     // unit id when viewing a unit page
  let wordsFilter = { q: '', unit: '' };
  let booted = false;
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function applyTheme() {
    const t = state.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  }
  applyTheme();

  // ---------- spaced repetition (Leitner boxes) ----------
  const box = (key) => (state.cards[key] ? state.cards[key].box : 0);
  const isDue = (key) => { const p = state.cards[key]; return !!p && p.due <= Date.now(); };
  function grade(key, ok) {
    const p = state.cards[key] || { box: 0, due: 0, right: 0, wrong: 0 };
    if (ok) { p.box = Math.min(6, p.box + 1); p.right++; p.due = startOfToday() + INTERVALS[p.box] * DAY; }
    else { p.box = p.box >= 3 ? 1 : 0; p.wrong++; p.due = Date.now(); }
    p.last = Date.now();
    state.cards[key] = p;
  }
  function markSeen(key) { if (!state.cards[key]) state.cards[key] = { box: 0, due: Date.now(), right: 0, wrong: 0, last: Date.now() }; }
  const dueKeys = () => Object.keys(state.cards).filter((k) => CARDS.has(k) && isDue(k));
  function unitProgress(u) {
    if (!u.keys.length) return 0;
    let s = 0; u.keys.forEach((k) => { s += Math.min(box(k), 3) / 3; });
    return s / u.keys.length;
  }
  function addXp(n) { state.xp += n; const t = todayStr(); state.days[t] = (state.days[t] || 0) + n; }
  function streak() {
    const d = new Date(); let n = 0;
    if (!state.days[fmtDate(d)]) d.setDate(d.getDate() - 1);
    while (state.days[fmtDate(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const learnedCount = () => ALL_ITEMS.filter((c) => box(c.key) >= 2).length;

  // ---------- audio (device Slovak voice) ----------
  let skVoice = null;
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    const had = !!skVoice;
    skVoice = vs.find((v) => /^sk([-_]|$)/i.test(v.lang)) || null;
    if (booted && had !== !!skVoice && !session) render();
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  const canSpeak = () => !!skVoice;
  function speak(text, rate) {
    if (!skVoice || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/…/g, ''));
      u.voice = skVoice; u.lang = skVoice.lang; u.rate = rate || 0.9;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  const speakBtn = (text, cls) => (canSpeak() ? `<button class="speak ${cls || ''}" data-act="speak" data-text="${esc(text)}" aria-label="Listen">🔊</button>` : '');

  // ---------- answer checking ----------
  function checkTyped(input, answers) {
    const n = norm(input);
    if (!n) return null;
    for (const a of answers) if (n === norm(a)) return { ok: true, level: 'exact', answer: a };
    for (const a of answers) if (strip(n) === strip(norm(a))) return { ok: true, level: 'accent', answer: a, given: input };
    for (const a of answers) { const na = strip(norm(a)); if (na.length >= 5 && lev(strip(n), na) <= 1) return { ok: true, level: 'typo', answer: a, given: input }; }
    return { ok: false, answer: answers[0], given: input };
  }
  function markDiff(given, answer) {
    const g = norm(given).normalize('NFC'), a = norm(answer).normalize('NFC');
    if (g.length !== a.length) return `<b>${esc(answer)}</b>`;
    let out = '';
    for (let i = 0; i < a.length; i++) out += g[i] !== a[i] ? `<mark>${esc(a[i])}</mark>` : esc(a[i]);
    return `<b>${out}</b>`;
  }

  // ---------- question building ----------
  const tokens = (s) => s.replace(/[.,!?…]/g, '').split(/\s+/).filter(Boolean);
  const tileable = (c) => c && c.kind === 'item' && c.isPhrase && tokens(c.sk).length >= 2 && tokens(c.sk).length <= 9 && !/…/.test(c.sk);

  function distractors(card, field, n) {
    const seen = new Set([norm(card[field])]);
    const same = ALL_ITEMS.filter((c) => c.unit === card.unit && c.isPhrase === card.isPhrase && c.key !== card.key);
    const other = ALL_ITEMS.filter((c) => c.unit !== card.unit && c.isPhrase === card.isPhrase);
    const out = [];
    for (const c of shuffle(same).concat(shuffle(other))) {
      const v = c[field]; const k = norm(v);
      if (seen.has(k)) continue; seen.add(k); out.push(v);
      if (out.length >= n) break;
    }
    return out;
  }
  function gramDistractors(card, n) {
    const seen = new Set([norm(card.sk)]);
    const pool = shuffle(card.table.rows.map((r) => alts(r[1])[0]));
    const others = shuffle([...CARDS.values()].filter((c) => c.kind === 'grammar' && c.table !== card.table).map((c) => c.sk));
    const out = [];
    for (const v of pool.concat(others)) { const k = norm(v); if (seen.has(k)) continue; seen.add(k); out.push(v); if (out.length >= n) break; }
    return out;
  }
  function annaDistractors(card, n) {
    const mine = new Set(card.answers.map(norm));
    const pool = shuffle(ALL_DIALOGUES.filter((d) => d !== card).flatMap((d) => d.answers));
    const out = []; const seen = new Set();
    for (const a of pool) { const k = norm(a); if (mine.has(k) || seen.has(k)) continue; seen.add(k); out.push(a); if (out.length >= n) break; }
    return out;
  }
  function extraTokens(card, n) {
    const have = new Set(tokens(card.sk).map(norm));
    const pool = shuffle(ALL_ITEMS.filter((c) => c.isPhrase && c !== card).flatMap((c) => tokens(c.sk)));
    const out = [];
    for (const w of pool) { const k = norm(w); if (have.has(k)) continue; have.add(k); out.push(w); if (out.length >= n) break; }
    return out;
  }

  function pickType(card, easy) {
    if (card.kind === 'dialogue') return 'anna';
    const b = box(card.key);
    if (card.kind === 'grammar') return !easy && b >= 2 && Math.random() < 0.6 ? 'g_type' : 'g_mc';
    if (easy) return 'mc_sk_en';
    let choices;
    if (b <= 1) choices = ['mc_sk_en', 'mc_en_sk', 'mc_sk_en'].concat(canSpeak() ? ['listen'] : []);
    else if (b === 2) choices = ['mc_en_sk', tileable(card) ? 'tiles' : 'type', 'type'].concat(canSpeak() ? ['listen'] : []);
    else choices = ['type', 'type', tileable(card) ? 'tiles' : 'mc_en_sk', 'mc_sk_en'];
    return rnd(choices);
  }

  function prepare(entry) {
    const card = entry.key ? CARDS.get(entry.key) : null;
    let type = entry.type || pickType(card, entry.easy);
    if (type === 'listen' && !canSpeak()) type = 'mc_sk_en';
    if (type === 'tiles' && !tileable(card)) type = 'type';
    const q = { entry, card, type, fb: null, picked: null };
    if (type === 'mc_sk_en' || type === 'listen') { q.answer = card.en; q.options = shuffle([card.en].concat(distractors(card, 'en', 3))); }
    if (type === 'mc_en_sk') { q.answer = card.sk; q.options = shuffle([card.sk].concat(distractors(card, 'sk', 3))); }
    if (type === 'g_mc') { q.answer = card.sk; q.options = shuffle([card.sk].concat(gramDistractors(card, 3))); }
    if (type === 'anna') { q.answer = rnd(card.answers); q.options = shuffle([q.answer].concat(annaDistractors(card, 3))); }
    if (type === 'tiles') { q.bank = shuffle(tokens(card.sk).concat(extraTokens(card, 2))).map((w, i) => ({ w, i, used: false })); q.built = []; }
    if (type === 'table') q.table = TABLES.get(entry.table);
    return q;
  }

  // ---------- sessions ----------
  const priority = (k) => { const p = state.cards[k]; return (p.due <= Date.now() ? 0 : 1e13) + p.box * 1e12 + (p.last || 0) / 1000; };

  function buildUnitLesson(u) {
    const cards = u.keys.map((k) => CARDS.get(k));
    const newItems = cards.filter((c) => c.kind === 'item' && !state.cards[c.key]).slice(0, 5);
    const unseenGram = cards.filter((c) => c.kind === 'grammar' && !state.cards[c.key]);
    const table = unseenGram.length ? unseenGram[0].table : null;
    const newGram = table ? unseenGram.filter((c) => c.table === table).slice(0, 4) : [];
    const newDia = cards.filter((c) => c.kind === 'dialogue' && !state.cards[c.key]).slice(0, 1);
    const seen = u.keys.filter((k) => state.cards[k]).sort((a, b) => priority(a) - priority(b));

    const q = [];
    newItems.forEach((c, i) => {
      q.push({ key: c.key, type: 'intro' });
      if (i > 0) q.push({ key: newItems[i - 1].key, type: 'mc_sk_en' });
    });
    if (newItems.length) q.push({ key: newItems[newItems.length - 1].key, type: 'mc_sk_en' });

    const block = [];
    if (table) { block.push({ type: 'table', table: table.id }); newGram.forEach((c) => block.push({ key: c.key, type: 'g_mc' })); }
    let quizCount = newItems.length + newGram.length + newDia.length;
    const mixed = newItems.map((c) => ({ key: c.key, type: tileable(c) ? 'tiles' : 'mc_en_sk' }));
    quizCount += mixed.length;
    newDia.forEach((c) => mixed.push({ key: c.key }));
    const fill = Math.max(newItems.length || table || newDia.length ? 3 : LESSON_QUIZZES, LESSON_QUIZZES - quizCount);
    seen.slice(0, fill).forEach((k) => mixed.push({ key: k }));
    return q.concat(block, shuffle(mixed));
  }

  function startSession(title, queue, opts) {
    if (!queue.length) { toast('Nothing to practice here yet.'); return; }
    session = { title, queue, i: 0, graded: new Set(), right: 0, total: 0, mistakes: [], unitId: opts && opts.unitId, note: opts && opts.note, done: false };
    session.cur = prepare(queue[0]);
    render();
    autoSpeak();
  }
  function startUnit(u) { startSession(u.title, buildUnitLesson(u), { unitId: u.id }); }
  function startReview() {
    let keys = dueKeys().sort((a, b) => state.cards[a].due - state.cards[b].due).slice(0, REVIEW_MAX);
    let note = '';
    if (!keys.length) {
      keys = Object.keys(state.cards).filter((k) => CARDS.has(k)).sort((a, b) => priority(a) - priority(b)).slice(0, LESSON_QUIZZES);
      note = 'Nothing was due, so this round practices your weakest words.';
    }
    if (!keys.length) { toast('Start with Unit 1 first — then reviews will appear here.'); return; }
    startSession('Review', shuffle(keys).map((k) => ({ key: k })), { note });
  }
  function startAnna() {
    const ds = shuffle(ALL_DIALOGUES).slice(0, 8);
    startSession('Anna asks', ds.map((c) => ({ key: c.key, type: 'anna' })));
  }
  function startWeak() {
    const keys = Object.keys(state.cards).filter((k) => CARDS.has(k) && state.cards[k].wrong > 0)
      .sort((a, b) => (state.cards[b].wrong - state.cards[b].right) - (state.cards[a].wrong - state.cards[a].right)).slice(0, LESSON_QUIZZES);
    if (!keys.length) { toast('No mistakes yet — nice!'); return; }
    startSession('Tricky words', shuffle(keys).map((k) => ({ key: k })));
  }

  function answer(result) {
    const q = session.cur;
    const card = q.card;
    q.fb = result;
    if (card) {
      const first = !session.graded.has(card.key) && !q.entry.retry;
      if (first) {
        session.graded.add(card.key); session.total++;
        grade(card.key, result.ok);
        if (result.ok) session.right++;
      } else if (!result.ok) grade(card.key, false);
      if (!result.ok) {
        if (!session.mistakes.includes(card)) session.mistakes.push(card);
        if (!q.entry.retry) session.queue.push({ key: card.key, easy: true, retry: true });
      }
      save();
    }
    render();
    if (card && card.kind === 'item' && (q.type === 'mc_en_sk' || q.type === 'type' || q.type === 'tiles')) setTimeout(() => state.settings.autoplay && speak(card.sk), 120);
  }

  function next() {
    session.i++;
    if (session.i >= session.queue.length) return finish();
    session.cur = prepare(session.queue[session.i]);
    render();
    autoSpeak();
  }
  function autoSpeak() {
    if (!session || session.done || !state.settings.autoplay) return;
    const q = session.cur; if (!q || !q.card) return;
    if (['intro', 'mc_sk_en', 'listen', 'anna'].includes(q.type)) setTimeout(() => speak(q.card.sk), 200);
  }
  function finish() {
    const before = state.days[todayStr()] || 0;
    session.xp = session.right * XP_RIGHT + XP_DONE;
    addXp(session.xp);
    state.lessons++;
    session.goalHit = before < state.settings.goal && before + session.xp >= state.settings.goal;
    session.done = true;
    save();
    render();
  }
  function quit() {
    if (session && !session.done && session.i > 0 && !confirm('Quit this lesson? Answers so far are saved.')) return;
    session = null;
    render();
  }

  // ---------- rendering: shell ----------
  function render() {
    if (session) { $app.innerHTML = session.done ? renderDone() : renderLesson(); focusInput(); return; }
    const due = dueKeys().length;
    let body = '';
    if (view === 'learn') body = unitView ? renderUnit(UNITS.find((u) => u.id === unitView)) : renderLearn(due);
    if (view === 'grammar') body = renderGrammar();
    if (view === 'words') body = renderWords();
    if (view === 'me') body = renderMe(due);
    $app.innerHTML = `
      <header class="topbar">
        <div class="brand">Slovenčina <span>s Annou</span></div>
        <div class="stats"><span class="chip" title="Day streak">🔥 ${streak()}</span><span class="chip" title="Total XP">⭐ ${state.xp}</span></div>
      </header>
      <main class="main">${body}</main>
      <nav class="tabbar"><div class="tabbar-inner">
        ${tab('learn', '🏠', 'Learn')}${tab('grammar', '📘', 'Grammar')}${tab('words', '🔤', 'Words')}${tab('me', '👤', 'Me')}
      </div></nav>`;
  }
  const tab = (id, ico, label) => `<button class="tab ${view === id ? 'active' : ''}" data-act="tab" data-tab="${id}"><span class="ico">${ico}</span>${label}</button>`;

  function renderLearn(due) {
    const t = state.days[todayStr()] || 0, goal = state.settings.goal;
    const nextUnit = UNITS.find((u) => u.keys.some((k) => !state.cards[k]));
    const started = Object.keys(state.cards).length > 0;
    return `
      <section class="card hero">
        <div class="row between"><b>Today</b><span class="muted small">${Math.min(t, goal)} / ${goal} XP</span></div>
        <div class="goal"><div style="width:${Math.min(100, (t / goal) * 100)}%"></div></div>
        ${started
          ? `<button class="btn block" data-act="review">🔁 Review before Anna's class${due ? ` · ${due} due` : ''}</button>`
          : `<button class="btn block" data-act="unit-start" data-unit="${UNITS[0].id}">▶ Start with Unit 1</button>`}
        <button class="btn block ghost" data-act="anna">🗣️ Anna asks — practice her questions</button>
      </section>
      <h2>Units</h2>
      <div class="units">
        ${UNITS.map((u) => {
          const p = unitProgress(u);
          return `<button class="unit ${u === nextUnit ? 'next' : ''}" data-act="unit" data-unit="${u.id}">
            <span class="badge ${p >= 0.999 ? 'done' : ''}">${u.icon || '📗'}<span class="num">${u.num}</span></span>
            <span class="info"><span class="title">${esc(u.title)}</span>
              <span class="muted small">${u.keys.length} cards${u === nextUnit ? ' · next up' : ''}</span>
              <div class="bar"><div style="width:${Math.round(p * 100)}%"></div></div></span>
          </button>`;
        }).join('')}
      </div>
      <p class="muted small" style="text-align:center;margin-top:20px">Lessons with Anna up to ${esc(niceDate(META.lastImported || todayStr()))}</p>`;
  }

  function renderUnit(u) {
    if (!u) { unitView = null; return renderLearn(dueKeys().length); }
    const items = u.keys.map((k) => CARDS.get(k)).filter((c) => c.kind === 'item');
    const p = unitProgress(u);
    return `
      <button class="linkbtn" data-act="back">← All units</button>
      <section class="card stack" style="margin-top:12px">
        <div class="row"><span style="font-size:2rem">${u.icon || '📗'}</span><div><div class="muted small">Unit ${u.num}</div><h3>${esc(u.title)}</h3></div></div>
        <div class="bar"><div style="width:${Math.round(p * 100)}%"></div></div>
        <div class="muted small">From classes on ${(u.lessonDates || []).map(niceDate).join(', ')}</div>
        <button class="btn block" data-act="unit-start" data-unit="${u.id}">${p > 0 ? 'Practice' : 'Start lesson'}</button>
      </section>
      ${u.reading ? `<details class="card reading" style="margin-top:12px"><summary>📖 ${esc(u.reading.title)}</summary><div class="gbody">
        <div class="row" style="align-items:flex-start">${speakBtn(u.reading.sk, 'sm')}<p style="margin:0">${esc(u.reading.sk)}</p></div>
        <details style="margin-top:10px"><summary class="muted small">Show translation</summary><p class="muted">${esc(u.reading.en)}</p></details></div></details>` : ''}
      ${(u.grammar || []).length ? `<h2>Grammar</h2><div class="stack">${u.grammar.map(renderTable).join('')}</div>` : ''}
      <h2>Words & phrases</h2>
      <section class="card">${items.map(renderWordRow).join('')}</section>`;
  }

  function renderTable(t, open) {
    return `<details class="card" ${open ? 'open' : ''}><summary>${esc(t.title)}</summary><div class="gbody">
      ${t.note ? `<div class="muted small" style="margin-bottom:8px">${esc(t.note)}</div>` : ''}
      <table class="gtable">${t.rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(alts(r[1]).join(' / '))}</td></tr>`).join('')}</table>
    </div></details>`;
  }

  function renderGrammar() {
    const pr = META.pronunciation || [];
    return `
      <h2>Pronunciation</h2>
      <details class="card" open><summary>How Slovak letters sound</summary><div class="gbody">
        <table class="gtable">${pr.map((r) => `<tr><td><b style="color:var(--text)">${esc(r[0])}</b></td><td style="font-weight:400">${esc(r[1])}</td></tr>`).join('')}</table>
      </div></details>
      ${UNITS.filter((u) => (u.grammar || []).length).map((u) => `<h2>${u.icon || ''} ${esc(u.title)}</h2><div class="stack">${u.grammar.map((t) => renderTable(t)).join('')}</div>`).join('')}`;
  }

  function renderWordRow(c) {
    const b = box(c.key);
    return `<div class="word">${speakBtn(c.sk, 'sm')}<div class="w"><b>${esc(c.sk)}</b><span class="muted small">${esc(c.en)}</span></div>
      <span class="dots" title="Memory strength">${[1, 2, 3, 4, 5].map((i) => `<i class="${b >= i ? 'on' : ''}"></i>`).join('')}</span></div>`;
  }

  function renderWords() {
    const q = norm(wordsFilter.q);
    const qs = strip(q);
    let list = ALL_ITEMS;
    if (wordsFilter.unit) list = list.filter((c) => c.unit.id === wordsFilter.unit);
    if (q) list = list.filter((c) => strip(norm(c.skAlts.join(' ') + ' ' + c.en)).includes(qs));
    return `
      <h2>Words & phrases</h2>
      <div class="stack">
        <input class="search" id="wsearch" type="search" placeholder="Search Slovak or English…" value="${esc(wordsFilter.q)}" autocomplete="off">
        <select class="search" id="wunit"><option value="">All units</option>${UNITS.map((u) => `<option value="${u.id}" ${wordsFilter.unit === u.id ? 'selected' : ''}>${u.num}. ${esc(u.title)}</option>`).join('')}</select>
        <div class="muted small">${list.length} shown · ${learnedCount()} of ${ALL_ITEMS.length} learned</div>
        <section class="card" id="wlist">${list.map(renderWordRow).join('') || '<p class="muted">No matches.</p>'}</section>
      </div>`;
  }

  function renderMe(due) {
    const s = state.settings;
    return `
      <h2>Your progress</h2>
      <section class="card stack">
        <div class="row between"><span>🔥 Day streak</span><b>${streak()}</b></div>
        <div class="row between"><span>⭐ Total XP</span><b>${state.xp}</b></div>
        <div class="row between"><span>📚 Lessons finished</span><b>${state.lessons}</b></div>
        <div class="row between"><span>✅ Words learned</span><b>${learnedCount()} / ${ALL_ITEMS.length}</b></div>
        <div class="row between"><span>🔁 Due for review</span><b>${due}</b></div>
        <button class="btn ghost block" data-act="weak">🎯 Practice my tricky words</button>
      </section>
      <h2>Settings</h2>
      <section class="card stack">
        <label class="toggle"><span>Daily goal</span>
          <select class="search" style="width:auto" id="sgoal">${[10, 20, 30, 50, 80].map((g) => `<option ${s.goal === g ? 'selected' : ''} value="${g}">${g} XP</option>`).join('')}</select></label>
        <label class="toggle"><span>Play Slovak audio automatically</span><input type="checkbox" id="sauto" ${s.autoplay ? 'checked' : ''}></label>
        <label class="toggle"><span>Theme</span>
          <select class="search" style="width:auto" id="stheme">${['auto', 'light', 'dark'].map((t) => `<option ${s.theme === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <div class="small ${canSpeak() ? '' : 'note'}">${canSpeak()
          ? `🔊 Slovak voice: <b>${esc(skVoice.name)}</b> <button class="linkbtn" data-act="speak" data-text="Ahoj! Ako sa máš?">Test</button>`
          : '🔇 No Slovak voice found on this device, so audio exercises are hidden. On iPhone: Settings → Accessibility → Spoken Content → Voices → Slovak. On Android: install Slovak in Google Text-to-speech. On Windows: Settings → Time & language → Speech → Add voices → Slovak.'}</div>
      </section>
      <h2>Backup</h2>
      <section class="card stack">
        <div class="muted small">Progress is saved in this browser only. Download a backup now and then, or to move to another device.</div>
        <div class="row"><button class="btn small" data-act="export">⬇ Download backup</button>
          <button class="btn small ghost" data-act="import">⬆ Restore backup</button>
          <input type="file" id="importfile" accept="application/json,.json" class="hidden"></div>
        <button class="linkbtn small" style="color:var(--bad);text-align:left" data-act="reset">Reset all progress…</button>
      </section>
      <p class="muted small" style="text-align:center;margin-top:20px">${ALL_ITEMS.length} words & phrases · ${UNITS.length} units · from lessons with ${esc(META.teacher || 'Anna')} up to ${esc(niceDate(META.lastImported || todayStr()))}</p>`;
  }

  // ---------- rendering: lesson ----------
  function renderLesson() {
    const q = session.cur, c = q.card, fb = q.fb;
    const pct = Math.round((session.i / session.queue.length) * 100);
    let label = '', tag = '', body = '';
    const opts = (list, field) => `<div class="options">${list.map((o, i) => {
      let cls = '';
      if (fb) { if (o === q.answer) cls = 'right'; else if (o === q.picked) cls = 'wrong'; }
      return `<button class="opt ${cls}" data-act="pick" data-i="${i}" ${fb ? 'disabled' : ''}><span class="muted small">${i + 1}</span>&nbsp; ${esc(o)}</button>`;
    }).join('')}</div>`;
    const keyboard = `<div class="keys">${SK_KEYS.map((k) => `<button class="key" data-act="key" data-k="${k}" tabindex="-1">${k}</button>`).join('')}</div>`;

    switch (q.type) {
      case 'intro':
        tag = c.isPhrase ? 'New phrase' : 'New word';
        body = `<div class="card flash">${speakBtn(c.sk)}<div class="sk">${esc(c.sk)}</div><div class="en">${esc(c.en)}</div>
          ${c.skAlts.length > 1 ? `<div class="muted small">also: ${esc(c.skAlts.slice(1).join(', '))}</div>` : ''}</div>
          ${c.note ? `<div class="note">💡 ${esc(c.note)}</div>` : ''}`;
        break;
      case 'table':
        tag = 'Grammar';
        body = `<div class="qlabel">${esc(q.table.title)}</div>${q.table.note ? `<div class="muted">${esc(q.table.note)}</div>` : ''}
          <div class="card"><table class="gtable">${q.table.rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(alts(r[1]).join(' / '))}</td></tr>`).join('')}</table></div>`;
        break;
      case 'mc_sk_en':
        label = 'What does this mean?';
        body = `<div class="prompt">${speakBtn(c.sk)}<span class="sk">${esc(c.sk)}</span></div>${opts(q.options)}`;
        break;
      case 'listen':
        label = 'What do you hear?';
        body = `${speakBtn(c.sk, 'big')}${fb ? `<div class="prompt" style="justify-content:center">${esc(c.sk)}</div>` : `<button class="linkbtn small" data-act="cant-listen" style="align-self:center">Can't listen now</button>`}${opts(q.options)}`;
        break;
      case 'mc_en_sk':
        label = 'How do you say this in Slovak?';
        body = `<div class="prompt">${esc(c.en)}</div>${opts(q.options)}`;
        break;
      case 'type':
        label = 'Write this in Slovak';
        body = `<div class="prompt">${esc(c.en)}</div>
          <input class="answer-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" lang="sk" placeholder="Type in Slovak…" ${fb ? 'disabled' : ''} value="${esc(q.typed || '')}">
          ${fb ? '' : keyboard}`;
        break;
      case 'tiles':
        label = 'Build the sentence';
        body = `<div class="prompt">${esc(c.en)}</div>
          <div class="tiles-answer">${q.built.map((bi, pos) => `<button class="tile" data-act="untile" data-pos="${pos}" ${fb ? 'disabled' : ''}>${esc(q.bank[bi].w)}</button>`).join('')}</div>
          <div class="tiles-bank">${q.bank.map((t, bi) => `<button class="tile ${t.used ? 'used' : ''}" data-act="tile" data-bi="${bi}" ${fb ? 'disabled' : ''}>${esc(t.w)}</button>`).join('')}</div>`;
        break;
      case 'g_mc':
      case 'g_type':
        tag = 'Grammar';
        label = esc(c.table.title);
        body = `${c.table.note ? `<div class="muted small">${esc(c.table.note)}</div>` : ''}
          <div class="prompt">${esc(c.label)} → <span style="color:var(--primary)">${fb ? esc(c.sk) : '___'}</span></div>
          ${q.type === 'g_mc' ? opts(q.options) : `<input class="answer-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" lang="sk" placeholder="Type the form…" ${fb ? 'disabled' : ''} value="${esc(q.typed || '')}">${fb ? '' : keyboard}`}`;
        break;
      case 'anna':
        tag = 'Anna asks';
        label = 'Pick a good answer';
        body = `<div class="anna"><div class="avatar">A</div><div class="stack" style="gap:6px"><div class="bubble">${esc(c.sk)}</div>
            <div class="row">${speakBtn(c.sk, 'sm')}${q.showEn || fb ? `<span class="muted">${esc(c.en)}</span>` : `<button class="linkbtn small" data-act="show-en">Show translation</button>`}</div></div></div>
          ${opts(q.options)}`;
        break;
    }

    // footer
    let footer = '';
    if (q.type === 'intro' || q.type === 'table') {
      footer = `<div class="footer"><button class="btn block" data-act="next" id="mainbtn">Got it</button></div>`;
    } else if (!fb) {
      const needsCheck = q.type === 'type' || q.type === 'g_type' || q.type === 'tiles';
      footer = needsCheck ? `<div class="footer"><button class="btn block" data-act="check" id="mainbtn">Check</button></div>` : `<div class="footer"><button class="btn block ghost" data-act="skip">I don't know</button></div>`;
    } else {
      const cls = !fb.ok ? 'bad' : fb.level === 'accent' || fb.level === 'typo' ? 'almost' : 'good';
      let title = fb.ok ? rnd(['Výborne! 🎉', 'Super! ✨', 'Správne! ✅', 'Skvelé! 💪']) : 'Not quite';
      let detail = '';
      if (fb.level === 'accent') { title = 'Almost — watch the accents'; detail = `Correct: ${markDiff(fb.given, fb.answer)}`; }
      else if (fb.level === 'typo') { title = 'Correct, with a small typo'; detail = `Correct: <b>${esc(fb.answer)}</b>`; }
      else if (!fb.ok) detail = `Correct answer: <b>${esc(q.type === 'mc_sk_en' || q.type === 'listen' ? c.en : q.type === 'anna' ? q.answer : c.sk)}</b>`;
      if (c && c.kind === 'item') detail += `<div class="muted small" style="margin-top:4px">${esc(c.sk)} — ${esc(c.en)}</div>`;
      if (c && c.kind === 'dialogue') detail += `<div class="muted small" style="margin-top:4px">Good answers: ${c.answers.map(esc).join(' · ')}</div>`;
      if (c && c.note && !fb.ok) detail += `<div class="small" style="margin-top:4px">💡 ${esc(c.note)}</div>`;
      footer = `<div class="footer ${cls}"><div class="fb-title">${title}</div><div class="fb-body">${detail}</div>
        <button class="btn block ${fb.ok ? 'good' : 'bad'}" data-act="next" id="mainbtn">Continue</button></div>`;
    }

    return `<div class="lesson"><div class="lesson-inner">
      <div class="lesson-top"><button class="xbtn" data-act="quit" aria-label="Close">✕</button><div class="progress"><div style="width:${pct}%"></div></div></div>
      <div class="q">${session.i === 0 && session.note ? `<div class="note">${esc(session.note)}</div>` : ''}
        ${tag ? `<div class="qtag">${tag}</div>` : ''}${label ? `<div class="qlabel">${label}</div>` : ''}${body}</div>
      ${footer}</div></div>`;
  }

  function renderDone() {
    const acc = session.total ? Math.round((session.right / session.total) * 100) : 100;
    const u = session.unitId && UNITS.find((x) => x.id === session.unitId);
    return `<div class="lesson"><div class="lesson-inner"><div class="done-screen">
      <div class="trophy">${acc >= 90 ? '🏆' : acc >= 60 ? '🎉' : '💪'}</div>
      <h2 style="margin:0">${esc(session.title)} complete!</h2>
      <div class="muted">${acc >= 90 ? 'Anna would be proud. Výborne!' : acc >= 60 ? 'Dobre! Keep going.' : 'Tough one — the tricky words will come back soon.'}</div>
      <div class="done-stats"><div class="card"><b>+${session.xp}</b><span class="muted small">XP</span></div><div class="card"><b>${acc}%</b><span class="muted small">correct</span></div></div>
      ${session.goalHit ? `<div class="note">🎯 Daily goal reached!</div>` : ''}
      ${session.mistakes.length ? `<div class="card mistakes"><b>To review</b>${session.mistakes.map((c) => `<div class="word">${speakBtn(c.sk, 'sm')}<div class="w"><b>${esc(c.kind === 'grammar' ? c.label + ' → ' + c.sk : c.sk)}</b><span class="muted small">${esc(c.kind === 'grammar' ? c.table.title : c.en)}</span></div></div>`).join('')}</div>` : ''}
      <div class="stack" style="width:100%">
        ${u ? `<button class="btn block" data-act="unit-start" data-unit="${u.id}">Another round</button>` : ''}
        <button class="btn block ${u ? 'ghost' : ''}" data-act="close-done" id="mainbtn">Continue</button>
      </div>
    </div></div></div>`;
  }

  function focusInput() {
    const el = document.getElementById('ans');
    if (el && !el.disabled) setTimeout(() => el.focus(), 30);
  }

  // ---------- events ----------
  function doCheck() {
    const q = session.cur;
    if (q.fb) return;
    if (q.type === 'type' || q.type === 'g_type') {
      const el = document.getElementById('ans');
      const val = el ? el.value : '';
      q.typed = val;
      const r = checkTyped(val, q.card.skAlts);
      if (!r) { el && el.focus(); return; }
      answer(r);
    } else if (q.type === 'tiles') {
      if (!q.built.length) return;
      const built = q.built.map((bi) => q.bank[bi].w).join(' ');
      const ok = q.card.skAlts.some((a) => norm(a) === norm(built));
      answer({ ok, level: ok ? 'exact' : 'wrong', answer: q.card.sk, given: built });
    }
  }
  function pick(i) {
    const q = session.cur;
    if (q.fb || !q.options) return;
    q.picked = q.options[i];
    if (q.picked === undefined) return;
    answer({ ok: q.picked === q.answer, level: q.picked === q.answer ? 'exact' : 'wrong', answer: q.answer });
  }
  function mainAction() {
    if (!session) return;
    if (session.done) { session = null; render(); return; }
    const q = session.cur;
    if (q.type === 'intro' || q.type === 'table') {
      if (q.type === 'intro') { markSeen(q.card.key); save(); }
      return next();
    }
    if (q.fb) return next();
    doCheck();
  }

  $app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    const q = session && session.cur;
    switch (act) {
      case 'tab': view = t.dataset.tab; unitView = null; render(); window.scrollTo(0, 0); break;
      case 'unit': unitView = t.dataset.unit; render(); window.scrollTo(0, 0); break;
      case 'back': unitView = null; render(); break;
      case 'unit-start': { const u = UNITS.find((x) => x.id === t.dataset.unit); session = null; if (u) startUnit(u); break; }
      case 'review': startReview(); break;
      case 'anna': startAnna(); break;
      case 'weak': startWeak(); break;
      case 'speak': speak(t.dataset.text); break;
      case 'quit': quit(); break;
      case 'next': mainAction(); break;
      case 'check': doCheck(); break;
      case 'skip': answer({ ok: false, level: 'wrong', answer: q.answer }); break;
      case 'pick': pick(Number(t.dataset.i)); break;
      case 'cant-listen': q.type = 'mc_sk_en'; render(); break;
      case 'show-en': q.showEn = true; render(); break;
      case 'key': {
        const el = document.getElementById('ans'); if (!el) break;
        const s = el.selectionStart ?? el.value.length, en = el.selectionEnd ?? el.value.length;
        el.value = el.value.slice(0, s) + t.dataset.k + el.value.slice(en);
        q.typed = el.value; el.focus(); el.setSelectionRange(s + 1, s + 1);
        break;
      }
      case 'tile': { const bi = Number(t.dataset.bi); if (q.bank[bi].used) break; q.bank[bi].used = true; q.built.push(bi); render(); break; }
      case 'untile': { const pos = Number(t.dataset.pos); const bi = q.built[pos]; q.built.splice(pos, 1); q.bank[bi].used = false; render(); break; }
      case 'close-done': session = null; render(); break;
      case 'export': exportProgress(); break;
      case 'import': document.getElementById('importfile').click(); break;
      case 'reset':
        if (confirm('Erase ALL progress (XP, streak, memory of every word)? This cannot be undone.')) { state = defaultState(); save(); applyTheme(); render(); toast('Progress reset.'); }
        break;
    }
  });

  $app.addEventListener('input', (e) => {
    if (e.target.id === 'wsearch') {
      wordsFilter.q = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const el = document.getElementById('wsearch'); el.focus(); try { el.setSelectionRange(pos, pos); } catch (_) { /* ignore */ }
    }
    if (e.target.id === 'ans' && session) session.cur.typed = e.target.value;
  });
  $app.addEventListener('change', (e) => {
    const id = e.target.id;
    if (id === 'wunit') { wordsFilter.unit = e.target.value; render(); }
    if (id === 'sgoal') { state.settings.goal = Number(e.target.value); save(); }
    if (id === 'sauto') { state.settings.autoplay = e.target.checked; save(); }
    if (id === 'stheme') { state.settings.theme = e.target.value; save(); applyTheme(); }
    if (id === 'importfile') importProgress(e.target.files[0]);
  });
  document.addEventListener('keydown', (e) => {
    if (!session) return;
    if (e.key === 'Enter') { e.preventDefault(); mainAction(); return; }
    if (e.key === 'Escape') { quit(); return; }
    const q = session.cur;
    if (q && q.options && !q.fb && /^[1-4]$/.test(e.key) && document.activeElement.tagName !== 'INPUT') pick(Number(e.key) - 1);
  });

  // ---------- backup ----------
  function exportProgress() {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'slovak-progress-' + todayStr() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function importProgress(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const s = JSON.parse(r.result);
        if (!s || s.v !== 1 || typeof s.cards !== 'object') throw new Error('bad file');
        if (!confirm('Replace your current progress with this backup?')) return;
        const d = defaultState();
        state = Object.assign(d, s, { settings: Object.assign(d.settings, s.settings || {}) });
        save(); applyTheme(); render(); toast('Backup restored.');
      } catch (err) { toast('That file is not a valid backup.'); }
    };
    r.readAsText(file);
  }

  let toastTimer = null;
  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  // ---------- boot ----------
  if (!UNITS.length) { $app.innerHTML = '<p style="padding:24px">No lesson data found. Check the data/units/*.js script tags in index.html.</p>'; return; }
  booted = true;
  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  }
})();
