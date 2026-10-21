'use strict';

// ---------- 設定 ----------
const STORE_KEY = 'math-review.v1';
const PREF_KEY = 'math-review.prefs';
const ROUND_SIZE = 10;          // 一輪幾題
const CLEAR_STREAK = 2;         // 連續答對幾次就從常錯清單拿掉
const MAX_WEAK_IN_ROUND = 3;    // 一般測驗每輪最多混入幾題常錯

// 科目與章節：[章號, 中文章名, 英文章名]。還沒有資料的章節也列出來，網站上只留位置。
const SUBJECTS = [
  {
    name: '統計',
    en: 'Statistics',
    chapters: [
      [1, '資料與統計', 'Data and Statistics'],
      [2, '敘述統計：表格與圖形', 'Descriptive Statistics: Tabular and Graphical Displays'],
      [3, '敘述統計：數值測度', 'Descriptive Statistics: Numerical Measures'],
      [4, '機率導論', 'Introduction to Probability'],
      [5, '離散機率分配', 'Discrete Probability Distributions'],
      [6, '連續機率分配', 'Continuous Probability Distributions'],
      [7, '抽樣與抽樣分配', 'Sampling and Sampling Distributions'],
      [8, '區間估計', 'Interval Estimation'],
      [9, '假設檢定', 'Hypothesis Tests'],
    ],
  },
  {
    name: '微積分',
    en: 'Calculus',
    chapters: [
      [1, '函數與模型', 'Functions and Models'],
      [2, '極限與導數', 'Limits and Derivatives'],
    ],
  },
  {
    name: '線性代數',
    en: 'Linear Algebra',
    chapters: [
      [1, '線性方程組與矩陣', 'Systems of Linear Equations and Matrices'],
      [2, '行列式', 'Determinants'],
      [3, '歐氏向量空間', 'Euclidean Vector Spaces'],
    ],
  },
];

const CARDS = (window.CARD_DATA || []).map((c) => ({
  ...c,
  chapter: Number(c.chapter),
  topic: c.topic || '其他',
  id: c.subject + '|' + c.en,
}));
const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));
const TOPIC_EN = new Map(CARDS.map((c) => [c.subject + '|' + c.topic, c.topicEn]));

