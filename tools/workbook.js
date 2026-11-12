// Builds a printable practice workbook (HTML + PDF) from the lesson data.
//   node tools/workbook.js            -> workbook/Slovak-Workbook.pdf
//   node tools/workbook.js --seed 2   -> a fresh set of exercises (different picks and order)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const seedArg = process.argv.indexOf('--seed');
const SEED = seedArg > -1 ? Number(process.argv[seedArg + 1]) || 1 : 1;

// ---- load data ----
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'data', 'meta.js'), 'utf8'), sandbox);
for (const f of fs.readdirSync(path.join(root, 'data', 'units')).filter((f) => f.endsWith('.js')).sort()) {
  vm.runInContext(fs.readFileSync(path.join(root, 'data', 'units', f), 'utf8'), sandbox);
}
const META = sandbox.window.SK_META;
const UNITS = sandbox.window.SK_UNITS.slice().sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));

// ---- helpers ----
let s = SEED * 2654435761 >>> 0;
const rand = () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const alts = (x) => String(x).split(' | ').map((y) => y.trim());
const toItem = (it) => (Array.isArray(it) ? { sk: alts(it[0])[0], all: alts(it[0]), en: it[1] } : { sk: alts(it.sk)[0], all: alts(it.sk), en: it.en });
const isPhrase = (sk) => /\s/.test(sk) || /[.?!…]$/.test(sk);
const words = (sk) => sk.replace(/[.,!?…]/g, '').split(/\s+/).filter(Boolean);
const lines = (n) => '<div class="line"></div>'.repeat(n);
const niceDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-CA', { day: 'numeric', month: 'long', year: 'numeric' }); };

// ---- build exercises ----
const key = []; // answer key: { unit, sections: [{ title, answers: [..] }] }

