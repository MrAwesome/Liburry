import {typeGuard} from "../../typeguard";
import {DBIdentifier} from "../../types/config";
import {AnnotatedPerDictResults, AnnotatedSearchResultEntry} from "../../types/dbTypes";

// NOTE: storing results per-dict is almost certainly not necessary anymore
//       instead, this should use a worker-unique ID (which, for now, is the DB name)
export default class SearchResultsHolder {
    currentResults: Map<DBIdentifier, AnnotatedPerDictResults> = new Map();
    numResults: number = 0;

    // NOTE: this just plops a "per-dict results" object in at the noted db. In the future, results should just be added directly to a large list, or to the list per-dict if that's still important
    addResults(res: AnnotatedPerDictResults): this {
        this.currentResults.set(res.getDBIdentifier(), res);
        this.numResults += res.getResults().length;
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

    getAllResults(): AnnotatedSearchResultEntry[] {
        let allPerDictRes = Array.from(this.currentResults.values()).filter(typeGuard) as AnnotatedPerDictResults[];

        // NOTE: this could be cached, and only updated/sorted on add.
        let entries: AnnotatedSearchResultEntry[] = [];

        // Flatten out all results
        allPerDictRes.forEach((perDict: AnnotatedPerDictResults) => {
            perDict.getResults().forEach((rawEntry: AnnotatedSearchResultEntry) => {
                entries.push(rawEntry);
            });
        });

        // TODO: Sort on add? Sort first in worker? Store all results flat and just sort as they come in?
        entries.sort((a, b) => b.getRanking().score - a.getRanking().score);

        return entries;
    }
}

