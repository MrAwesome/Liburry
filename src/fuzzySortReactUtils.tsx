import DOMPurify from "dompurify";
import {MATCH_HTML_TAG} from "./constants";

export function createMatchElement(inputText: string, className: string): JSX.Element {
    // NOTE: https://github.com/farzher/fuzzysort/issues/66
    var clean = DOMPurify.sanitize(inputText, {ALLOWED_TAGS: [MATCH_HTML_TAG]});
    const rawHtml = {__html: clean};
    return <span className={className} dangerouslySetInnerHTML={rawHtml}></span>;
}
