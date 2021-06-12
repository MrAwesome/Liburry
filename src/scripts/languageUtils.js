const {normalizeSync} = require("normalize-diacritics");

export function fromPojUnicodeToPojNormalized(pojUnicode) {
    const noNasal = pojUnicode.replace(/ⁿ/g, '');
    const noBars = noNasal.replace(/[\u030d\u0358]/g, '');
    const converted = normalizeSync(noBars);
    return converted;
}
