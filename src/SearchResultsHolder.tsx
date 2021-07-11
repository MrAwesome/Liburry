import {typeGuard} from "./typeguard";
import {DBName, PerDictResults, SearchResultEntryData} from "./types/dbTypes";

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

    getAllResults(): SearchResultEntryData[] {
        let allPerDictRes = Array.from(this.currentResults.values()).filter(typeGuard) as PerDictResults[];

        let entries: SearchResultEntryData[] = [];

        // Flatten out all results
        allPerDictRes.forEach((perDict: PerDictResults) => {
            perDict.results.forEach((rawEntry: SearchResultEntryData) => {
                entries.push(rawEntry);
            });
        });

        // TODO: Sort on add? Sort first in worker? Store all results flat and just sort as they come in?
        entries.sort((a, b) => b.dbSearchRanking.score - a.dbSearchRanking.score);

        return entries;
    }
}