// ---------- 介面文字：[中文, English] ----------
const T = {
  brand: ['數學複習', 'Math Review'],
  brandSub: ['第一版', 'v1'],
  'tab.map': ['心智圖', 'Mind Map'],
  'tab.cards': ['公式卡', 'Flashcards'],
  'tab.quiz': ['小測驗', 'Quiz'],
  'tab.records': ['常錯紀錄', 'Mistakes'],
  'tab.backup': ['備份', 'Backup'],
  langBtn: ['English', '中文'],
  langTitle: ['切換成英文', '切換成中文'],

  subjects: ['科目', 'Subjects'],
  allChapters: ['全部章節', 'All chapters'],
  noData: ['還沒有資料', 'No data yet'],
  chapter: ['第 {n} 章', 'Ch. {n}'],
  emptyWhat: ['{what} 還沒有資料', '{what}: no data yet'],
  emptyHint: ['等講義或公式表整理好、放進「資料」資料夾之後，這裡就會出現。', 'This will appear once handouts or formula sheets are added to the 資料 folder.'],
  source: ['講義', 'Source:'],

  'type.n2f': ['看名稱選公式', 'Pick the formula'],
  'type.f2n': ['看公式選名稱', 'Name the formula'],
  'type.d2n': ['看解釋選名稱', 'Name the concept'],

  mapTitle: ['心智圖', 'Mind Map'],
  mapLedeAll: ['{s} · 點一章看那一章的心智圖，或直接點主題開始複習。', '{s} · Click a chapter to open its mind map, or click a topic to start reviewing.'],
  mapLedeCh: ['{scope} · 點主題複習那一組公式卡，點某一張就從那張開始。', '{scope} · Click a topic to review its flashcards, or click a card to start from it.'],
  cardsCount: ['{n} 張 · 會了 {k}', '{n} {w} · {k} known'],
  legendNew: ['還沒看過', 'Not seen yet'],
  legendKnown: ['會了', 'Known'],
  legendWeak: ['不熟／常錯', 'Unsure / missed'],

  cardsTitle: ['公式卡', 'Flashcards'],
  cardsLede: ['{scope} · 共 {n} 張。點卡片或按空白鍵翻面。', '{scope} · {n} {w}. Click the card or press Space to flip.'],
  topic: ['主題：', 'Topic: '],
  backToMap: ['回心智圖', 'Back to mind map'],
  wholeChapter: ['看整章', 'Whole chapter'],
  order: ['順序', 'Order'],
  seq: ['依序', 'In order'],
  shuffle: ['打亂', 'Shuffle'],
  onlyWeak: ['只看不熟／常錯的（{n}）', 'Only unsure / missed ({n})'],
  noWeakTitle: ['這個範圍沒有不熟的卡片', 'No unsure cards here'],
  noWeakHint: ['取消勾選「只看不熟」就能看全部。', 'Uncheck the filter to see every card.'],
  roundDone: ['這一輪看完了', 'Round complete'],
  roundTally: ['會了 {k} 張 · 不熟 {u} 張', '{k} known · {u} unsure'],
  again: ['再看一輪', 'Go again'],
  weakDeck: ['只看不熟的', 'Only the unsure ones'],
  front: ['正面', 'FRONT'],
  back: ['背面', 'BACK'],
  unsurePill: ['不熟', 'Unsure'],
  flipHint: ['點一下翻面（空白鍵）', 'Click to flip (Space)'],
  flip: ['翻面', 'Flip'],
  spaceKey: ['空白鍵', 'Space'],
  note: ['備註：', 'Note: '],
  unsure: ['不熟', 'Unsure'],
  know: ['會了', 'Got it'],
  toastCardCleared: ['這張連續兩次「會了」，從不熟清單拿掉', 'Marked "Got it" twice in a row — removed from the unsure list'],

  quizTitle: ['小測驗', 'Quiz'],
  quizHead: ['一輪 {n} 題選擇題', '{n} multiple-choice questions per round'],
  quizLi1: ['題目從這個範圍的 {n} 張公式卡出：有公式的卡考「看名稱選公式」「看公式選名稱」，沒有公式的卡考「看解釋選名稱」。', 'Questions come from the {n} flashcards in this scope: cards with a formula ask you to pick or name the formula, and cards without one ask you to name the concept from its description.'],
  quizLi2: ['每題選完馬上告訴你對錯、正確答案、出自哪一章。', 'After each answer you see whether it was right, the correct answer, and where it comes from.'],
  quizLi3weak: ['這個範圍有 {n} 題常錯，每輪最多混入 {m} 題。', '{n} missed questions in this scope; up to {m} are mixed into each round.'],
  quizLi3: ['答錯的題目會記到「常錯紀錄」，之後比較常出現。', 'Wrong answers are saved to Mistakes and come up more often.'],
  start: ['開始', 'Start'],
  startWeak: ['只練常錯的（{n}）', 'Practice mistakes ({n})'],
  weakPractice: ['常錯練習', 'Mistake practice'],
  qProgress: ['第 {i} / {n} 題', 'Question {i} / {n}'],
  correct: ['答對了', 'Correct'],
  wrong: ['答錯了', 'Incorrect'],
  answerIs: ['正確答案：', 'Answer: '],
  from: ['出自 ', 'From '],
  next: ['下一題', 'Next'],
  seeResult: ['看結果', 'See results'],
  toastQCleared: ['這題連續答對兩次，從常錯清單拿掉', 'Correct twice in a row — removed from Mistakes'],
  toastNoWeak: ['目前沒有常錯的題目', 'No mistakes to practice'],
  toastTooFew: ['這個範圍的卡片不夠出題', 'Not enough cards here to make questions'],
  resultTitle: ['這輪結果', 'Results'],
  allRight: ['全對！', 'All correct!'],
  wrongN: ['錯了 {n} 題，已經記到常錯紀錄。', '{n} wrong — saved to Mistakes.'],
  thWrong: ['錯的題目', 'Missed'],
  thType: ['題型', 'Type'],
  thFrom: ['出自', 'From'],
  playAgain: ['再一輪', 'Another round'],

  recTitle: ['常錯紀錄', 'Mistakes'],
  recLede: ['錯 1 次就記進來；同一題連續答對 {n} 次就拿掉。公式卡按「不熟」也算。', 'Added after 1 miss and removed after {n} correct answers in a row. Flashcards marked "Unsure" count too.'],
  recEmptyT: ['目前沒有常錯的題目', 'No mistakes yet'],
  recEmptyH: ['做小測驗答錯、或公式卡按「不熟」，就會記在這裡。', 'Wrong quiz answers and flashcards marked "Unsure" show up here.'],
  thItem: ['題目', 'Item'],
  thKind: ['類型', 'Kind'],
  thCount: ['錯幾次', 'Misses'],
  thLast: ['最近一次', 'Last missed'],
  thStreak: ['連對', 'Streak'],
  streakTitle: ['連續答對 {n} / {m}', '{n} / {m} correct in a row'],
  clearedList: ['已經拿掉的（{n}）', 'Cleared ({n})'],
  thTotal: ['總共錯過', 'Total misses'],
  thClearedOn: ['拿掉的日期', 'Cleared on'],
  kindFlash: ['公式卡按「不熟」', 'Flashcard: unsure'],

  bkTitle: ['備份', 'Backup'],
  bkLede: ['紀錄存在這台電腦的這個瀏覽器裡。清除瀏覽器資料、換瀏覽器或換電腦，紀錄就不在了，所以偶爾匯出一份。', 'Your records live in this browser on this computer. Clearing browser data or switching browsers or computers loses them, so export a copy now and then.'],
  bkLedeCloud: ['紀錄存在你的 Claude 帳號裡，只有你看得到；用同一個帳號在手機、電腦打開都是同一份。偶爾匯出一份當備份。', 'Your records are saved privately to your Claude account, so the same account sees them on every device. Export a copy now and then.'],
  cancel: ['取消', 'Cancel'],
  importYes: ['確定取代', 'Replace'],
  clearQ: ['確定要清除所有紀錄嗎？這個動作沒辦法復原。', 'Clear all records? This cannot be undone.'],
  clearYes: ['確定清除', 'Clear everything'],
  exported: ['已匯出備份檔', 'Backup exported'],
  exportDeclined: ['沒有存檔', 'Not saved'],
  exportUnavailable: ['這裡沒辦法存檔', 'Saving files is not available here'],
  bkExpT: ['匯出', 'Export'],
  bkExpP: ['把常錯紀錄、公式卡的「會了／不熟」和測驗分數存成一個 .json 檔。', 'Save your mistakes, flashcard progress, and quiz scores as a .json file.'],
  bkLast: ['上次匯出：{d}。', 'Last export: {d}.'],
  bkNever: ['還沒匯出過。', 'Never exported.'],
  bkExpBtn: ['匯出備份檔', 'Export backup'],
  bkImpT: ['匯入', 'Import'],
  bkImpP: ['選一個之前匯出的 .json 檔。<strong>會取代</strong>目前瀏覽器裡的紀錄。', 'Choose a .json file you exported before. It <strong>replaces</strong> the records in this browser.'],
  bkImpBtn: ['選擇備份檔…', 'Choose backup file…'],
  bkClrT: ['清除所有紀錄', 'Clear all records'],
  bkClrP: ['目前有 {n} 筆紀錄、{r} 輪測驗分數。清除之後沒辦法復原，建議先匯出。', '{n} records and {r} quiz scores. This cannot be undone, so export first.'],
  bkClrBtn: ['清除', 'Clear'],
  badFile: ['這個檔案不是正確的備份檔', 'This is not a valid backup file'],
  confirmImport: ['要用這個備份（{n} 筆紀錄）取代目前的紀錄嗎？', 'Replace your current records with this backup ({n} records)?'],
  imported: ['已匯入備份', 'Backup imported'],
  clearedAll: ['已清除所有紀錄', 'All records cleared'],
  saveFail: ['紀錄存不進瀏覽器，記得到「備份」匯出', 'Could not save to this browser — export a backup'],
  backupName: ['數學複習備份', 'math-review-backup'],
};

// ---------- 小工具 ----------
const $ = (sel, root = document) => root.querySelector(sel);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// 數學式：KaTeX 載不到（例如沒網路）時改顯示原始碼。
// 大字顯示時，用「,\quad」並列的幾個式子各佔一行，免得超出卡片。
function tex(s, display) {
  if (!s) return '';
  if (display && /,\s*\\quad/.test(s)) {
    return s.split(/,\s*\\quad\s*/).map((part) => tex(part, true)).join('');
  }
  if (window.katex) {
    try {
      return window.katex.renderToString(s, { displayMode: !!display, throwOnError: false });
    } catch (e) { /* 落到下面 */ }
  }
  return `<code class="tex-raw">${esc(s)}</code>`;
}

// ---------- 偏好（語言、目前科目、章節、分頁） ----------
function loadPrefs() {
  const def = { lang: 'zh', view: 'map', subject: '統計', chapter: 'all', order: 'shuffle', onlyWeak: false };
  try {
    return { ...def, ...(JSON.parse(localStorage.getItem(PREF_KEY)) || {}) };
  } catch (e) {
    return def;
  }
}
let prefs = loadPrefs();
function savePrefs() {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* 不重要 */ }
}

