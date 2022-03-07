import {runningInJest, runningInNode} from '../client/utils';

export async function loadPublicFileAsPlainText(
    filename: string,
    onFileLoadLambda?: () => Promise<void>,
): Promise<string> {
    const isRunningInNodeOrJest = runningInJest() || runningInNode();

    if (isRunningInNodeOrJest) {
        const fs = await import('fs');
        const {promisify} = await import('util');
        const readFile = promisify(fs.readFile);

        const rawFile = await readFile("public/" + filename, null);
        onFileLoadLambda?.();
        return rawFile.toString();
    } else {
        const rawResponse = await fetch(filename);
        onFileLoadLambda?.();
        return rawResponse.text();
    }
}

