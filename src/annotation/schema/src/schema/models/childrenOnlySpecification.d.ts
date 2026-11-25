export declare enum ChildrenOnlyType {
    Normal = "normal",
    Sort = "sort"
}
export type ChildrenOnlySpecification = NormalSpecification | SortSpecification;
export type NormalSpecification = {
    type: ChildrenOnlyType.Normal;
};
export type SortSpecification = {
    type: ChildrenOnlyType.Sort;
};