// ---------- 語言 ----------
const isEn = () => prefs.lang === 'en';

function t(key, vars) {
  const pair = T[key];
  let s = pair ? pair[isEn() ? 1 : 0] : key;
  if (vars) {
    const v = { w: vars.n === 1 ? 'card' : 'cards', ...vars }; // 英文的單複數
    s = s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
  }
  return s;
}

const subjectOf = (name) => SUBJECTS.find((x) => x.name === name);
const subjectLabel = (name) => (isEn() && subjectOf(name) ? subjectOf(name).en : name);

function chapterTitle(subject, n) {
  const s = subjectOf(subject);
  const ch = s && s.chapters.find((c) => c[0] === n);
  return ch ? ch[isEn() ? 2 : 1] : '';
}

const topicLabel = (subject, topic) => (isEn() && TOPIC_EN.get(subject + '|' + topic)) || topic;
const descOf = (c) => (isEn() && c.descEn) || c.desc;
const zhOf = (c) => (isEn() ? '' : c.zh); // 英文模式只顯示英文名稱
const pageOf = (c) => (isEn()
  ? c.page.replace(/p\.(\d+) 起/g, 'from p.$1').replace(/（/g, ' (').replace(/）/g, ')').replace(/、/g, ', ')
  : c.page);

function sourceLine(c) {
  return `${subjectLabel(c.subject)} · ${t('chapter', { n: c.chapter })} ${chapterTitle(c.subject, c.chapter)} · ${t('source')} ${pageOf(c)}`;
}

// ---------- 紀錄 ----------
// 在自己電腦上開：存在這個瀏覽器（localStorage）。
// 發布到 claude.ai 上開：另外存到這個帳號的私人資料區（db 的 data/users/<id>/progress），
// 所有裝置共用；localStorage 只當快取，讓畫面先出來。
function emptyStore() {
  return { v: 1, items: {}, known: {}, rounds: [], lastExport: null, updatedAt: 0 };
}

function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && typeof s.items === 'object') return { ...emptyStore(), ...s };
  } catch (e) { /* 用空的 */ }
  return emptyStore();
}

let store = loadStore();

function cacheLocal() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    return false;
  }
}

function saveStore() {
  store.updatedAt = Date.now();
  if (!cacheLocal() && !remote.ref) toast(t('saveFail'));
  scheduleRemote();
  updateBadge();
}

const remote = { ref: null, saving: false, again: false, timer: null };

// 連續操作合併成一次寫入；同一份文件一次只寫一筆
function scheduleRemote() {
  if (!remote.ref) return;
  clearTimeout(remote.timer);
  remote.timer = setTimeout(pushRemote, 800);
}

async function pushRemote() {
  if (!remote.ref) return;
  if (remote.saving) { remote.again = true; return; }
  remote.saving = true;
  try {
    await remote.ref.set(JSON.parse(JSON.stringify(store)));
  } catch (e) {
    if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) remote.ref = null;
  }
  remote.saving = false;
  if (remote.again) { remote.again = false; pushRemote(); }
}

async function connectRemote() {
  if (!window.claude || typeof window.claude.use !== 'function') return;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const uid = await user.id();
    if (!uid) return;
    const ref = db.doc(`data/users/${uid}/progress`);
    const first = await ref.get();
    remote.ref = ref;
    const cloud = first.exists ? first.data() : null;
    if (cloud && (cloud.updatedAt || 0) >= (store.updatedAt || 0)) {
      store = { ...emptyStore(), ...JSON.parse(JSON.stringify(cloud)) };
      cacheLocal();
      render();
    } else if (store.updatedAt) {
      pushRemote(); // 雲端還沒有、或比這台舊：把這台的紀錄傳上去
    } else {
      render(); // 備份頁的說明改成「存在帳號裡」
    }
    // 其他裝置寫入時跟著更新
    ref.onSnapshot((snap) => {
      if (snap.metadata.hasPendingWrites || !snap.exists) return;
      const data = snap.data();
      if ((data.updatedAt || 0) > (store.updatedAt || 0)) {
        store = { ...emptyStore(), ...JSON.parse(JSON.stringify(data)) };
        cacheLocal();
        render();
      }
    }, () => { remote.ref = null; });
  } catch (e) {
    remote.ref = null;
  }
}

// 紀錄的 key：測驗題是 q:題型:卡片，公式卡按「不熟」是 f:卡片
const qKey = (type, cardId) => `q:${type}:${cardId}`;
const fKey = (cardId) => `f:${cardId}`;

function parseKey(key) {
  if (key.startsWith('f:')) return { kind: 'f', cardId: key.slice(2) };
  return { kind: 'q', type: key.slice(2, 5), cardId: key.slice(6) };
}

function markWrong(key) {
  const it = store.items[key] || { count: 0, streak: 0, first: today() };
  it.count += 1;
  it.last = today();
  it.streak = 0;
  it.active = true;
  delete it.cleared;
  store.items[key] = it;
}

function markRight(key) {
  const it = store.items[key];
  if (!it || !it.active) return false;
  it.streak += 1;
  if (it.streak >= CLEAR_STREAK) {
    it.active = false;
    it.cleared = today();
    return true;
  }
  return false;
}

function itemList(active) {
  return Object.entries(store.items)
    .filter(([, it]) => !!it.active === active)
    .map(([key, it]) => ({ key, ...it, ...parseKey(key), card: CARD_BY_ID.get(parseKey(key).cardId) }))
    .filter((x) => x.card);
}

function updateBadge() {
  const n = itemList(true).length;
  $('#weak-badge').textContent = n ? String(n) : '';
}

// ---------- 範圍 ----------
function scopeCards() {
  return CARDS.filter((c) => c.subject === prefs.subject && (prefs.chapter === 'all' || c.chapter === prefs.chapter));
}

function scopeLabel() {
  const s = subjectLabel(prefs.subject);
  if (prefs.chapter === 'all') return `${s} · ${t('allChapters')}`;
  return `${s} · ${t('chapter', { n: prefs.chapter })} ${chapterTitle(prefs.subject, prefs.chapter)}`;
}

function emptyScopeHtml() {
  const s = subjectOf(prefs.subject);
  const what = !s || !s.chapters.length ? subjectLabel(prefs.subject) : scopeLabel();
  return `<div class="placeholder"><strong>${esc(t('emptyWhat', { what }))}</strong>${esc(t('emptyHint'))}</div>`;
}

