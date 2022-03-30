// NOTE! If these imports break, you just need to run the yaml compilation step.
// `yarn start` or `yarn build` should be sufficient.
//
// See config-overrides.js for more info.

// TODO: just write out the types you want instead
//import type {dialects} from "../generated/i18n.json";
//type I18N = typeof dialects;
//export type DialectID = keyof I18N;
//export type I18NToken = keyof I18N['eng_us']['tokens'];

export type {I18NToken, KnownDialectID} from "../generated/i18n"
