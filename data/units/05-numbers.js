// Unit 5 — Numbers & age
(window.SK_UNITS = window.SK_UNITS || []).push({
  id: "05-numbers",
  title: "Numbers & age",
  icon: "🔢",
  lessonDates: ["2026-07-08", "2026-07-27", "2026-10-19"],
  items: [
    ["nula", "0"],
    ["jeden", "1"],
    ["dva", "2"],
    ["tri", "3"],
    ["štyri", "4"],
    ["päť", "5"],
    ["šesť", "6"],
    ["sedem", "7"],
    ["osem", "8"],
    ["deväť", "9"],
    ["desať", "10"],
    ["jedenásť", "11"],
    ["dvanásť", "12"],
    ["trinásť", "13"],
    ["štrnásť", "14"],
    ["pätnásť", "15"],
    ["šestnásť", "16"],
    ["sedemnásť", "17"],
    ["osemnásť", "18"],
    ["devätnásť", "19"],
    ["dvadsať", "20", "ds sounds like c: 'dvacať'"],
    ["tridsať", "30", "ds sounds like c: 'tricať'"],
    ["štyridsať", "40"],
    ["päťdesiat", "50"],
    ["šesťdesiat", "60"],
    ["sedemdesiat", "70"],
    ["osemdesiat", "80"],
    ["deväťdesiat", "90"],
    ["Koľko?", "How many? / How much?"],
    ["Koľko máš rokov?", "How old are you?"],
    ["Mám tridsať rokov.", "I am 30 years old."],
    ["Moja sestra má dvadsaťpäť rokov. | Moja sestra má dvadsať päť rokov.", "My sister is 25."]
  ],
  grammar: [
    {
      id: "number-building", title: "Building numbers", drill: false,
      note: "Say tens + ones together: dvadsaťpäť = 25",
      rows: [["11–19", "+ násť: jedenásť, dvanásť, trinásť…"], ["20, 30, 40", "+ dsať: dvadsať, tridsať, štyridsať"], ["50–90", "+ desiat: päťdesiat, šesťdesiat…"]]
    },
    {
      id: "tens", title: "The tens",
      rows: [["10", "desať"], ["20", "dvadsať"], ["30", "tridsať"], ["40", "štyridsať"], ["50", "päťdesiat"], ["60", "šesťdesiat"], ["70", "sedemdesiat"], ["80", "osemdesiat"], ["90", "deväťdesiat"]]
    }
  ],
  dialogues: [
    { q: "Koľko máš rokov?", en: "How old are you?", a: ["Mám tridsať rokov."] }
  ]
});