// ---------- 左側：科目與章節 ----------
function renderScope() {
  const el = $('#scope');
  let html = `<h2>${esc(t('subjects'))}</h2>`;
  for (const s of SUBJECTS) {
    const n = CARDS.filter((c) => c.subject === s.name).length;
    const on = prefs.subject === s.name;
    html += `<div class="subject"><button class="subject-btn ${on ? 'active' : ''}" data-subject="${esc(s.name)}">
      <span>${esc(subjectLabel(s.name))}</span><span class="count">${n || ''}</span></button>`;
    if (on) {
      if (!s.chapters.length) {
        html += `<div class="empty-note">${esc(t('noData'))}</div>`;
      } else {
        html += `<div class="chapters"><button class="chapter-btn ${prefs.chapter === 'all' ? 'active' : ''}" data-chapter="all">
          <span>${esc(t('allChapters'))}</span><span class="count">${n}</span></button>`;
        for (const [num] of s.chapters) {
          const k = CARDS.filter((c) => c.subject === s.name && c.chapter === num).length;
          html += `<button class="chapter-btn ${prefs.chapter === num ? 'active' : ''} ${k ? '' : 'empty'}" data-chapter="${num}">
            <span>${num}. ${esc(chapterTitle(s.name, num))}</span><span class="count">${k || '—'}</span></button>`;
        }
        html += '</div>';
      }
    }
    html += '</div>';
  }
  el.innerHTML = html;
}

$('#scope').addEventListener('click', (e) => {
  const sb = e.target.closest('[data-subject]');
  const cb = e.target.closest('[data-chapter]');
  if (sb) {
    if (prefs.subject === sb.dataset.subject) return;
    prefs.subject = sb.dataset.subject;
    prefs.chapter = 'all';
  } else if (cb) {
    prefs.chapter = cb.dataset.chapter === 'all' ? 'all' : Number(cb.dataset.chapter);
  } else {
    return;
  }
  savePrefs();
  resetViews();
  render();
});

// ---------- 心智圖 ----------
const MM = { ROW: 34, GAP: 14, W0: 150, X1: 196, W1: 214, LEAF_GAP: 44 };

// 依 CSV 的順序（也就是課本順序）把卡片分成主題
function topicsOf(cards) {
  const groups = new Map();
  for (const c of cards) {
    if (!groups.has(c.topic)) groups.set(c.topic, []);
    groups.get(c.topic).push(c);
  }
  return [...groups].map(([topic, list]) => ({ topic, cards: list }));
}

function cardStatus(c) {
  const weak = (store.items[fKey(c.id)] && store.items[fKey(c.id)].active)
    || Object.keys(store.items).some((k) => k.startsWith('q:') && k.endsWith(':' + c.id) && store.items[k].active);
  if (weak) return 'weak';
  return store.known[c.id] ? 'known' : '';
}

function knownCount(cards) {
  return cards.filter((c) => cardStatus(c) === 'known').length;
}

// 估計分支方塊的高度（英文主題名比較長，可能折成好幾行），算出它至少要佔幾列
function branchRows(text) {
  const width = [...text].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 14 : 7.6), 0);
  const lines = Math.max(1, Math.ceil(width / (MM.W1 - 26)));
  return (lines * 19 + 16 + 16) / MM.ROW;
}

// root：中心；branches：[{ label, plain, meta, attrs, leaves: [{ html, title, attrs }] }]
function mindMap(root, branches) {
  const { ROW, GAP, W0, X1, W1, LEAF_GAP } = MM;
  const X2 = X1 + W1 + LEAF_GAP;
  let y = 0;
  for (const b of branches) {
    const need = branchRows(b.plain);
    // 沒有子項目（還沒有資料的章）只佔一點位置
    const rows = b.leaves.length ? Math.max(b.leaves.length, 2, need) : Math.max(1.4, need);
    const offset = ((rows - b.leaves.length) * ROW) / 2;
    b.leaves.forEach((l, i) => { l.y = y + offset + i * ROW + ROW / 2; });
    b.y = y + (rows * ROW) / 2;
    y += rows * ROW + GAP;
  }
  const H = Math.max(y - GAP, 80);
  const rootY = H / 2;
  const curve = (x1, y1, x2, y2) => {
    const mx = (x1 + x2) / 2;
    return `<path d="M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}"/>`;
  };

  let paths = '';
  let nodes = `<div class="mm-root" style="top:${rootY}px;width:${W0}px">${root}</div>`;
  for (const b of branches) {
    paths += curve(W0, rootY, X1, b.y);
    nodes += `<button class="mm-branch ${b.cls || ''}" style="top:${b.y}px;left:${X1}px;width:${W1}px" ${b.attrs}>
      <span class="mm-label">${esc(b.plain)}</span><span class="mm-meta">${esc(b.meta)}</span></button>`;
    for (const l of b.leaves) {
      paths += `<g class="leaf-line">${curve(X1 + W1, b.y, X2, l.y)}</g>`;
      nodes += `<button class="mm-leaf ${l.cls || ''}" style="top:${l.y}px;left:${X2}px" title="${esc(l.title)}" ${l.attrs}>${l.html}</button>`;
    }
  }
  return `<div class="mm-scroll"><div class="mm" style="height:${H}px">
    <svg class="mm-lines" width="${X2}" height="${H}" aria-hidden="true">${paths}</svg>${nodes}</div></div>`;
}

function renderMap() {
  const s = subjectOf(prefs.subject);
  if (!s || !s.chapters.length) return emptyScopeHtml();

  // 全部章節：科目 → 各章 → 各章的主題
  if (prefs.chapter === 'all') {
    const branches = s.chapters.map(([num]) => {
      const cards = CARDS.filter((c) => c.subject === s.name && c.chapter === num);
      return {
        plain: `${t('chapter', { n: num })} ${chapterTitle(s.name, num)}`,
        meta: cards.length ? t('cardsCount', { n: cards.length, k: knownCount(cards) }) : t('noData'),
        cls: cards.length ? '' : 'empty',
        attrs: `data-act="map-chapter" data-chapter="${num}" ${cards.length ? '' : 'disabled'}`,
        leaves: topicsOf(cards).map((g) => ({
          html: `<span class="mm-zh">${esc(topicLabel(s.name, g.topic))}</span><span class="mm-count">${g.cards.length}</span>`,
          title: topicLabel(s.name, g.topic),
          attrs: `data-act="map-topic" data-chapter="${num}" data-topic="${esc(g.topic)}"`,
        })),
      };
    });
    return `<h1>${esc(t('mapTitle'))}</h1><p class="lede">${esc(t('mapLedeAll', { s: subjectLabel(s.name) }))}</p>
      ${mindMap(`<strong>${esc(subjectLabel(s.name))}</strong>`, branches)}`;
  }

  // 單一章：章 → 主題 → 公式卡
  const cards = scopeCards();
  if (!cards.length) return emptyScopeHtml();
  const ch = prefs.chapter;
  const branches = topicsOf(cards).map((g) => ({
    plain: topicLabel(s.name, g.topic),
    meta: t('cardsCount', { n: g.cards.length, k: knownCount(g.cards) }),
    attrs: `data-act="map-topic" data-chapter="${ch}" data-topic="${esc(g.topic)}"`,
    leaves: g.cards.map((c) => ({
      html: `<span class="dot ${cardStatus(c)}"></span>${zhOf(c) ? `<span class="mm-zh">${esc(c.zh)}</span><span class="mm-en">${esc(c.en)}</span>` : `<span class="mm-zh">${esc(c.en)}</span>`}`,
      title: `${c.en}${zhOf(c) ? '（' + c.zh + '）' : ''}`,
      cls: cardStatus(c),
      attrs: `data-act="map-card" data-chapter="${ch}" data-topic="${esc(g.topic)}" data-id="${esc(c.id)}"`,
    })),
  }));
  return `<h1>${esc(t('mapTitle'))}</h1><p class="lede">${esc(t('mapLedeCh', { scope: scopeLabel() }))}</p>
    <div class="mm-legend"><span><span class="dot"></span>${esc(t('legendNew'))}</span><span><span class="dot known"></span>${esc(t('legendKnown'))}</span><span><span class="dot weak"></span>${esc(t('legendWeak'))}</span></div>
    ${mindMap(`<span class="mm-ch">${esc(t('chapter', { n: ch }))}</span><strong>${esc(chapterTitle(prefs.subject, ch))}</strong>`, branches)}`;
}

