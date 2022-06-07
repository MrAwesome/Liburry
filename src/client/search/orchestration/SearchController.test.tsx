import {getExampleTaigiRes} from "../../../common/testUtils";
import {genLoadFinalConfigWILLTHROW} from "../../../scripts/compileYamlLib";
import OptionsChangeableByUser from "../../ChhaTaigiOptions";
import AppConfig from "../../configHandler/AppConfig";
import {annotateRawResults, PerDictResultsRaw} from "../../types/dbTypes";
import {SearcherType, SearchFailure} from "../searchers/Searcher";
import SearchController from "./SearchController";
import {SearchWorkerResponseMessage, SearchWorkerResponseType} from "./SearchWorkerStateMachine";

const appID = "test/simpletest";
const dbIdentifier = "angry";
const perDictRes = getExampleTaigiRes();
const query = "fake_query";
const searchID = 0;

describe('searchcontroller', () => {
    let sc: SearchController;
    let results: PerDictResultsRaw;

    let genUpdateDisplayForSearchEvent: jest.Mock;
    let genUpdateDisplayForDBLoadEvent: jest.Mock;
    let genClearResultsCallback: jest.Mock;
    let genAddResultsCallback: jest.Mock;
    let getNewestQuery: jest.Mock;

    beforeEach(async () => {
        const options = new OptionsChangeableByUser();
        const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride: [appID]});
        const appConfig = AppConfig.from(rfc, {...options, appID});
        results = annotateRawResults(perDictRes, appConfig);
        // = new AnnotatedPerDictResults(annotatedResRaw);

        genUpdateDisplayForSearchEvent = jest.fn();
        genUpdateDisplayForDBLoadEvent = jest.fn();
        genClearResultsCallback = jest.fn();
        genAddResultsCallback = jest.fn();
        getNewestQuery = jest.fn(() => query);

        const scArgs = {
            debug: false,
            // () => string,
            getNewestQuery,
            appConfig,
            // (results: AnnotatedPerDictResults) => Promise<void>
            genAddResultsCallback,
            // () => Promise<void>
            genClearResultsCallback,
            // (dbStats: AllDBLoadStats | {didReload: true}) => Promise<void>,
            genUpdateDisplayForDBLoadEvent,
            // (searchContext: SearchContext | null) => Promise<void>,
            genUpdateDisplayForSearchEvent,
        };
        sc = new SearchController(scArgs);
        sc.searchWorkerManager.searchSpecificDB = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('run search', async () => {
        const clearResults = jest.spyOn(sc, 'clearResultsCallback');
        await sc.search('lawl');
        expect(clearResults).not.toHaveBeenCalled();
        await sc.search('');
        expect(clearResults).toHaveBeenCalled();
    });

    test('starting workers', async () => {
        // NOTE: right now, none of the worker initialization code runs in jest, so this is useless.
        await sc.startWorkersAndListener(SearcherType.FUZZYSORT);
    });

    test('cleanup', async () => {
        await sc.cleanup();
    });

    test('handler cancel', async () => {
        const message: SearchWorkerResponseMessage =  {
            resultType: SearchWorkerResponseType.CANCELED,
            payload: {
                dbIdentifier,
                query,
                searchID,
            }
        }

        const ev = new MessageEvent('message', {data: message});

        // Check that we do not try to update progressbars with results
        // from a canceled search.
        sc.validity.isInvalidated = jest.fn(() => true);
        await sc.searchWorkerReplyHandler(ev);
        expect(genUpdateDisplayForSearchEvent).toBeCalledTimes(0);

        sc.validity.isInvalidated = jest.fn(() => false);
        await sc.searchWorkerReplyHandler(ev);
        expect(genUpdateDisplayForSearchEvent).toBeCalledTimes(1);
    });

    test('handler search success', async () => {
        const markSearchCompleted = jest.spyOn(sc.validity, 'markSearchCompleted');

        const message: SearchWorkerResponseMessage = {
            resultType: SearchWorkerResponseType.SEARCH_SUCCESS,
            payload: {
                dbIdentifier,
                query,
                results,
                searchID,
            },
        };
        const ev = new MessageEvent('message', {data: message});

        sc.validity.isInvalidated = jest.fn(() => true);
        await sc.searchWorkerReplyHandler(ev);
        expect(genUpdateDisplayForSearchEvent).toBeCalledTimes(0);
        expect(genAddResultsCallback).toBeCalledTimes(0);
        expect(markSearchCompleted).toBeCalledTimes(0);

        sc.validity.isInvalidated = jest.fn(() => false);
        await sc.searchWorkerReplyHandler(ev);
        expect(genUpdateDisplayForSearchEvent).toBeCalledTimes(1);
        expect(genAddResultsCallback).toBeCalledTimes(1);
        expect(markSearchCompleted).toBeCalledTimes(1);
    });

    test('handler search failure', async () => {
        const searchSpecificDB = sc.searchWorkerManager.searchSpecificDB;

        const failure = SearchFailure.SearchedBeforePrepare;
        const message: SearchWorkerResponseMessage = {
            resultType: SearchWorkerResponseType.SEARCH_FAILURE,
            payload: {
                dbIdentifier,
                query,
                searchID,
                failure,
            },
        };
        const ev = new MessageEvent('message', {data: message});

        sc.validity.acquireRetry = jest.fn(() => false);
        sc.validity.isInvalidated = jest.fn(() => true);
        await sc.searchWorkerReplyHandler(ev);
        expect(genUpdateDisplayForSearchEvent).toBeCalledTimes(0);
        expect(genAddResultsCallback).toBeCalledTimes(0);
        expect(searchSpecificDB).toBeCalledTimes(0);

        sc.validity.isInvalidated = jest.fn(() => false);
        await sc.searchWorkerReplyHandler(ev);
        expect(genUpdateDisplayForSearchEvent).toBeCalledTimes(1);
        expect(genAddResultsCallback).toBeCalledTimes(0);
        expect(searchSpecificDB).toBeCalledTimes(0);

        // Check that we only run retries when the search hasn't been
        // invalidated, and acquireRetry returns true.
        sc.validity.acquireRetry = jest.fn(() => true);
        await sc.searchWorkerReplyHandler(ev);
        expect(searchSpecificDB).toBeCalledTimes(1);


    });

    test('handler db load status update - empty', async () => {
        const searchSpecificDB = sc.searchWorkerManager.searchSpecificDB;

        const stateDelta = {};
        const message: SearchWorkerResponseMessage = {
            resultType: SearchWorkerResponseType.DB_LOAD_STATUS_UPDATE,
            payload: {
                dbIdentifier,
                stateDelta,
            },
        };
        const ev = new MessageEvent('message', {data: message});
        await sc.searchWorkerReplyHandler(ev);

        expect(searchSpecificDB).toBeCalledTimes(0);
    });

    test('handler db load status update - fully loaded', async () => {
        const searchSpecificDB = sc.searchWorkerManager.searchSpecificDB;
        const stateDelta = {isFullyLoaded: true};
        const message: SearchWorkerResponseMessage = {
            resultType: SearchWorkerResponseType.DB_LOAD_STATUS_UPDATE,
            payload: {
                dbIdentifier,
                stateDelta,
            },
        };
        const ev = new MessageEvent('message', {data: message});

        sc.validity.isInvalidated = jest.fn(() => true);
        await sc.searchWorkerReplyHandler(ev);
        expect(searchSpecificDB).toBeCalledTimes(0);

        sc.validity.isInvalidated = jest.fn(() => false);
        await sc.searchWorkerReplyHandler(ev);
        expect(searchSpecificDB).toBeCalledTimes(1);

        // Only affects timers and logging
        sc.checkIfAllDBLoadedCallback = jest.fn(() => true);
        await sc.searchWorkerReplyHandler(ev);
        expect(searchSpecificDB).toBeCalledTimes(2);
    });

    test('handler unknown message', async () => {
        const searchSpecificDB = sc.searchWorkerManager.searchSpecificDB;
        const clearResults = jest.spyOn(sc, 'clearResultsCallback');
        const markSearchCompleted = jest.spyOn(sc.validity, 'markSearchCompleted');
        const message: any = {
            WUT: 1231231,
            lawl: "lakwjlk",
        };
        const ev = new MessageEvent('message', {data: message});

        console.warn = jest.fn();

        await sc.searchWorkerReplyHandler(ev);
        expect(searchSpecificDB).toBeCalledTimes(0);
        expect(genUpdateDisplayForSearchEvent).toBeCalledTimes(0);
        expect(genUpdateDisplayForDBLoadEvent).toBeCalledTimes(0);
        expect(genClearResultsCallback).toBeCalledTimes(0);
        expect(genAddResultsCallback).toBeCalledTimes(0);
        expect(getNewestQuery).toBeCalledTimes(0);
        expect(clearResults).toBeCalledTimes(0);
        expect(markSearchCompleted).toBeCalledTimes(0);
    });
});
