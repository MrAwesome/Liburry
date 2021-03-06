import SearchValidityManager from "./SearchValidityManager";

test('search validity', () => {
    const vman = new SearchValidityManager(false);
    const searchID = vman.currentSearchID;
    vman.bump();
    expect(vman.isInvalidated(searchID)).toBe(false);
    vman.invalidate();
    expect(vman.isInvalidated(searchID)).toBe(true);
});

test('search retry', () => {
    const dbIdentifier = "fakedb";
    const vman = new SearchValidityManager(false);
    const searchID = vman.currentSearchID;

    const numRetries = vman.retriesRemaining(dbIdentifier, searchID);
    const gotRetry = vman.acquireRetry(dbIdentifier, searchID);
    expect(gotRetry).toBe(true);
    const remRetries = vman.retriesRemaining(dbIdentifier, searchID);
    expect(remRetries).toBe(numRetries - 1);
});

test('search completion', () => {
    const query = "fakesearch";
    const dbs = ["fake_mk", "fake_emb", "fake_gik"];
    const vman = new SearchValidityManager(false);
    const searchID = vman.currentSearchID;
    vman.startSearches(0, query, dbs);
    expect(vman.checkAllSearchesCompleted(searchID)).toBe(false);
    vman.markSearchCompleted(dbs[0], searchID);
    vman.markSearchCompleted(dbs[1], searchID);
    expect(vman.checkAllSearchesCompleted(searchID)).toBe(false);
    vman.markSearchCompleted(dbs[2], searchID);
    expect(vman.checkAllSearchesCompleted(searchID)).toBe(true);
});