function unitPage(u, n) {
  const items = (u.items || []).map(toItem).filter((i) => !/…/.test(i.sk));
  const vocab = shuffle(items.filter((i) => !isPhrase(i.sk)));
  const phrases = shuffle(items.filter((i) => isPhrase(i.sk)));
  const k = { unit: `${n}. ${u.title}`, sections: [] };
  let html = `<section class="unit"><div class="unit-head"><span class="icon">${u.icon || ''}</span><div><div class="kicker">Unit ${n}</div><h2>${esc(u.title)}</h2></div></div>`;
  let ex = 0;
  const exTitle = (t, hint) => `<h3><span class="exn">${String.fromCharCode(65 + ex++)}</span>${t}${hint ? `<span class="hint">${hint}</span>` : ''}</h3>`;

  // A. Slovak -> English
  const a = (vocab.length >= 6 ? vocab : vocab.concat(phrases)).slice(0, 8);
  if (a.length) {
    html += exTitle('What does it mean?', 'Write the English.') + `<ol class="grid2">${a.map((i) => `<li><b>${esc(i.sk)}</b> <span class="fill"></span></li>`).join('')}</ol>`;
    k.sections.push({ title: 'What does it mean?', answers: a.map((i) => `${i.sk} = ${i.en}`) });
  }

  // B. English -> Slovak
  const usedB = new Set(a.map((i) => i.sk));
  const b = phrases.filter((i) => !usedB.has(i.sk)).slice(0, 5);
  const bExtra = vocab.filter((i) => !usedB.has(i.sk)).slice(0, Math.max(0, 5 - b.length));
  const bAll = b.concat(bExtra);
  if (bAll.length) {
    html += exTitle('Say it in Slovak', 'Don\'t forget the accents: á, č, ž…') + `<ol class="list">${bAll.map((i, j) => `<li data-k="${u.id}-b${j}" data-prio="1"><span class="prompt">${esc(i.en)}</span>${lines(1)}</li>`).join('')}</ol>`;
    k.sections.push({ title: 'Say it in Slovak', answers: bAll.map((i, j) => [`${u.id}-b${j}`, i.all.join(' / ')]) });
  }

  // C. Unscramble
  const usedC = new Set(a.concat(bAll).map((i) => i.sk));
  const c = phrases.filter((i) => !usedC.has(i.sk) && words(i.sk).length >= 3 && words(i.sk).length <= 9).slice(0, 3);
  if (c.length) {
    html += exTitle('Put the words in order') + `<ol class="list">${c.map((i) => {
      let w = shuffle(words(i.sk)); if (w.join(' ') === words(i.sk).join(' ')) w = w.reverse();
      return `<li><span class="scramble">${w.map((x) => esc(x.toLowerCase())).join(' &nbsp;/&nbsp; ')}</span><span class="muted"> (${esc(i.en)})</span>${lines(1)}</li>`;
    }).join('')}</ol>`;
    k.sections.push({ title: 'Put the words in order', answers: c.map((i) => i.sk) });
  }

  // D. Grammar fill-in (up to 2 tables)
  const tables = shuffle((u.grammar || []).filter((t) => t.drill !== false && t.rows.length >= 3)).slice(0, 1);
  for (const t of tables) {
    const rows = t.rows.slice(0, 6);
    html += exTitle(`Grammar: ${esc(t.title)}`, t.note ? esc(t.note) : 'Fill in the missing forms.') +
      `<table class="gt">${rows.map((r, i) => `<tr><td>${esc(r[0])}</td><td>${i === 0 ? `<i>${esc(alts(r[1])[0])}</i> <span class="muted">(example)</span>` : '<span class="blank"></span>'}</td></tr>`).join('')}</table>`;
    k.sections.push({ title: t.title, answers: rows.slice(1).map((r) => `${r[0]} → ${alts(r[1]).join(' / ')}`) });
  }

  // E. Anna asks
  const ds = (u.dialogues || []).slice(0, 3);
  if (ds.length) {
    html += exTitle('Anna asks — answer about YOUR life', 'Use full sentences.') + `<ol class="list">${ds.map((d, j) => `<li data-k="${u.id}-e${j}" data-prio="2"><span class="prompt sk">${esc(d.q)}</span> <span class="muted">(${esc(d.en)})</span><div class="line tall"></div></li>`).join('')}</ol>`;
    k.sections.push({ title: 'Anna asks (example answers)', answers: ds.map((d, j) => [`${u.id}-e${j}`, `${d.q} → ${d.a.join(' / ')}`]) });
  }

  // Reading
  if (u.reading) {
    html += exTitle(`Read aloud: ${esc(u.reading.title.replace(/^Anna's reading: /, ''))}`, 'Read it out loud twice, then translate the first 5 sentences.') +
      `<p class="reading">${esc(u.reading.sk)}</p>${lines(5)}`;
    k.sections.push({ title: 'Reading (translation)', answers: [u.reading.en] });
  }

  key.push(k);
  return html + '</section>';
}

// ---- mixed review: cases + past tense ----
function mixedReview() {
  const caseQs = [
    ['Mám ___ . (sestra)', 'sestru'], ['Idem od ___ . (sestra)', 'sestry'], ['Dám to ___ . (mama)', 'mame'],
    ['Hovorím o ___ . (žena)', 'žene'], ['Idem so ___ . (sestra)', 'sestrou'], ['Pijem ___ . (káva)', 'kávu'],
    ['Ideš so ___ ? (ja)', 'mnou'], ['Hovorí o ___ . (ja)', 'mne'], ['Vidím ___ . (kniha)', 'knihu'], ['pred ___ (lekcia)', 'lekciou']
  ];
  const pastQs = [
    ['Dnes som doma. → Včera ___', 'Včera som bola doma.'], ['Mám raňajky. → Včera ___', 'Včera som mala raňajky.'],
    ['Hovorím po slovensky. → Včera ___', 'Včera som hovorila po slovensky.'], ['Peter je v práci. → Včera ___', 'Včera bol Peter v práci.'],
    ['My sme doma. → Včera ___', 'Včera sme boli doma.'], ['Varím večeru. → Zajtra ___ (future)', 'Zajtra budem variť večeru.']
  ];
  const cs = shuffle(caseQs), ps = shuffle(pastQs);
  key.push({ unit: 'Mixed review', sections: [{ title: 'Cases', answers: cs.map((q) => q[0].replace('___', q[1]).replace(/ \(.*\)/, '').replace(/ ([.?])$/, '$1')) }, { title: 'Past & future', answers: ps.map((q) => q[1]) }] });
  return `<section class="unit"><div class="unit-head"><span class="icon">🔁</span><div><div class="kicker">Before your next class</div><h2>Mixed review</h2></div></div>
    <h3><span class="exn">A</span>Cases: change the word in brackets<span class="hint">-a → -y (from) · -e (to/about) · -u (I have/see) · -ou (with)</span></h3>
    <ol class="grid2">${cs.map((q) => `<li>${esc(q[0])}</li>`).join('')}</ol>
    <h3><span class="exn">B</span>Yesterday and tomorrow<span class="hint">Past: -l / -la / -li · Future: budem, budeš…</span></h3>
    <ol class="list">${ps.map((q) => `<li><span class="prompt sk">${esc(q[0])}</span>${lines(1)}</li>`).join('')}</ol>
    <h3><span class="exn">C</span>Write about yourself<span class="hint">5–6 sentences. Use: Volám sa… Som z… Bývam v… Pracujem… Mám rada… Nemám rada… Včera som…</span></h3>
    ${lines(6)}
    <h3><span class="exn">D</span>Questions for Anna<span class="hint">Write 3 questions you want to ask her next class.</span></h3>
    ${lines(3)}
  </section>`;
}

