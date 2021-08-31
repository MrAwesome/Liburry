export interface AreaNode<N, C> {
    isArea: true,
    name: N,
    contents: (C | AreaNode<N, C>)[],
}

export function area<N, C>(name: N, contents: (C | AreaNode<N, C>)[]): AreaNode<N, C> {
    return {
        isArea: true,
        name,
        contents,
    };
}

type TreeLocationIndex = number[];
type RecursiveTreeArrayOnly<T> = (T | RecursiveTreeArrayOnly<T>)[]

// XXX TODO: creating/populating one of these for every entrycontainer is far too much overhead.
//           how can you pass one around with a set locationmap / tree, but the tree is empty every time it's used? copy/clear?
export class LocationTreeHandler<DA extends string, FT extends string, TreeElem> {
    private readonly locationMap: Map<FT, TreeLocationIndex[]>;

    constructor(
        private cssPrefix: string,
        private areaLayout: AreaNode<DA, FT>,
    ) {
        this.createTreeIndexMap = this.createTreeIndexMap.bind(this);
        this.generateEmptyTree = this.generateEmptyTree.bind(this);

        this.locationMap = new Map();
        this.createTreeIndexMap([], areaLayout);
    }

    createTreeIndexMap(indices: number[], parentArea: AreaNode<DA, FT>) {
        const {contents} = parentArea;
        contents.forEach((entry, i) => {
            const internalIndices = [...indices, i];
            if ((entry as AreaNode<DA, FT>).isArea === true) {
                const area = entry as AreaNode<DA, FT>;
                this.createTreeIndexMap(internalIndices, area);
            } else {
                const item = entry as FT;
                const existing = this.locationMap.get(item) ?? [];
                this.locationMap.set(item, [...existing, internalIndices]);
            }
        });
    }

    generateEmptyTree(): AreaNode<DA, TreeElem[]> {
        return this.generateEmptyTreeHelper(this.areaLayout);
    }

    // NOTE: If too much time is spent here, the generated empty tree can be attached to the class then
    //       deepcopied out for each call.
    private generateEmptyTreeHelper(parentArea: AreaNode<DA, FT>): AreaNode<DA, TreeElem[]> {
        const oldName = parentArea.name;
        const oldContents = parentArea.contents;
        const newContents = oldContents.map((entry) => {
            if ((entry as AreaNode<DA, FT>).isArea === true) {
                const newArea = entry as AreaNode<DA, FT>;
                return this.generateEmptyTreeHelper(newArea);
            } else {
                return [] as TreeElem[];
            }
        });
        return area(oldName, newContents);
    }

    private getLocations(fieldType: FT): TreeLocationIndex[] | null {
        return this.locationMap.get(fieldType) ?? null;
    }

    private insertAtLocation(parentArea: AreaNode<DA, TreeElem[]>, loc: TreeLocationIndex, value: TreeElem): void {
        if (loc.length === 1) {
            const targetSlot = parentArea.contents[loc[0]];
            // NOTE: as long as the math for generating this class is correct,
            //       targetSlot should always be TreeElem[]
            const elemList = targetSlot as TreeElem[];
            // TODO: decide whether to push span here
            elemList.push(value);
        } else {
            const targetArea = parentArea.contents[loc[0]] as AreaNode<DA, TreeElem[]>;
            const newLoc = loc.slice(1);
            this.insertAtLocation(targetArea, newLoc, value);
        }
    }

    insertInto(areaNode: AreaNode<DA, TreeElem[]>, fieldType: FT, value: TreeElem): void {
        // NOTE: Can warn here if no action will be taken due to fieldType missing/mismatch
        const locs = this.getLocations(fieldType);
        if (locs !== null) {
            locs.forEach((loc) => {
                this.insertAtLocation(areaNode, loc, value);
            });
        }
    }

    private getAsNestedDivsHelper(parentArea: AreaNode<DA, TreeElem[]>): [JSX.Element | null, number] {
        const jsxContentsAndSum = parentArea.contents.map((item) => {
            if ((item as AreaNode<DA, TreeElem[]>).isArea === true) {
                const newArea = item as AreaNode<DA, TreeElem[]>;
                return this.getAsNestedDivsHelper(newArea);
            } else {
                const elemList = item as TreeElem[];

                // TODO: don't use i as key? Ensure elem is stringish?
                // TODO: determine a className if needed
                const jsxList = elemList.map((elem, i) =>
                    <span key={i}>{elem}</span>
                );
                return [jsxList, elemList.length] as [JSX.Element[], number];
            }
        });

        let totalCount = 0;
        jsxContentsAndSum.forEach(([_, sum]) => totalCount += sum);

        if (totalCount > 0) {
            const cssName = parentArea.name;
            const jsxContents = jsxContentsAndSum.map(([j, _]) => j);
            return [<div className={this.cssPrefix + "-" + cssName} key={cssName as string}>{jsxContents}</div>, totalCount];
        } else {
            return [null, 0];
        }
    }

    getAsNestedDivs(areaNode: AreaNode<DA, TreeElem[]>): JSX.Element {
        return this.getAsNestedDivsHelper(areaNode)[0] ?? <></>;
    }

    private getAsRawArraysHelper(parentArea: AreaNode<DA, TreeElem[]>): RecursiveTreeArrayOnly<TreeElem[]> {
        const rawContents = parentArea.contents.map((item) => {
            if ((item as AreaNode<DA, TreeElem[]>).isArea === true) {
                const newArea = item as AreaNode<DA, TreeElem[]>;
                return this.getAsRawArraysHelper(newArea);
            } else {
                const elemList = item as TreeElem[];
                return elemList as TreeElem[];
            }
        });
        return rawContents as RecursiveTreeArrayOnly<TreeElem[]>;
        //?? [] as RecursiveTreeArrayOnly<TreeElem[]>
    }

    getAsRawArrays(areaNode: AreaNode<DA, TreeElem[]>): RecursiveTreeArrayOnly<TreeElem[]> {
        return this.getAsRawArraysHelper(areaNode);
    }

}