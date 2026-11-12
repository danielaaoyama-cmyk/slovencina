// Unit 16 — Cases (pády): feminine -a nouns and "ja"
(window.SK_UNITS = window.SK_UNITS || []).push({
  id: "16-cases",
  title: "Cases (pády)",
  icon: "🧩",
  lessonDates: ["2026-07-07", "2026-08-06", "2026-08-17", "2026-10-12", "2026-11-10"],
  items: [
    ["Mám sestru.", "I have a sister. (4th case: -u)"],
    ["Idem od sestry.", "I'm coming from my sister's. (2nd case: -y)"],
    ["Dám to sestre.", "I'll give it to my sister. (3rd case: -e)"],
    ["Hovorím o sestre.", "I'm talking about my sister. (6th case: -e)"],
    ["Idem so sestrou.", "I'm going with my sister. (7th case: -ou)"],
    ["Mám kávu.", "I have coffee."],
    ["Vidím mamu.", "I see mom."],
    ["Hovorí o mne.", "He's talking about me."],
    ["Ideš so mnou?", "Are you coming with me?"],
    ["Daj mi to.", "Give it to me."]
  ],
  grammar: [
    {
      id: "cases-questions", title: "The 6 cases — what they answer", drill: false,
      note: "Slovak nouns change their ending depending on their role in the sentence.",
      rows: [["1. nominative", "kto? čo? — žena"], ["2. genitive", "od koho? bez koho? (from whom) — ženy"], ["3. dative", "komu? (to whom) — žene"], ["4. accusative", "koho? čo? (I see her) — ženu"], ["6. locative", "o kom? (about whom) — o žene"], ["7. instrumental", "s kým? (with whom) — so ženou"]]
    },
    {
      id: "sestra-sg", title: "sestra — singular",
      rows: [["1. kto? (sister)", "sestra"], ["2. from whom (od…)", "sestry"], ["3. to whom", "sestre"], ["4. I see / I have", "sestru"], ["6. about whom (o…)", "sestre"], ["7. with whom (so…)", "sestrou"]]
    },
    {
      id: "zena-sg", title: "žena — singular",
      rows: [["1. kto? (woman)", "žena"], ["2. from whom", "ženy"], ["3. to whom", "žene"], ["4. I see / I have", "ženu"], ["6. about whom", "žene"], ["7. with whom", "ženou"]]
    },
    {
      id: "zena-pl", title: "ženy — plural",
      rows: [["1. kto? (women)", "ženy"], ["2. from whom", "žien"], ["3. to whom", "ženám"], ["4. I see / I have", "ženy"], ["6. about whom", "ženách"], ["7. with whom", "ženami"]]
    },
    {
      id: "ja-cases", title: "ja (I / me)",
      rows: [["1. I", "ja"], ["2. from me", "mňa"], ["3. to me", "mne"], ["4. (sees) me", "mňa"], ["6. about me (o…)", "mne"], ["7. with me (so…)", "mnou"]]
    },
    {
      id: "a-endings", title: "Endings for feminine nouns in -a",
      note: "Works for žena, sestra, mama, káva, kniha…",
      rows: [["1.", "-a"], ["2. from whom", "-y"], ["3. to whom", "-e"], ["4. I see her", "-u"], ["6. about whom", "-e"], ["7. with whom", "-ou"]]
    }
  ]
});
