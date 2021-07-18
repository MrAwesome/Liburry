import {normalizeSync} from "normalize-diacritics";

export function fromPojUnicodeToPojNormalized(pojUnicode: string) {
    const noNasal = pojUnicode.replace(/ⁿ/g, '');
    const noBars = removeBars(noNasal);
    const converted = normalizeSync(noBars);
    return converted;
}

// NOTE: "nn" can be removed here, a kip user may know a preference.
export function fromKipUnicodeToKipNormalized(kipUnicode: string) {
    const noBars = removeBars(kipUnicode);
    const converted = normalizeSync(noBars);
    return converted;
}

// Removes vertical bars: "hoa̍t" becomes "hoat"
function removeBars(barred: string) {
    return barred.replace(/[\u030d\u0358]/g, '');
}
