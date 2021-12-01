import {area, AreaNode, LocationTreeHandler} from "./utils";

const FAKE_PREFIX = "FAKE";

type FakeDisplayArea = "top" | "0" | "1" | "1_0" | "1_0_0" | "1_1" | "2";
type FakeDisplayType = "title" | "description" | "extra_info";

const fakeAreaMap: AreaNode<FakeDisplayArea, FakeDisplayType> = area("top", [
    area("0", ["title"]) as AreaNode<FakeDisplayArea, FakeDisplayType>,
    area("1", [
        area("1_0", [
            area("1_0_0", ["description"]),
            "extra_info",
        ]),
        area("1_1", []),
    ]),
    area("2", ["title"]),
]);

test('test insertion', () => {
    const treeHandler = new LocationTreeHandler(FAKE_PREFIX, fakeAreaMap);
    const tree = treeHandler.generateEmptyTree();
    treeHandler.insertInto(tree, "title", "FAKE_TITLE");
    treeHandler.insertInto(tree, "title", "ANOTHER_FAKE_TITLE");
    treeHandler.insertInto(tree, "description", "FAKE_DESCRIPTION");
    treeHandler.insertInto(tree, "extra_info", "FAKE_EXTRA_INFO_SON");
    //console.log((tree.contents[0] as unknown as AreaNode<FakeDisplayArea, FakeDisplayType>).contents);
    //treeHandler.getAsNestedDivs(tree);
});

test('test raw array mode', () => {
    const treeHandler = new LocationTreeHandler<FakeDisplayArea, FakeDisplayType, string>(FAKE_PREFIX, fakeAreaMap);
    const tree = treeHandler.generateEmptyTree();
    treeHandler.insertInto(tree, "title", "FAKE_TITLE");
    treeHandler.insertInto(tree, "title", "ANOTHER_FAKE_TITLE");
    treeHandler.insertInto(tree, "description", "FAKE_DESCRIPTION");
    treeHandler.insertInto(tree, "extra_info", "FAKE_EXTRA_INFO_SON");
    const rawArrays = treeHandler.getAsRawArrays(tree);
    expect(rawArrays).toStrictEqual(
        [
            [
                [
                    "FAKE_TITLE",
                    "ANOTHER_FAKE_TITLE",
                ],
            ],
            [
                [
                    [
                        [
                            "FAKE_DESCRIPTION",
                        ],
                    ],
                    [
                        "FAKE_EXTRA_INFO_SON",
                    ],
                ],
                [],
            ],
            [
                [
                    "FAKE_TITLE",
                    "ANOTHER_FAKE_TITLE",
                ],
            ],
        ]

    );
});

test('test divs mode', () => {
    const treeHandler = new LocationTreeHandler<FakeDisplayArea, FakeDisplayType, string>(FAKE_PREFIX, fakeAreaMap);
    const tree = treeHandler.generateEmptyTree();
    treeHandler.insertInto(tree, "title", "FAKE_TITLE");
    treeHandler.insertInto(tree, "title", "ANOTHER_FAKE_TITLE");
    treeHandler.insertInto(tree, "description", "FAKE_DESCRIPTION");
    treeHandler.insertInto(tree, "extra_info", "FAKE_EXTRA_INFO_SON");
    const div = treeHandler.getAsNestedDivs(tree, false);
    expect(div.props["className"]).toBe("FAKE-top");
    // TODO: handle inserted elements
    expect(div.props["children"][1].props["className"]).toBe("FAKE-1");
});
