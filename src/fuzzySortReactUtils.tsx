export function createMatchElement(inputText: string, className: string): JSX.Element {
    // NOTE: https://github.com/farzher/fuzzysort/issues/66
    // NOTE: input to this MUST have been passed through DOMPurify/xss or similar.
    const rawHtml = {__html: inputText};
    return <span className={className} dangerouslySetInnerHTML={rawHtml}></span>;
}
