import FieldClassificationHandler from "./search/FieldClassificationHandler";
import {typeGuard} from "./typeguard";
import {DBName, PerDictResults, PerDictResultsRaw, SearchResultEntry} from "./types/dbTypes";

export default class SearchResultsHolder {
    currentResults: Map<DBName, PerDictResults> = new Map();
    numResults: number = 0;

    addResults(res: PerDictResultsRaw, fieldHandler: FieldClassificationHandler): this {
        const parsedRes = PerDictResults.from(res, fieldHandler)
        this.currentResults.set(res.dbName, parsedRes);
        this.numResults += res.results.length;
        return this;
    }

    clear(): this {
        this.currentResults = new Map();
        this.numResults = 0;
        return this;
    }

    getNumResults(): number {
        return this.numResults;
    }

    getAllResults(): SearchResultEntry[] {
        let allPerDictRes = Array.from(this.currentResults.values()).filter(typeGuard) as PerDictResults[];

        // NOTE: this could be cached, and only updated/sorted on add.
        let entries: SearchResultEntry[] = [];

        // Flatten out all results
        allPerDictRes.forEach((perDict: PerDictResults) => {
            perDict.getResults().forEach((rawEntry: SearchResultEntry) => {
                entries.push(rawEntry);
            });
        });

        // TODO: Sort on add? Sort first in worker? Store all results flat and just sort as they come in?
        entries.sort((a, b) => b.getRanking().score - a.getRanking().score);

        return entries;
    }
}

