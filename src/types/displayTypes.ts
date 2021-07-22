export enum MainDisplayAreaMode {
    HOME = "HOME",
    SEARCH = "SEARCH",
    ABOUT = "ABOUT",
    CONTACT = "CONTACT",
    SETTINGS = "SETTINGS",
}

export type FieldDisplayType =
    "base_phrase" |
    "channel_name" |
    "class" |
    "contributor" |
    "date_YYYY.MM.DD" |
    "definition" |
    "example" |
    "example_phrase" |
    "explanation" |
    "id" |
    "input" |
    "input_other" |
    "link" |
    "matched_example" |
    "measure_word" |
    "normalized" |
    "opposite" |
    "other" |
    "other_input" |
    "page_number" |
    "pos_classification" |
    "see_also" |
    "synonym" |
    "type" |
    "UNKNOWN" |
    "vocab" |
    "vocab_other";
