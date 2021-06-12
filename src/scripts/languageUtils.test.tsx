import {fromPojUnicodeToPojNormalized} from "./languageUtils";

test('test normalization', () => {
    const matches: [string, string][] = [
        ["tîn-hiuⁿ hoa̍t", "tin-hiu hoat"],
        ["ngó͘-ho̍k", "ngo-hok"],
        ["hm̍h-hm̍h", "hmh-hmh"],
        ["Kiò lí mài chhap, lí to boeh, chím-á khì pōaⁿ-tio̍h lûi-kong-bóe a hoⁿh.", 
         "Kio li mai chhap, li to boeh, chim-a khi poa-tioh lui-kong-boe a hoh."],
        ["Kóng hiah ê bô-ì-bô-sù ê ōe, thiaⁿ liáu khí-mo͘ chiâⁿ bái.",
         "Kong hiah e bo-i-bo-su e oe, thia liau khi-mo chia bai."],
        ["khòaⁿ bô tio̍h", "khoa bo tioh"],
        ["ôôô", "ooo"],
        ["ó͘ó͘ó͘", "ooo"],
        ["ó͘ôō", "ooo"],
    ];
    matches.forEach(([pojText, normText]) => {
        expect(fromPojUnicodeToPojNormalized(pojText)).toBe(normText);
    });
});
