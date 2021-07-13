import DOMPurify from "dompurify";

export function createMatchElement(inputText: string, className: string): JSX.Element {
    // NOTE: https://github.com/farzher/fuzzysort/issues/66
    var clean = DOMPurify.sanitize(inputText, {ALLOWED_TAGS: ['mark']});
    const rawHtml = {__html: clean};
    return <span className={className} dangerouslySetInnerHTML={rawHtml}></span>;
}
