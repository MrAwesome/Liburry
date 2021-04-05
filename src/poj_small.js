const poj = [
  {
    id: "1",
    poj_unicode: "a",
    poj_input: "a",
    kip_unicode: "a",
    kip_input: "a",
    hoabun: "阿",
    english:
      "initial particle, prefix to names of familiar people, as: A-beng... A-hoat... A-tho...",
    page_number: ""
  },
  {
    id: "2",
    poj_unicode: "a",
    poj_input: "a",
    kip_unicode: "a",
    kip_input: "a",
    hoabun: "鴉",
    english: "crow",
    page_number: ""
  },
  {
    id: "3",
    poj_unicode: "a",
    poj_input: "a",
    kip_unicode: "a",
    kip_input: "a",
    hoabun: "亞",
    english: "second, next to, inferior",
    page_number: ""
  },
  {
    id: "4",
    poj_unicode: "á",
    poj_input: "a2",
    kip_unicode: "á",
    kip_input: "a2",
    hoabun: "或，亦",
    english:
      "or (conjunction), introduces an alternative or a word that explains or means the same",
    page_number: ""
  },
  {
    id: "5",
    poj_unicode: "Lí sī ha̍k-seng á m̄ sī?",
    poj_input: "Li2 si7 hak8-seng a2 m7 si7?",
    kip_unicode: "Lí sī ha̍k-sing á m̄ sī?",
    kip_input: "Li2 si7 hak8-sing a2 m7 si7?",
    hoabun: "你是不是學生？",
    english: "Are you a student?",
    page_number: ""
  },
  {
    id: "6",
    poj_unicode: "Lí ū chîⁿ á bô?",
    poj_input: "Li2 u7 chinn5 a2 bo5?",
    kip_unicode: "Lí ū tsînn á bô?",
    kip_input: "Li2 u7 tsinn5 a2 bo5?",
    hoabun: "你有沒有錢？",
    english: "Do you have money?",
    page_number: ""
  },
  {
    id: "7",
    poj_unicode: "Lí boeh khì á m̄?",
    poj_input: "Li2 boeh khi3 a2 m7?",
    kip_unicode: "Lí bueh khì á m̄?",
    kip_input: "Li2 bueh khi3 a2 m7?",
    hoabun: "你要不要去？",
    english: "Do you want to go?",
    page_number: ""
  },
  {
    id: "8",
    poj_unicode: "á",
    poj_input: "a2",
    kip_unicode: "á",
    kip_input: "a2",
    hoabun: "子，兒",
    english:
      "particle used after one syllable nouns for euphony, suffix of nouns, often diminutive",
    page_number: ""
  },
  {
    id: "9",
    poj_unicode: "bō-á",
    poj_input: "bo7-a2",
    kip_unicode: "bō-á",
    kip_input: "bo7-a2",
    hoabun: "帽子",
    english: "hat",
    page_number: ""
  },
  {
    id: "10",
    poj_unicode: "chhiū-á",
    poj_input: "chhiu7-a2",
    kip_unicode: "tshiū-á",
    kip_input: "tshiu7-a2",
    hoabun: "樹",
    english: "tree",
    page_number: ""
  },
  {
    id: "11",
    poj_unicode: "í-á",
    poj_input: "i2-a2",
    kip_unicode: "í-á",
    kip_input: "i2-a2",
    hoabun: "椅子",
    english: "chair",
    page_number: ""
  },
  {
    id: "12",
    poj_unicode: "káu-á",
    poj_input: "kau2-a2",
    kip_unicode: "káu-á",
    kip_input: "kau2-a2",
    hoabun: "狗，小狗",
    english: "dog",
    page_number: ""
  },
  {
    id: "13",
    poj_unicode: "A-bēng",
    poj_input: "A-beng7",
    kip_unicode: "A-bīng",
    kip_input: "A-bing7",
    hoabun: "亞孟",
    english: "Amen! So be it!",
    page_number: ""
  },
  {
    id: "14",
    poj_unicode: "a-bó (a-bú)",
    poj_input: "a-bo2 (a-bu2)",
    kip_unicode: "a-bó (a-bú)",
    kip_input: "a-bo2 (a-bu2)",
    hoabun: "母親，媽媽",
    english: "mother, mama",
    page_number: ""
  },
  {
    id: "15",
    poj_unicode: "a-cha",
    poj_input: "a-cha",
    kip_unicode: "a-tsa",
    kip_input: "a-tsa",
    hoabun: "骯髒",
    english: "dirty",
    page_number: ""
  },
  {
    id: "16",
    poj_unicode: "a-ché (a-chí)",
    poj_input: "a-che2 (a-chi2)",
    kip_unicode: "a-tsé (a-tsí)",
    kip_input: "a-tse2 (a-tsi2)",
    hoabun: "姊姊",
    english: "sister (elder sister)",
    page_number: ""
  },
  {
    id: "17",
    poj_unicode: "a-chek",
    poj_input: "a-chek",
    kip_unicode: "a-tsik",
    kip_input: "a-tsik",
    hoabun: "叔父，叔叔",
    english: "uncle (father's younger brothers)",
    page_number: ""
  },
  {
    id: "18",
    poj_unicode: "a-chím",
    poj_input: "a-chim2",
    kip_unicode: "a-tsím",
    kip_input: "a-tsim2",
    hoabun: "嬸母，嬸嬸",
    english: "aunt, wife of an uncle on the father's side of the family",
    page_number: ""
  },
  {
    id: "19",
    poj_unicode: "A-chiu",
    poj_input: "A-chiu",
    kip_unicode: "A-tsiu",
    kip_input: "A-tsiu",
    hoabun: "亞洲",
    english: "Asia",
    page_number: ""
  },
  {
    id: "20",
    poj_unicode: "A-chiu kim-iông-hong-po̍k",
    poj_input: "A-chiu kim-iong5-hong-pok8",
    kip_unicode: "A-tsiu kim-iông-hong-po̍k",
    kip_input: "A-tsiu kim-iong5-hong-pok8",
    hoabun: "亞洲金融風暴",
    english: "Asian financial storm",
    page_number: ""
  },
  {
    id: "21",
    poj_unicode: "a-chó͘",
    poj_input: "a-choo2",
    kip_unicode: "a-tsóo",
    kip_input: "a-tsoo2",
    hoabun: "曾祖父母",
    english: "great grandparents on both sides of the family",
    page_number: ""
  },
  {
    id: "22",
    poj_unicode: "a-hiaⁿ",
    poj_input: "a-hiann",
    kip_unicode: "a-hiann",
    kip_input: "a-hiann",
    hoabun: "哥哥",
    english: "brother (elder brother)",
    page_number: ""
  },
  {
    id: "23",
    poj_unicode: "a-hui",
    poj_input: "a-hui",
    kip_unicode: "a-hui",
    kip_input: "a-hui",
    hoabun: "阿飛",
    english:
      "young man who combines the characteristics of a hippie and a juvenile delinquent",
    page_number: ""
  },
  {
    id: "24",
    poj_unicode: "a-î",
    poj_input: "a-i5",
    kip_unicode: "a-î",
    kip_input: "a-i5",
    hoabun: "阿姨，姨媽",
    english: "aunt, (mother's sisters)",
    page_number: ""
  },
  {
    id: "25",
    poj_unicode: "a-iân",
    poj_input: "a-ian5",
    kip_unicode: "a-iân",
    kip_input: "a-ian5",
    hoabun: "亞鉛，鋅",
    english: "zinc",
    page_number: ""
  }
];

export default poj;
