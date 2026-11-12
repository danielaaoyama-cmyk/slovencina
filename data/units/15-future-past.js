// Unit 15 — Future & past tense
(window.SK_UNITS = window.SK_UNITS || []).push({
  id: "15-future-past",
  title: "Future & past",
  icon: "⏳",
  lessonDates: ["2026-08-06", "2026-08-17", "2026-09-10", "2026-10-05", "2026-11-10"],
  items: [
    ["minulý čas", "past tense"],
    ["ja budem", "I will be"],
    ["ty budeš", "you will be"],
    ["on bude", "he will be"],
    ["my budeme", "we will be"],
    ["vy budete", "you (plural) will be"],
    ["oni budú", "they will be"],
    ["Budem variť.", "I will cook."],
    ["ja som bola", "I was (woman)"],
    ["ja som bol", "I was (man)"],
    ["ty si bola", "you were (to a woman)"],
    ["on bol", "he was"],
    ["ona bola", "she was"],
    ["ono bolo", "it was"],
    ["my sme boli", "we were"],
    ["vy ste boli", "you (plural) were"],
    ["oni boli", "they were"],
    ["Včera som bola doma.", "Yesterday I was at home. (woman)"],
    ["Čo si robila včera?", "What did you do yesterday? (to a woman)"],
    ["Čo si robila včera večer?", "What did you do yesterday evening?"],
    ["Včera som bola nakupovať s kamarátkou.", "Yesterday I went shopping with a friend. (woman)"],
    ["Pozerala som televíziu. | Pozerala som telku. | Pozerala som TV.", "I watched TV. (woman)"],
    ["Hovorila som po slovensky.", "I spoke Slovak. (woman)"],
    ["Mala som raňajky.", "I had breakfast. (woman)"],
    ["Tvoja mama odišla domov.", "Your mom went home."],
    ["Čo nové si sa naučila?", "What new things have you learned? (to a woman)"]
  ],
  grammar: [
    {
      id: "past-endings", title: "Past tense endings", drill: false,
      note: "Take the verb, drop -ť, add -l / -la / -lo / -li. With ja / ty / my / vy also add som / si / sme / ste.",
      rows: [["man (on, ja-man)", "-l: bol, mal, hovoril"], ["woman (ona, ja-woman)", "-la: bola, mala, hovorila"], ["it (ono)", "-lo: bolo, malo"], ["plural (my, vy, oni)", "-li: boli, mali, hovorili"]]
    },
    { id: "byt-future", title: "byť — future (will be)", rows: [["ja", "budem"], ["ty", "budeš"], ["on / ona / ono", "bude"], ["my", "budeme"], ["vy", "budete"], ["oni", "budú"]] },
    { id: "byt-past", title: "byť — past (was / were)", rows: [["ja (woman)", "som bola"], ["ty (woman)", "si bola"], ["on", "bol"], ["ona", "bola"], ["ono", "bolo"], ["my", "sme boli"], ["vy", "ste boli"], ["oni", "boli"]] },
    { id: "mat-past", title: "mať — past (had)", rows: [["ja (woman)", "som mala"], ["ty (woman)", "si mala"], ["on", "mal"], ["ona", "mala"], ["ono", "malo"], ["my", "sme mali"], ["vy", "ste mali"], ["oni", "mali"]] },
    { id: "hovorit-past", title: "hovoriť — past (spoke)", rows: [["ja (woman)", "som hovorila"], ["ty (woman)", "si hovorila"], ["on", "hovoril"], ["ona", "hovorila"], ["ono", "hovorilo"], ["my", "sme hovorili"], ["vy", "ste hovorili"], ["oni", "hovorili"]] }
  ],
  dialogues: [
    { q: "Čo si robila včera?", en: "What did you do yesterday?", a: ["Včera som bola doma.", "Včera som bola nakupovať s kamarátkou."] },
    { q: "Čo si robila včera večer?", en: "What did you do yesterday evening?", a: ["Pozerala som televíziu.", "Varila som večeru."] },
    { q: "Čo budeš robiť zajtra?", en: "What will you do tomorrow?", a: ["Zajtra budem pracovať.", "Budem variť."] }
  ]
});
