// Unit 11 — Weather & seasons
(window.SK_UNITS = window.SK_UNITS || []).push({
  id: "11-weather",
  title: "Weather & seasons",
  icon: "🌦️",
  lessonDates: ["2026-08-14", "2026-08-17", "2026-08-25", "2026-11-10"],
  items: [
    ["počasie", "weather"],
    ["Aké je dnes počasie?", "What's the weather like today?"],
    ["Aké je dnes u vás počasie?", "What's the weather like where you are today?"],
    ["Aké bolo včera počasie?", "What was the weather like yesterday?"],
    ["Dnes je teplo.", "It's warm today."],
    ["Dnes je horúco.", "It's hot today."],
    ["Dnes je chladno.", "It's cold today."],
    ["zamračené", "cloudy"],
    ["Prší.", "It's raining."],
    ["Tu prší.", "It's raining here."],
    ["Teraz je zamračené.", "Now it's cloudy."],
    ["Tu je zamračené a prší.", "Here it's cloudy and raining."],
    ["Fúka silný vietor.", "A strong wind is blowing."],
    ["vietor", "wind"],
    ["dážď", "rain"],
    ["búrka", "storm"],
    ["hrom", "thunder"],
    ["blesk", "lightning"],
    ["35 stupňov | tridsaťpäť stupňov", "35 degrees"],
    ["Koľko stupňov je v Bratislave?", "How many degrees is it in Bratislava?"],
    ["ročné obdobie", "season"],
    ["jar", "spring"],
    ["leto", "summer"],
    ["jeseň", "autumn, fall"],
    ["zima", "winter"]
  ],
  grammar: [
    {
      id: "seasons", title: "Seasons",
      rows: [["spring", "jar"], ["summer", "leto"], ["autumn", "jeseň"], ["winter", "zima"]]
    },
    {
      id: "weather-words", title: "Dnes je… (today it is…)",
      rows: [["warm", "teplo"], ["hot", "horúco"], ["cold", "chladno"], ["cloudy", "zamračené"]]
    }
  ],
  dialogues: [
    { q: "Aké je dnes počasie?", en: "What's the weather like today?", a: ["Dnes je teplo.", "Je zamračené a prší.", "Dnes je chladno."] },
    { q: "Aké je dnes u vás počasie?", en: "What's the weather like where you are?", a: ["Tu prší.", "Fúka silný vietor."] },
    { q: "Aké ročné obdobie máš rada?", en: "Which season do you like?", a: ["Mám rada leto.", "Mám rada jar."] }
  ]
});
