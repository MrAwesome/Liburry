import SearchWorkerStateMachine, {getSearchWorkerMessageHandler, WorkerInitState} from "./SearchWorkerStateMachine";
import {genLoadFinalConfigWILLTHROW} from "../../../scripts/compileYamlLib";
import 'jsdom-worker';
import DBConfig from "../../configHandler/DBConfig";
import {SearcherType} from "../searchers/Searcher";
import {waitFor} from "@testing-library/react";
import {PerDictResultsRaw} from "../../types/dbTypes";

// A basic test to ensure that each searcher type meets two criteria:
// 1) The ability to load search data from disk in tests (as a proxy for testing fetches, which can be done in end-to-end tests), as part of successfully passing through the search worker state machine.
// 2) That a search for an exact match ("bobby") matches exactly that string. This seems like a reasonable expectation of any searcher, but if for some reason it isn't, the test can be changed or the searcher can be excluded from that portion.
const searcherTypes = Object.keys(SearcherType).filter((enumName) => !enumName.startsWith("DISABLED_"));

describe.each(searcherTypes)('basic search test', (searcherType) => {
    test(searcherType, async () => {
        const dbID = 'angry';
        const appID = "test/simpletest";
        const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride: [appID]});
        const dbConfig = new DBConfig(dbID, rfc.appConfigs[appID]!.configs.dbConfig.config.dbConfigs[dbID]!);
        const stmach = new SearchWorkerStateMachine("TEST_MODE_NO_WORKER");
        expect(stmach.state.init).toBe(WorkerInitState.UNINITIALIZED);
        stmach.start(dbID, dbConfig, false, SearcherType[searcherType as keyof typeof SearcherType]);
        expect(stmach.state.init).toBe(WorkerInitState.LOADING);
        await waitFor(() => {expect(stmach.state.init).toBe(WorkerInitState.LOADED);});
        stmach.search("bobby", 6);
        expect(stmach.state.init).toBe(WorkerInitState.SEARCHING);
        await waitFor(() => {expect(stmach.state.init).toBe(WorkerInitState.LOADED);});
        expect((stmach.mostRecentResultOrFailure as PerDictResultsRaw).results.length).toBe(1);
        expect((stmach.mostRecentResultOrFailure as PerDictResultsRaw).results[0].fields.find((field) => field.colName == 'target')?.value).toBe('draco');
        stmach.search("x987sahjhdasDDDDxxFJKDL", 7);
        expect(stmach.state.init).toBe(WorkerInitState.SEARCHING);
        await waitFor(() => {expect(stmach.state.init).toBe(WorkerInitState.LOADED);});
        expect((stmach.mostRecentResultOrFailure as PerDictResultsRaw).results.length).toBe(0);

        // [] TODO: make all fetches in searchers both jest-safe *and* still update the progressbar state - have a single function for "fetch/loadfromdisk, update, return text" for plaintext csv dicts
        // [] TODO: use describes().each() to ensure that this basic test (and others?) passes for all searcher types, or at least all currently-known searcher types
        // [] TODO: write unit tests for individual searcher's search logic (fuzzy searches should match via fuzzy but not regex, etc)
    });
});