// 從心智圖打開某個主題的公式卡；startId 有值時依課本順序、從那張開始
function openTopic(chapter, topic, startId) {
  prefs.chapter = chapter;
  prefs.view = 'cards';
  prefs.onlyWeak = false;
  savePrefs();
  deckTopic = topic;
  buildDeck(!!startId);
  if (startId) deck.i = Math.max(0, deck.cards.findIndex((c) => c.id === startId));
  render();
  window.scrollTo(0, 0);
}

// ---------- 公式卡 ----------
let deck = null; // { cards, i, flipped, know, unsure }
let deckTopic = null; // 從心智圖點進來時，只看這個主題

function deckSource() {
  const cards = scopeCards();
  return deckTopic ? cards.filter((c) => c.topic === deckTopic) : cards;
}

function buildDeck(inOrder) {
  let cards = deckSource();
  if (prefs.onlyWeak) {
    const weak = new Set(itemList(true).map((x) => x.cardId));
    cards = cards.filter((c) => weak.has(c.id));
  }
  if (prefs.order === 'shuffle' && !inOrder) cards = shuffle(cards);
  deck = { cards, i: 0, flipped: false, know: 0, unsure: 0 };
}

function renderCards() {
  if (deckTopic && !deckSource().length) deckTopic = null;
  const all = deckSource();
  if (!all.length) return emptyScopeHtml();
  if (!deck) buildDeck();

  const weakCount = (() => {
    const weak = new Set(itemList(true).map((x) => x.cardId));
    return all.filter((c) => weak.has(c.id)).length;
  })();

  let html = `<h1>${esc(t('cardsTitle'))}</h1><p class="lede">${esc(t('cardsLede', { scope: scopeLabel(), n: all.length }))}</p>
  ${deckTopic ? `<div class="topic-bar"><span>${esc(t('topic'))}<strong>${esc(topicLabel(prefs.subject, deckTopic))}</strong></span>
    <button class="btn small" data-act="to-map">${esc(t('backToMap'))}</button>
    <button class="btn small" data-act="whole-chapter">${esc(t('wholeChapter'))}</button></div>` : ''}
  <div class="toolbar">
    <div class="seg" role="group" aria-label="${esc(t('order'))}">
      <button data-order="seq" class="${prefs.order === 'seq' ? 'on' : ''}">${esc(t('seq'))}</button>
      <button data-order="shuffle" class="${prefs.order === 'shuffle' ? 'on' : ''}">${esc(t('shuffle'))}</button>
    </div>
    <label class="check"><input type="checkbox" id="only-weak" ${prefs.onlyWeak ? 'checked' : ''}> ${esc(t('onlyWeak', { n: weakCount }))}</label>
  </div>`;

  if (!deck.cards.length) {
    return html + `<div class="placeholder"><strong>${esc(t('noWeakTitle'))}</strong>${esc(t('noWeakHint'))}</div>`;
  }

  if (deck.i >= deck.cards.length) {
    return html + `<div class="start-box" style="text-align:center">
      <h2 style="margin:0 0 8px">${esc(t('roundDone'))}</h2>
      <p class="muted" style="margin:0">${esc(t('roundTally', { k: deck.know, u: deck.unsure }))}</p>
      <div class="actions center">
        <button class="btn primary big" data-act="restart">${esc(t('again'))}</button>
        ${weakCount ? `<button class="btn big" data-act="weak-deck">${esc(t('weakDeck'))}</button>` : ''}
      </div></div>`;
  }

  const c = deck.cards[deck.i];
  const isWeak = store.items[fKey(c.id)] && store.items[fKey(c.id)].active;
  html += `<div class="q-head"><span class="progress">${deck.i + 1} / ${deck.cards.length}</span>
    <span class="meta">${esc(t('chapter', { n: c.chapter }))}</span></div>`;

  if (!deck.flipped) {
    html += `<div class="flash" data-act="flip" tabindex="0">
      <span class="side">${esc(t('front'))}</span>${isWeak ? `<span class="tag"><span class="pill">${esc(t('unsurePill'))}</span></span>` : ''}
      <div class="en">${esc(c.en)}</div>
      ${zhOf(c) ? `<div class="zh">${esc(c.zh)}</div>` : ''}
      <span class="hint">${esc(t('flipHint'))}</span></div>
      <div class="actions center"><button class="btn big" data-act="flip">${esc(t('flip'))}<span class="key">${esc(t('spaceKey'))}</span></button></div>`;
  } else {
    html += `<div class="flash back" data-act="flip" tabindex="0">
      <span class="side">${esc(t('back'))}</span>
      <div class="title" style="margin-top:8px">${esc(c.en)}${zhOf(c) ? `<span class="zh-inline">${esc(c.zh)}</span>` : ''}</div>
      ${c.tex ? `<div class="formula">${tex(c.tex, true)}</div>` : ''}
      <div class="desc">${esc(descOf(c))}</div>
      <div class="foot"><span class="meta">${esc(sourceLine(c))}</span>
        ${c.note && !isEn() ? `<span class="note">${esc(t('note'))}${esc(c.note)}</span>` : ''}</div>
    </div>
    <div class="actions center">
      <button class="btn bad big" data-act="unsure">${esc(t('unsure'))}<span class="key">1</span></button>
      <button class="btn ok big" data-act="know">${esc(t('know'))}<span class="key">2</span></button>
    </div>`;
  }
  return html;
}

