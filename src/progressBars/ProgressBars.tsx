export const PROGRESS_BAR_ANIMATION_LENGTH = 200;
export const PROGRESS_BARS_HEIGHT = "4px";

// TODO(wishlist): color-coded DBs, with loading bar color matching a color on the entrycontainer,
//                 and a bar for each db

export function makeProgressBar(
    percentProgress: number,
    elementID: string,
    durationMs: number,
): JSX.Element {
    const widthPercent = Math.min(percentProgress * 100, 100);
    return <div
        id={elementID}
        className="loadingBar"
        style={{
            width: `${widthPercent}%`,
            transitionDuration: `${durationMs}ms`,
        }}
        key={elementID}
    />;
}
