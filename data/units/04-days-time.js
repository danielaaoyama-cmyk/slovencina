// Unit 4 — Days, dates & time
(window.SK_UNITS = window.SK_UNITS || []).push({
  id: "04-days-time",
  title: "Days, dates & time",
  icon: "📅",
  lessonDates: ["2026-07-07", "2026-07-08", "2026-08-25", "2026-10-19"],
  items: [
    ["pondelok", "Monday"],
    ["utorok", "Tuesday"],
    ["streda", "Wednesday"],
    ["štvrtok", "Thursday"],
    ["piatok", "Friday"],
    ["sobota", "Saturday"],
    ["nedeľa", "Sunday"],
    ["v pondelok", "on Monday"],
    ["vo štvrtok", "on Thursday"],
    ["deň", "day"],
    ["týždeň", "week"],
    ["dnes", "today"],
    ["včera", "yesterday", "Don't mix it up with večera (dinner)!"],
    ["zajtra", "tomorrow"],
    ["ráno", "morning"],
    ["večer", "evening"],
    ["teraz", "now"],
    ["čas", "time"],
    ["vždy", "always"],
    ["niekedy", "sometimes"],
    ["každý deň", "every day"],
    ["každý deň to isté", "every day the same"],
    ["budúci týždeň", "next week"],
    ["o deviatej", "at nine (o'clock)"],
    ["Aký je dnes deň?", "What day is it today?"],
    ["Dnes je štvrtok.", "Today is Thursday."],
    ["Včera bol pondelok.", "Yesterday was Monday."],
    ["Včera bola streda.", "Yesterday was Wednesday.", "bola, because streda is feminine"],
    ["Zajtra bude piatok.", "Tomorrow will be Friday."],
    ["Aký deň bol včera?", "What day was it yesterday?"],
    ["Aký je dnes dátum? | Koľkého je dnes?", "What is the date today?"],
    ["Aký je tvoj obľúbený deň?", "What is your favourite day?"],
    ["Môj obľúbený deň je sobota.", "My favourite day is Saturday."],
    ["Kedy sa vidíme?", "When do we see each other?"],
    ["narodeniny", "birthday"],
    ["meniny", "name day"],
    ["Zajtra máš narodeniny.", "Your birthday is tomorrow."],
    ["Všetko najlepšie!", "Happy birthday! / All the best!"],
    ["Gratulujem!", "Congratulations!"],
    ["Vianoce", "Christmas"],
    ["Nový rok", "New Year"]
  ],
  grammar: [
    {
      id: "days", title: "Days of the week",
      rows: [["Monday", "pondelok"], ["Tuesday", "utorok"], ["Wednesday", "streda"], ["Thursday", "štvrtok"], ["Friday", "piatok"], ["Saturday", "sobota"], ["Sunday", "nedeľa"]]
    },
    {
      id: "yesterday-today-tomorrow", title: "Yesterday was / today is / tomorrow will be",
      note: "Včera bol pondelok (masc.) · Včera bola streda / sobota / nedeľa (fem.)",
      rows: [["yesterday was (pondelok)", "včera bol"], ["yesterday was (streda)", "včera bola"], ["today is", "dnes je"], ["tomorrow will be", "zajtra bude"]]
    }
  ],
  dialogues: [
    { q: "Aký je dnes deň?", en: "What day is it today?", a: ["Dnes je štvrtok.", "Dnes je utorok."] },
    { q: "Aký je tvoj obľúbený deň?", en: "What is your favourite day?", a: ["Môj obľúbený deň je sobota.", "Môj obľúbený deň je piatok."] },
    { q: "Kedy sa vidíme?", en: "When do we see each other?", a: ["Uvidíme sa vo štvrtok.", "Uvidíme sa zajtra."] }
  ]
});
