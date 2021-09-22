import {MATCH_END, MATCH_START} from "./constants";

function replaceAll(input: string, search: string, replace: string) { return input.split(search).join(replace); }

export function createMatchElement(inputText: string, className: string, key?: string): JSX.Element {
    // NOTE: https://github.com/farzher/fuzzysort/issues/66
    // NOTE: input to this MUST have been passed through DOMPurify/xss or similar.
    const startsReplaced = replaceAll(inputText, MATCH_START, "<mark>");
    const output = replaceAll(startsReplaced, MATCH_END, "</mark>");
    const rawHtml = {__html: output};
    return <div className={className} dangerouslySetInnerHTML={rawHtml} key={key}></div>;
}
