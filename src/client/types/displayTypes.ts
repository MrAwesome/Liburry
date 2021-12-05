import {RawKnownDisplayTypeEntry} from "../configHandler/zodConfigTypes";

export enum MainDisplayAreaMode {
    DEFAULT = "DEFAULT",
    SEARCH = "SEARCH",
    PAGE = "PAGE",
}

export type DisplayType = keyof RawKnownDisplayTypeEntry;
export type DataType = RawKnownDisplayTypeEntry[DisplayType];