function cardAnswer(know) {
  const c = deck.cards[deck.i];
  if (know) {
    deck.know += 1;
    store.known[c.id] = true;
    if (markRight(fKey(c.id))) toast(t('toastCardCleared'));
  } else {
    deck.unsure += 1;
    store.known[c.id] = false;
    markWrong(fKey(c.id));
  }
  saveStore();
  deck.i += 1;
  deck.flipped = false;
  render();
}

// ---------- 小測驗 ----------
let quiz = null; // { mode, questions, i, picked, results }

const optionValue = (card, type) => (type === 'n2f' ? card.tex : card.en);
// 有公式的卡只考公式（它們的解釋常常只是補充條件，單看解釋猜不出是哪張）；沒有公式的卡考解釋
const typesFor = (card) => (card.tex ? ['n2f', 'f2n'] : ['d2n']);

// 出一題：干擾選項來自同一科，優先同一章。題目和答案都只用卡片上的內容。
function makeQuestion(card, type) {
  if (type !== 'd2n' && !card.tex) return null;
  let pool = CARDS.filter((c) => c.subject === card.subject && c.id !== card.id);
  if (type !== 'd2n') pool = pool.filter((c) => c.tex);
  const ordered = [...shuffle(pool.filter((c) => c.chapter === card.chapter)), ...shuffle(pool.filter((c) => c.chapter !== card.chapter))];
  const seen = new Set([optionValue(card, type)]);
  const distractors = [];
  for (const c of ordered) {
    const v = optionValue(c, type);
    if (seen.has(v)) continue;
    seen.add(v);
    distractors.push(c);
    if (distractors.length === 3) break;
  }
  if (distractors.length < 3) return null;
  const options = shuffle([card, ...distractors]);
  return { key: qKey(type, card.id), type, card, options, answer: options.indexOf(card) };
}

function buildRound(mode) {
  const qs = [];
  const used = new Set();
  const push = (card, type) => {
    if (!card || used.has(card.id) || qs.length >= ROUND_SIZE) return;
    const q = makeQuestion(card, type);
    if (q) { qs.push(q); used.add(card.id); }
  };
  // 常錯的題目照原題型再考一次；「不熟」的卡片隨機挑題型
  // （舊紀錄裡有公式的卡若記成 d2n，改出公式題）
  const weakQ = (w) => push(w.card, w.kind === 'q' && typesFor(w.card).includes(w.type) ? w.type : pick(typesFor(w.card)));

  if (mode === 'weak') {
    shuffle(itemList(true)).forEach(weakQ);
  } else {
    const inScope = new Set(scopeCards().map((c) => c.id));
    shuffle(itemList(true).filter((w) => inScope.has(w.cardId))).slice(0, MAX_WEAK_IN_ROUND).forEach(weakQ);
    const cand = shuffle(scopeCards().flatMap((c) => typesFor(c).map((ty) => [c, ty])));
    for (const [c, ty] of cand) push(c, ty);
  }
  return shuffle(qs);
}

function startQuiz(mode) {
  const questions = buildRound(mode);
  if (!questions.length) {
    toast(mode === 'weak' ? t('toastNoWeak') : t('toastTooFew'));
    return;
  }
  quiz = { mode, questions, i: 0, picked: null, results: [] };
  prefs.view = 'quiz';
  savePrefs();
  render();
}

function optionName(o) {
  return `${esc(o.en)}${zhOf(o) ? `<span class="opt-zh">${esc(o.zh)}</span>` : ''}`;
}

function renderQuiz() {
  if (!quiz) {
    const cards = scopeCards();
    if (!cards.length) return emptyScopeHtml();
    const inScope = new Set(cards.map((c) => c.id));
    const weakHere = itemList(true).filter((w) => inScope.has(w.cardId)).length;
    const weakAll = itemList(true).length;
    return `<h1>${esc(t('quizTitle'))}</h1><p class="lede">${esc(scopeLabel())}</p>
    <div class="start-box">
      <strong>${esc(t('quizHead', { n: ROUND_SIZE }))}</strong>
      <ul>
        <li>${esc(t('quizLi1', { n: cards.length }))}</li>
        <li>${esc(t('quizLi2'))}</li>
        <li>${esc(weakHere ? t('quizLi3weak', { n: weakHere, m: MAX_WEAK_IN_ROUND }) : t('quizLi3'))}</li>
      </ul>
      <div class="actions">
        <button class="btn primary big" data-act="start">${esc(t('start'))}<span class="key">Enter</span></button>
        ${weakAll ? `<button class="btn big" data-act="start-weak">${esc(t('startWeak', { n: weakAll }))}</button>` : ''}
      </div>
    </div>`;
  }

  if (quiz.i >= quiz.questions.length) return renderQuizEnd();

  const q = quiz.questions[quiz.i];
  const c = q.card;
  let prompt;
  if (q.type === 'n2f') prompt = `<div class="en">${esc(c.en)}</div>${zhOf(c) ? `<div class="zh">${esc(c.zh)}</div>` : ''}`;
  else if (q.type === 'f2n') prompt = `<div class="formula">${tex(c.tex, true)}</div>`;
  else prompt = `<div class="desc">${esc(descOf(c))}</div>`;

  const answered = quiz.picked !== null;
  const opts = q.options.map((o, idx) => {
    let cls = '';
    if (answered) {
      if (idx === q.answer) cls = 'correct';
      else if (idx === quiz.picked) cls = 'wrong';
      else cls = 'dim';
    }
    const body = q.type === 'n2f' ? tex(o.tex, false) : optionName(o);
    return `<button class="option ${cls}" data-opt="${idx}" ${answered ? 'disabled' : ''}>
      <span class="num">${idx + 1}</span><span class="opt-body">${body}</span></button>`;
  }).join('');

  let fb = '';
  if (answered) {
    const ok = quiz.picked === q.answer;
    fb = `<div class="feedback ${ok ? 'ok' : 'bad'}">
      <div class="verdict">${esc(ok ? t('correct') : t('wrong'))}</div>
      <div class="answer">${esc(t('answerIs'))}<strong>${esc(c.en)}</strong>${zhOf(c) ? `（${esc(c.zh)}）` : ''}</div>
      ${c.tex && q.type !== 'f2n' ? `<div class="formula">${tex(c.tex, true)}</div>` : ''}
      ${q.type !== 'd2n' ? `<div class="muted">${esc(descOf(c))}</div>` : ''}
      <div class="meta" style="margin-top:6px">${esc(t('from'))}${esc(sourceLine(c))}</div>
    </div>
    <div class="actions"><button class="btn primary big" data-act="next">${esc(quiz.i + 1 < quiz.questions.length ? t('next') : t('seeResult'))}<span class="key">Enter</span></button></div>`;
  }

  return `<div class="q-head"><span class="q-type">${esc(t('type.' + q.type))}${quiz.mode === 'weak' ? ' · ' + esc(t('weakPractice')) : ''}</span>
    <span class="progress">${esc(t('qProgress', { i: quiz.i + 1, n: quiz.questions.length }))}</span></div>
    <div class="q-prompt">${prompt}</div>
    <div class="options">${opts}</div>${fb}`;
}

