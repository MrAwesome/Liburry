import {RawKnownDisplayTypeEntry} from "../configHandler/zodConfigTypes";

export enum MainDisplayAreaMode {
    HOME = "HOME",
    SEARCH = "SEARCH",
    ABOUT = "ABOUT",
    CONTACT = "CONTACT",
    SETTINGS = "SETTINGS",
}

export type DisplayType = keyof RawKnownDisplayTypeEntry;
export type DataType = RawKnownDisplayTypeEntry[DisplayType];

