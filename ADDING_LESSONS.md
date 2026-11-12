# Adding a new lesson with Anna

After a class, export the WhatsApp chat with Anna (**Chat → ⋮ → More → Export chat → Without media**). Put the export in this folder, for example as `Anna.zip`, and tell Claude:

> Add my new Slovak lessons from the chat.

Your progress is never lost, because it's saved per Slovak word, not per file.

---

## Instructions for Claude

1. **Find what's new.** Read `lastImported` in `data/meta.js`. Only messages from Anna **after** that date are new.
2. **Pull out the teaching.** Skip scheduling and small talk. Keep:
   - words and phrases, as `["slovak", "english", "optional note"]`
   - conjugations, endings, and cases, as grammar tables
   - questions Anna asks Dani, as `dialogues` (Dani's model answers use **feminine** forms: *rada, bola, sama, pripravená*)
3. **Fix Anna's typos.** She types fast (for example "deä" → "deň", "pišú" → "píšu", missing accents). Use standard Slovak and keep the meaning she taught.
4. **Choose where items go:**
   - If an item fits an existing topic (family, food, weather…), add it to that unit and add the class date to its `lessonDates`.
   - If it's a new topic, create `data/units/NN-topic.js` with the next number, copying the format of an existing unit, and then:
     - add a `<script src="data/units/NN-topic.js">` tag in `index.html` (before `app.js`)
     - add the path to `FILES` in `sw.js` **and bump `VERSION`** (for example `slovak-v2`) so the phone picks up the change
5. **Don't add duplicates.** Every Slovak item (its first form before ` | `) must be unique across all units. Use ` | ` for accepted alternatives, like `"Kde bývaš? | Kde žiješ?"`.
6. **Keep it private.** The app is hosted publicly, so swap in neutral examples for real personal details (employer, birthdays, ages, partner's or family names, home city or country). Never commit the chat export; `.gitignore` already blocks `*.zip`.
7. **Update `lastImported`** in `data/meta.js` to the date of the newest lesson you imported.
8. **Validate** by running `node tools/validate.js`. It must print `All good ✔`.
9. **Publish**: commit and `git push`. GitHub Pages updates the site within about a minute.

## Data format reference

```js
(window.SK_UNITS = window.SK_UNITS || []).push({
  id: "18-shopping",               // NN-name, also sets the order
  title: "Shopping",
  icon: "🛒",
  lessonDates: ["2026-11-12"],
  items: [
    ["Koľko to stojí?", "How much does it cost?"],
    ["obchod", "shop", "optional tip shown when you get it wrong"]
  ],
  grammar: [                       // optional; each row becomes a drill
    { id: "kupit-present", title: "kúpiť — to buy",
      note: "optional hint", rows: [["ja", "kúpim"], ["ty", "kúpiš"]] },
    { id: "ref-only", title: "Reference only", drill: false, rows: [["a", "b"]] }
  ],
  dialogues: [                     // optional; Anna's questions
    { q: "Čo si kúpila?", en: "What did you buy?", a: ["Kúpila som mlieko."] }
  ],
  reading: { title: "…", sk: "…", en: "…" }   // optional text to read
});
```