function answerQuiz(idx) {
  if (!quiz || quiz.picked !== null) return;
  const q = quiz.questions[quiz.i];
  quiz.picked = idx;
  const ok = idx === q.answer;
  quiz.results.push({ q, ok });
  if (ok) {
    const cleared = markRight(q.key);
    markRight(fKey(q.card.id)); // 答對也算「不熟」那張卡的連對
    if (cleared) toast(t('toastQCleared'));
  } else {
    markWrong(q.key);
  }
  saveStore();
  render();
}

function renderQuizEnd() {
  const right = quiz.results.filter((r) => r.ok).length;
  const total = quiz.results.length;
  if (!quiz.saved) {
    store.rounds.push({ date: today(), mode: quiz.mode, scope: scopeLabel(), right, total });
    store.rounds = store.rounds.slice(-200);
    saveStore();
    quiz.saved = true;
  }
  const wrong = quiz.results.filter((r) => !r.ok);
  const weakAll = itemList(true).length;
  return `<h1>${esc(t('resultTitle'))}</h1><p class="lede">${esc(quiz.mode === 'weak' ? t('weakPractice') : scopeLabel())}</p>
    <div class="score"><div class="big-num">${right}<small> / ${total}</small></div>
      <p class="muted">${esc(right === total ? t('allRight') : t('wrongN', { n: total - right }))}</p></div>
    ${wrong.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>${esc(t('thWrong'))}</th><th>${esc(t('thType'))}</th><th>${esc(t('thFrom'))}</th></tr></thead><tbody>
      ${wrong.map((r) => `<tr><td>${esc(r.q.card.en)}<span class="zh-inline">${esc(zhOf(r.q.card))}</span></td>
        <td>${esc(t('type.' + r.q.type))}</td><td class="meta">${esc(t('chapter', { n: r.q.card.chapter }))} · ${esc(pageOf(r.q.card))}</td></tr>`).join('')}
      </tbody></table></div>` : ''}
    <div class="actions center">
      <button class="btn primary big" data-act="start">${esc(t('playAgain'))}<span class="key">Enter</span></button>
      ${weakAll ? `<button class="btn big" data-act="start-weak">${esc(t('startWeak', { n: weakAll }))}</button>` : ''}
    </div>`;
}

// ---------- 常錯紀錄 ----------
function itemLabel(w) {
  return w.kind === 'f' ? t('kindFlash') : t('type.' + w.type);
}

function renderRecords() {
  const active = itemList(true).sort((a, b) => b.count - a.count || String(b.last).localeCompare(String(a.last)));
  const cleared = itemList(false).sort((a, b) => String(b.cleared).localeCompare(String(a.cleared)));
  const dots = (n) => `<span class="streak" title="${esc(t('streakTitle', { n, m: CLEAR_STREAK }))}">${
    Array.from({ length: CLEAR_STREAK }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;

  let html = `<h1>${esc(t('recTitle'))}</h1>
    <p class="lede">${esc(t('recLede', { n: CLEAR_STREAK }))}</p>`;

  if (!active.length) {
    html += `<div class="placeholder"><strong>${esc(t('recEmptyT'))}</strong>${esc(t('recEmptyH'))}</div>`;
  } else {
    html += `<div class="toolbar"><button class="btn primary" data-act="start-weak">${esc(t('startWeak', { n: active.length }))}</button></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>${esc(t('thItem'))}</th><th>${esc(t('thKind'))}</th><th>${esc(t('thFrom'))}</th><th>${esc(t('thCount'))}</th><th>${esc(t('thLast'))}</th><th>${esc(t('thStreak'))}</th></tr></thead><tbody>
    ${active.map((w) => `<tr>
      <td>${esc(w.card.en)}<span class="zh-inline">${esc(zhOf(w.card))}</span></td>
      <td class="muted">${esc(itemLabel(w))}</td>
      <td class="meta">${esc(subjectLabel(w.card.subject))} ${esc(t('chapter', { n: w.card.chapter }))}</td>
      <td class="num">${w.count}</td>
      <td class="num">${esc(w.last)}</td>
      <td>${dots(w.streak)}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  if (cleared.length) {
    html += `<details class="history"><summary>${esc(t('clearedList', { n: cleared.length }))}</summary>
      <div class="table-wrap"><table class="table" style="margin-top:10px"><thead><tr><th>${esc(t('thItem'))}</th><th>${esc(t('thKind'))}</th><th>${esc(t('thTotal'))}</th><th>${esc(t('thClearedOn'))}</th></tr></thead><tbody>
      ${cleared.map((w) => `<tr><td>${esc(w.card.en)}<span class="zh-inline">${esc(zhOf(w.card))}</span></td>
        <td class="muted">${esc(itemLabel(w))}</td><td class="num">${w.count}</td><td class="num">${esc(w.cleared || '')}</td></tr>`).join('')}
      </tbody></table></div></details>`;
  }
  return html;
}

// ---------- 備份 ----------
// 確認步驟做在頁面上（發布到 claude.ai 時瀏覽器的 confirm() 不會跳出來）
let pendingImport = null;
let pendingClear = false;

function renderBackup() {
  const n = Object.keys(store.items).length;
  const importPart = pendingImport
    ? `<p class="confirm-q">${esc(t('confirmImport', { n: Object.keys(pendingImport.items).length }))}</p>
       <div class="actions"><button class="btn primary" data-act="import-yes">${esc(t('importYes'))}</button>
       <button class="btn" data-act="import-no">${esc(t('cancel'))}</button></div>`
    : `<button class="btn" data-act="import">${esc(t('bkImpBtn'))}</button>`;
  const clearPart = pendingClear
    ? `<p class="confirm-q">${esc(t('clearQ'))}</p>
       <div class="actions"><button class="btn bad" data-act="clear-yes">${esc(t('clearYes'))}</button>
       <button class="btn" data-act="clear-no">${esc(t('cancel'))}</button></div>`
    : `<button class="btn bad" data-act="clear" ${n || store.rounds.length ? '' : 'disabled'}>${esc(t('bkClrBtn'))}</button>`;
  return `<h1>${esc(t('bkTitle'))}</h1>
  <p class="lede">${esc(remote.ref ? t('bkLedeCloud') : t('bkLede'))}</p>
  <div class="panel"><h2>${esc(t('bkExpT'))}</h2>
    <p>${esc(t('bkExpP'))}${esc(store.lastExport ? t('bkLast', { d: store.lastExport }) : t('bkNever'))}</p>
    <button class="btn primary" data-act="export">${esc(t('bkExpBtn'))}</button></div>
  <div class="panel"><h2>${esc(t('bkImpT'))}</h2>
    <p>${t('bkImpP')}</p>
    <input type="file" id="import-file" accept=".json,application/json" hidden>
    ${importPart}</div>
  <div class="panel danger"><h2>${esc(t('bkClrT'))}</h2>
    <p>${esc(t('bkClrP', { n, r: store.rounds.length }))}</p>
    ${clearPart}</div>`;
}

async function exportBackup() {
  const filename = `${t('backupName')}-${today()}.json`;
  const json = JSON.stringify({ ...store, lastExport: today() }, null, 2);
  // 在 claude.ai 上：用平台的存檔（會先問你要不要存）；自己電腦上：一般下載
  const downloads = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('downloads') : null;
  if (downloads) {
    try {
      await downloads.save({ filename, data: json });
    } catch (e) {
      toast(e && e.code === 'declined' ? t('exportDeclined') : t('exportUnavailable'));
      return;
    }
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  store.lastExport = today();
  saveStore();
  toast(t('exported'));
  render();
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (e) {
      toast(t('badFile'));
      return;
    }
    if (!data || typeof data.items !== 'object') {
      toast(t('badFile'));
      return;
    }
    pendingImport = data;
    render();
  };
  reader.readAsText(file);
}

// ---------- 畫面切換 ----------
function resetViews() {
  deck = null;
  deckTopic = null;
  quiz = null;
}

// 頁面上固定的文字（分頁名稱、標題、語言按鈕）
function renderChrome() {
  document.documentElement.lang = isEn() ? 'en' : 'zh-Hant';
  document.title = t('brand');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  const lb = $('#lang-btn');
  lb.textContent = t('langBtn');
  lb.title = t('langTitle');
}

function render() {
  renderChrome();
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === prefs.view));
  renderScope();
  const v = $('#view');
  if (prefs.view === 'map') v.innerHTML = renderMap();
  else if (prefs.view === 'cards') v.innerHTML = renderCards();
  else if (prefs.view === 'quiz') v.innerHTML = renderQuiz();
  else if (prefs.view === 'records') v.innerHTML = renderRecords();
  else v.innerHTML = renderBackup();
  fitFormulas(v);
  updateBadge();
}

