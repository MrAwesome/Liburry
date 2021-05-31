import {typeGuard} from "./typeguard";
import {DBName, PerDictResults, SearchResultEntry} from "./types/dbTypes";

export default class SearchResultsHolder {
    currentResults: Map<DBName, PerDictResults> = new Map();
    numResults: number = 0;

    addResults(res: PerDictResults): this {
        this.currentResults.set(res.dbName, res);
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

        let entries: SearchResultEntry[] = [];

        // Flatten out all results
        allPerDictRes.forEach((perDict: PerDictResults) => {
            perDict.results.forEach((entry: SearchResultEntry) => {
                entries.push(entry);
            });
        });

        // TODO: Sort on add? Sort first in worker? Store all results flat and just sort as they come in?
        entries.sort((a, b) => b.dbSearchRanking - a.dbSearchRanking);

        return entries;
    }
}

