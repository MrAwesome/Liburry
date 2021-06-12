const fs = require('fs')
const {normalizeSync} = require("normalize-diacritics");
const papaparse = require("papaparse");
const fetch = require("node-fetch");
//const langUtils = require("./languageUtils");
//const {DATABASES} = require("../searchSettings");

// TODO: fix imports, de-dupe from languageUtils
function fromPojUnicodeToPojNormalized(pojUnicode) {
  const noNasal = pojUnicode.replace(/ⁿ/g, '');
  const noBars = noNasal.replace(/[\u030d\u0358]/g, '');
  const converted = normalizeSync(noBars);
  return converted;
}

const URL_PREFIX = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/raw/master/ChhoeTaigiDatabase/";
const OUTPUT_PREFIX = "public/db/";

// TODO: de-dupe
const LIL_DATABASES = [
  {
    name: "maryknoll",
    dbCSV: "ChhoeTaigi_MaryknollTaiengSutian.csv",
  },
  {
    name: "embree",
    dbCSV: "ChhoeTaigi_EmbreeTaiengSutian.csv",
  }, {
    name: "giku",
    dbCSV: "ChhoeTaigi_TaioanPehoeKichhooGiku.csv",
  }
]

LIL_DATABASES.forEach((langDB) => {
  console.log(langDB);
  const url = URL_PREFIX + langDB.dbCSV;

  fetch(url).then((resp) => {
    resp.text().then((text) => {
      text = text.replace(/^\uFEFF/, "");
      const csv = papaparse.parse(text, {header: true, skipEmptyLines: true});
      csv.data.forEach((entry, index) => {
        csv.data[index].poj_normalized = fromPojUnicodeToPojNormalized(entry.poj_unicode);
      });

      const newCSVText = papaparse.unparse(csv.data, {header: true});

      fs.writeFile(`${OUTPUT_PREFIX}/${langDB.dbCSV}`, newCSVText, (err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
      });
    });
  });
});
