// Checks the lesson data. Run from the Slovak folder:  node tools/validate.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const unitDir = path.join(root, 'data', 'units');
const files = fs.readdirSync(unitDir).filter((f) => f.endsWith('.js')).sort();
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'data', 'meta.js'), 'utf8'), sandbox);

const errors = [], warnings = [];
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(unitDir, f), 'utf8'), sandbox, { filename: f }); }
  catch (e) { errors.push(`${f}: does not load — ${e.message}`); }
}
const units = sandbox.window.SK_UNITS || [];
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const f of files) {
  if (!html.includes(`data/units/${f}`)) errors.push(`${f}: missing <script> tag in index.html`);
  if (!sw.includes(`data/units/${f}`)) errors.push(`${f}: missing from FILES list in sw.js`);
}

const seenItems = new Map(), seenIds = new Set(), seenTables = new Set();
let items = 0, rows = 0, dialogues = 0;
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
for (const u of units) {
  const where = u.id || '(unit without id)';
  if (!u.id || !u.title) errors.push(`${where}: needs id and title`);
  if (seenIds.has(u.id)) errors.push(`${where}: duplicate unit id`);
  seenIds.add(u.id);
  (u.lessonDates || []).forEach((d) => { if (!isDate(d)) errors.push(`${where}: bad lesson date "${d}"`); });
  (u.items || []).forEach((it, i) => {
    const o = Array.isArray(it) ? { sk: it[0], en: it[1] } : it;
    if (!o.sk || !o.en) { errors.push(`${where}: item #${i + 1} is missing sk or en`); return; }
    const key = String(o.sk).split(' | ')[0].trim();
    if (seenItems.has(key)) errors.push(`${where}: "${key}" already exists in ${seenItems.get(key)}`);
    seenItems.set(key, u.id);
    if (/\s{2,}/.test(o.sk) || o.sk !== o.sk.trim()) warnings.push(`${where}: extra spaces in "${o.sk}"`);
    items++;
  });
  (u.grammar || []).forEach((t) => {
    if (!t.id || !t.title || !Array.isArray(t.rows) || !t.rows.length) { errors.push(`${where}: grammar table needs id, title, rows`); return; }
    if (seenTables.has(t.id)) errors.push(`${where}: duplicate grammar id "${t.id}"`);
    seenTables.add(t.id);
    const labels = new Set();
    t.rows.forEach((r) => {
      if (!Array.isArray(r) || r.length < 2 || !r[0] || !r[1]) errors.push(`${where}/${t.id}: bad row ${JSON.stringify(r)}`);
      else if (labels.has(r[0])) errors.push(`${where}/${t.id}: duplicate row label "${r[0]}"`);
      else labels.add(r[0]);
      rows++;
    });
    if (t.drill !== false && t.rows.length < 2) warnings.push(`${where}/${t.id}: drill tables work best with 2+ rows`);
  });
  (u.dialogues || []).forEach((d) => {
    if (!d.q || !d.en || !Array.isArray(d.a) || !d.a.length) errors.push(`${where}: dialogue needs q, en and a[]`);
    dialogues++;
  });
}
if (!isDate((sandbox.window.SK_META || {}).lastImported || '')) errors.push('data/meta.js: lastImported should be YYYY-MM-DD');

console.log(`${units.length} units · ${items} words/phrases · ${rows} grammar rows · ${dialogues} "Anna asks" questions`);
warnings.forEach((w) => console.log('  warning: ' + w));
if (errors.length) { errors.forEach((e) => console.log('  ERROR: ' + e)); process.exit(1); }
console.log('All good ✔');
