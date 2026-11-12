// Unit 7 — About me: where I'm from, where I live, my work
(window.SK_UNITS = window.SK_UNITS || []).push({
  id: "07-about-me",
  title: "About me",
  icon: "🙋",
  lessonDates: ["2026-07-07", "2026-07-23", "2026-08-10", "2026-08-25", "2026-10-12", "2026-10-19"],
  items: [
    ["Odkiaľ si?", "Where are you from?"],
    ["Som z Talianska.", "I'm from Italy."],
    ["Som z Talianska, ale bývam v Bratislave.", "I'm from Italy, but I live in Bratislava."],
    ["Kde bývaš? | Kde žiješ?", "Where do you live?"],
    ["Bývam v Bratislave.", "I live in Bratislava."],
    ["Bývaš sama?", "Do you live alone? (to a woman)"],
    ["Nebývam sama.", "I don't live alone. (woman)"],
    ["Bývam s Petrom.", "I live with Peter."],
    ["s | so", "with"],
    ["Akej si národnosti?", "What nationality are you?"],
    ["Som Talianka.", "I'm Italian. (woman)"],
    ["Talianka", "Italian woman"],
    ["Talian", "Italian man"],
    ["Taliani", "Italians"],
    ["Narodila som sa v Taliansku.", "I was born in Italy. (woman)"],
    ["Narodila som sa prvého mája.", "I was born on the 1st of May."],
    ["narodiť sa", "to be born"],
    ["práca", "work, job"],
    ["pracovať", "to work"],
    ["Kde pracuješ?", "Where do you work?"],
    ["Pracujem v kancelárii.", "I work in an office."],
    ["Aká je tvoja práca?", "What is your job?"],
    ["Čo robíš?", "What do you do?"],
    ["Som účtovníčka.", "I'm an accountant. (woman)"],
    ["účtovníčka", "accountant (woman)"],
    ["účtovník", "accountant (man)"],
    ["právnička", "lawyer (woman)"],
    ["právnik", "lawyer (man)"],
    ["Ideš do práce?", "Are you going to work?"],
    ["Áno, idem.", "Yes, I'm going."],
    ["Peter išiel do práce.", "Peter went to work."],
    ["Peter išiel do práce alebo je doma?", "Did Peter go to work or is he at home?"],
    ["Kedy ide do práce?", "When is he going to work?"],
    ["Hovoríš po anglicky?", "Do you speak English?"],
    ["po slovensky", "in Slovak"],
    ["slovenský jazyk", "the Slovak language"],
    ["Učím sa po slovensky.", "I'm learning Slovak."],
    ["učiť sa", "to learn, to study"]
  ],
  grammar: [
    {
      id: "jobs-female", title: "Jobs: man → woman", drill: false,
      note: "Women's job names usually end in -ka or -yňa.",
      rows: [["účtovník → účtovníčka", "-ník → -níčka"], ["právnik → právnička", "-ik → -ička"], ["Talian → Talianka", "+ ka"]]
    }
  ],
  dialogues: [
    { q: "Odkiaľ si?", en: "Where are you from?", a: ["Som z Talianska, ale bývam v Bratislave.", "Som z Talianska."] },
    { q: "Kde bývaš?", en: "Where do you live?", a: ["Bývam v Bratislave."] },
    { q: "Bývaš sama?", en: "Do you live alone?", a: ["Nebývam sama. Bývam s Petrom."] },
    { q: "Akej si národnosti?", en: "What nationality are you?", a: ["Som Talianka."] },
    { q: "Kde pracuješ?", en: "Where do you work?", a: ["Pracujem v kancelárii. Som účtovníčka."] },
    { q: "Hovoríš po anglicky?", en: "Do you speak English?", a: ["Áno, hovorím po anglicky.", "Iba trochu."] },
    { q: "Ideš do práce?", en: "Are you going to work?", a: ["Áno, idem.", "Nie, dnes som doma."] }
  ]
});