// 太長的公式（例如貝氏定理）放不下時等比例縮小，不要出現捲軸
function fitFormulas(root) {
  root.querySelectorAll('.katex-display, .opt-body').forEach((el) => {
    const k = el.querySelector('.katex');
    if (!k) return;
    k.style.fontSize = '';
    const ratio = el.clientWidth / k.scrollWidth;
    if (ratio < 1) k.style.fontSize = `${Math.max(0.55, ratio * 0.97) * parseFloat(getComputedStyle(k).fontSize)}px`;
  });
}

window.addEventListener('resize', () => fitFormulas($('#view')));

$('#lang-btn').addEventListener('click', () => {
  prefs.lang = isEn() ? 'zh' : 'en';
  savePrefs();
  render();
});

$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]');
  if (!b) return;
  prefs.view = b.dataset.view;
  if (prefs.view === 'cards') { deck = null; deckTopic = null; }
  pendingImport = null;
  pendingClear = false;
  savePrefs();
  render();
});

$('#view').addEventListener('click', (e) => {
  const order = e.target.closest('[data-order]');
  if (order) {
    prefs.order = order.dataset.order;
    savePrefs();
    buildDeck();
    return render();
  }
  const opt = e.target.closest('[data-opt]');
  if (opt) return answerQuiz(Number(opt.dataset.opt));

  const act = e.target.closest('[data-act]');
  if (!act) return;
  switch (act.dataset.act) {
    case 'map-chapter':
      prefs.chapter = Number(act.dataset.chapter);
      savePrefs();
      resetViews();
      render();
      return window.scrollTo(0, 0);
    case 'map-topic': return openTopic(Number(act.dataset.chapter), act.dataset.topic, null);
    case 'map-card': return openTopic(Number(act.dataset.chapter), act.dataset.topic, act.dataset.id);
    case 'to-map': prefs.view = 'map'; savePrefs(); return render();
    case 'whole-chapter': deckTopic = null; buildDeck(); return render();
    case 'flip': deck.flipped = !deck.flipped; return render();
    case 'know': return cardAnswer(true);
    case 'unsure': return cardAnswer(false);
    case 'restart': buildDeck(); return render();
    case 'weak-deck': prefs.onlyWeak = true; savePrefs(); buildDeck(); return render();
    case 'start': return startQuiz('normal');
    case 'start-weak': return startQuiz('weak');
    case 'next': quiz.i += 1; quiz.picked = null; return render();
    case 'export': return exportBackup();
    case 'import': return $('#import-file').click();
    case 'import-yes':
      store = { ...emptyStore(), ...pendingImport };
      pendingImport = null;
      saveStore();
      resetViews();
      toast(t('imported'));
      return render();
    case 'import-no': pendingImport = null; return render();
    case 'clear': pendingClear = true; return render();
    case 'clear-yes':
      store = emptyStore();
      pendingClear = false;
      saveStore();
      resetViews();
      toast(t('clearedAll'));
      return render();
    case 'clear-no': pendingClear = false; return render();
  }
});

$('#view').addEventListener('change', (e) => {
  if (e.target.id === 'only-weak') {
    prefs.onlyWeak = e.target.checked;
    savePrefs();
    buildDeck();
    render();
  } else if (e.target.id === 'import-file' && e.target.files[0]) {
    importBackup(e.target.files[0]);
  }
});

// 鍵盤：公式卡 空白鍵翻面、1 不熟、2 會了；測驗 1–4 選答案、Enter 下一題
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.matches('input, textarea, select')) return;
  if (prefs.view === 'cards' && deck && deck.i < deck.cards.length) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); deck.flipped = !deck.flipped; render(); }
    else if (deck.flipped && e.key === '1') cardAnswer(false);
    else if (deck.flipped && e.key === '2') cardAnswer(true);
  } else if (prefs.view === 'quiz') {
    if (!quiz || quiz.i >= quiz.questions.length) {
      if (e.key === 'Enter' && scopeCards().length) { e.preventDefault(); startQuiz('normal'); }
    } else if (quiz.picked === null && /^[1-4]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < quiz.questions[quiz.i].options.length) answerQuiz(idx);
    } else if (quiz.picked !== null && e.key === 'Enter') {
      e.preventDefault();
      quiz.i += 1;
      quiz.picked = null;
      render();
    }
  }
});

// 先馬上畫，不等網路；KaTeX（defer 載入）到了之後再畫一次，數學式才會排版
render();
document.addEventListener('DOMContentLoaded', () => { if (window.katex) render(); });
connectRemote();