// ---- assemble ----
const pron = (META.pronunciation || []).map((r) => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join('');
const body = UNITS.map((u, i) => unitPage(u, i + 1)).join('') + mixedReview();
const keyHtml = key.map((k) => `<div class="key-unit"><h4>${esc(k.unit)}</h4>${k.sections.map((sec) => `<div class="key-sec"><b>${esc(sec.title)}</b><ol>${sec.answers.map((a) => Array.isArray(a) ? `<li data-k="${a[0]}">${esc(a[1])}</li>` : `<li>${esc(a)}</li>`).join('')}</ol></div>`).join('')}</div>`).join('');

const html = `<!doctype html><html lang="sk"><head><meta charset="utf-8"><title>Slovak Workbook</title><style>
@page { size: Letter; margin: 0.55in 0.6in; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", Arial, sans-serif; color: #1d2433; font-size: 10.5pt; line-height: 1.32; margin: 0; }
h1 { font-size: 34pt; margin: 0; color: #0b4ea2; letter-spacing: -.5px; }
h2 { font-size: 19pt; margin: 0; color: #0b4ea2; }
h3 { font-size: 11pt; margin: 10px 0 4px; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; break-after: avoid; }
.exn { background: #0b4ea2; color: #fff; border-radius: 4px; padding: 0 6px; font-size: 10pt; }
.hint { font-weight: 400; color: #687085; font-size: 9.5pt; }
.muted { color: #687085; font-size: 9.5pt; }
.cover { height: 9.6in; display: flex; flex-direction: column; justify-content: center; gap: 14px; break-after: page; }
.flag { height: 10px; width: 160px; background: linear-gradient(#fff 0 33%, #0b4ea2 33% 66%, #e0312b 66%); border: 1px solid #ddd; }
.cover .sub { font-size: 15pt; color: #687085; }
.box { border: 1.5px solid #e1ddd2; border-radius: 10px; padding: 12px 16px; background: #faf8f3; }
.box ul { margin: 6px 0 0 18px; padding: 0; }
.unit { break-before: page; }
.unit-head { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #e0312b; padding-bottom: 8px; margin-bottom: 4px; }
.unit-head .icon { font-size: 26pt; }
.kicker { text-transform: uppercase; letter-spacing: .08em; font-size: 8.5pt; color: #e0312b; font-weight: 700; }
ol { margin: 0; padding-left: 22px; }
ol li { margin: 0 0 4px; break-inside: avoid; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 26px; row-gap: 8px; }
.grid2 li { display: flex; gap: 6px; align-items: flex-end; }
.fill { flex: 1; border-bottom: 1px solid #9aa3b5; min-width: 60px; height: 18px; }
.list li { margin-bottom: 5px; }
.prompt.sk { font-weight: 600; }
.line { border-bottom: 1px solid #9aa3b5; height: 24px; }
.line.tall { height: 32px; }
.scramble { font-weight: 600; color: #0b4ea2; }
.gt { border-collapse: collapse; width: 75%; margin-left: 22px; }
.gt td { border: 1px solid #d6d1c4; padding: 3px 10px; height: 25px; }
.gt td:first-child { width: 45%; background: #faf8f3; color: #4a5266; }
.reading { background: #faf8f3; border-left: 4px solid #0b4ea2; padding: 10px 14px; margin: 4px 0 6px; font-size: 11.5pt; line-height: 1.55; }
.pron { border-collapse: collapse; width: 100%; font-size: 10pt; }
.pron td { padding: 3px 8px; border-bottom: 1px solid #e1ddd2; vertical-align: top; }
.pron td:first-child { width: 22%; color: #0b4ea2; }
.key { break-before: page; columns: 2; column-gap: 26px; font-size: 9pt; line-height: 1.3; }
.key h2 { column-span: all; margin-bottom: 10px; }
.key-unit { break-inside: avoid-column; margin-bottom: 10px; }
.key h4 { margin: 0 0 3px; color: #e0312b; font-size: 10pt; }
.key-sec { margin-bottom: 4px; }
.key ol { padding-left: 18px; }
.key li { margin: 0; }
</style></head><body>
<div class="cover">
  <div class="flag"></div>
  <h1>Slovenčina<br>s Annou</h1>
  <div class="sub">Practice workbook · ${UNITS.length} units · lessons up to ${esc(niceDate(META.lastImported))}</div>
  <div class="box"><b>How to use this workbook</b><ul>
    <li>Do one unit before each class with Anna. It takes about 20–30 minutes.</li>
    <li>Write first and check later. The answer key is at the back.</li>
    <li>Read every Slovak sentence <b>out loud</b> after you write it.</li>
    <li>For "Anna asks", answer about your own life. There's no single right answer.</li>
    <li>Mark the words you got wrong and practice them in the app.</li>
  </ul></div>
  <div class="box"><b>Pronunciation cheat sheet</b><table class="pron">${pron}</table></div>
  <div class="muted">Name: ______________________ &nbsp;&nbsp; Started: ______________ &nbsp;&nbsp; Version ${SEED}</div>
</div>
${body}
<section class="key"><h2>Answer key</h2>${keyHtml}</section>
<script>
// Make each unit fit on its pages: if it is too tall, drop its last Anna question,
// then the last "Say it in Slovak" line (keeping at least one of each), plus the matching answers.
(function () {
  var PAGE = 9.9 * 96 - 4; // printable height per page in CSS px
  document.querySelectorAll('.unit').forEach(function (u) {
    var pages = u.querySelector('.reading') ? 2 : 1;
    var limit = PAGE * pages;
    for (var guard = 0; guard < 12 && u.getBoundingClientRect().height > limit; guard++) {
      var cand = null;
      [2, 1].some(function (prio) {
        var lis = u.querySelectorAll('li[data-prio="' + prio + '"]');
        if (lis.length > 1) { cand = lis[lis.length - 1]; return true; }
        return false;
      });
      if (!cand) break;
      var k = document.querySelector('.key li[data-k="' + cand.dataset.k + '"]');
      if (k) k.remove();
      cand.remove();
    }
  });
})();
</script>
</body></html>`;

const outDir = path.join(root, 'workbook');
fs.mkdirSync(outDir, { recursive: true });
const htmlPath = path.join(outDir, 'Slovak-Workbook.html');
const pdfPath = path.join(outDir, SEED === 1 ? 'Slovak-Workbook.pdf' : `Slovak-Workbook-v${SEED}.pdf`);
fs.writeFileSync(htmlPath, html);

const browsers = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].filter((p) => fs.existsSync(p));
if (!browsers.length) { console.log('Wrote', htmlPath, '— open it in a browser and print to PDF.'); process.exit(0); }
execFileSync(browsers[0], ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, 'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 120000 });
console.log('Wrote', pdfPath);
