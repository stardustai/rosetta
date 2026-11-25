export type Rect = Position & {
    width: number;
    height: number;
};
export type RangeSelection = {
    start: number;
    end: number;
};
export type TextSelection = RangeSelection;
export type Position = {
    left: number;
    top: number;
};
export type PointCloudPosition = {
    x: number;
    y: number;
    z: number;
};
